# Melhorias no Onboarding de Compositor - STATUS E PENDÊNCIAS

## ✅ IMPLEMENTADO (Concluído nesta sessão)

### 1. Alterações Visuais
- ✅ **"Grupo/Banda" alterado para "Grupo"** na seleção de tipo de compositor
- ✅ **Campos de senha adicionados** (Senha + Confirmar Senha) na etapa 3
- ✅ **Validação de senha** implementada (mínimo 6 caracteres + confirmação)

### 2. Integração com Banco de Dados
- ✅ **Gêneros Musicais** agora carregam as categorias do banco de dados
- ✅ Sistema com **fallback** para categorias padrão caso a API falhe
- ✅ Loading state enquanto carrega categorias

### 3. Link Redundante Removido
- ✅ Removido link "Não tem uma conta? Registre-se aqui" da página de onboarding

---

## ⏳ PENDÊNCIAS CRÍTICAS (Próximos Passos)

### 1. 🔴 **PROBLEMA: Dashboard Compositor Aparece Preto**
**Descrição:** Após concluir o cadastro, usuário é redirecionado para `/composer/dashboard` mas a página fica preta.

**Causa Provável:**
- Usuário não está autenticado após completar o cadastro
- Componente `ComposerDashboard` depende de `user.id` do `useAuth()`
- Se não há usuário autenticado, a página não carrega conteúdo

**Solução Necessária:**
```typescript
// No handleFinish() do ComposerOnboarding.tsx
const handleFinish = async () => {
  try {
    // 1. Criar conta de usuário na API
    // 2. Fazer login automaticamente
    // 3. Aguardar autenticação completar
    // 4. ENTÃO redirecionar para dashboard
    navigate('/composer/dashboard');
  } catch (error) {
    // Mostrar erro ao usuário
  }
};
```

---

### 2. 🟡 **SISTEMA DE GESTOR DE CONTA (Feature Complexa)**

#### Conceito
Permitir que um usuário comum gerencie a conta de um compositor sem ter acesso direto às credenciais do compositor.

#### Casos de Uso

**Caso A: Usuário Já Cadastrado Como Compositor**
- Usuário já tem perfil de compositor
- Deseja adicionar um gestor de conta
- Gestor pode ser outra pessoa (assistente, produtor, etc.)

**Caso B: Novo Cadastro de Compositor por Gestor**
- Pessoa cria perfil de compositor para outra pessoa/banda
- Usa próprio email para gerenciar
- Compositor não precisa enviar documentos para gestor gerenciar

#### Funcionalidades Necessárias

**2.1. Campo de Busca de Gestor (no Onboarding)**
```typescript
interface AccountManager {
  userId: string;
  email: string;
  nome: string;
  canPublish: boolean;
  canEdit: boolean;
  canViewAnalytics: boolean;
}

// Adicionar na etapa 3 ou criar etapa nova:
<div>
  <label>Gestor de Conta (Opcional)</label>
  <input 
    type="email"
    placeholder="Email do gestor"
    onBlur={handleSearchManager}
  />
  {managerFound && (
    <div>
      ✅ {managerFound.nome} será gestor desta conta
    </div>
  )}
</div>
```

**2.2. Pré-preencher Dados de Usuário Já Cadastrado**
```typescript
// Se usuário já está logado ao acessar onboarding:
useEffect(() => {
  if (user) {
    setFormData(prev => ({
      ...prev,
      email: user.email,
      phone: user.phone || '',
      // Outros campos do perfil existente
    }));
  }
}, [user]);
```

**2.3. Barra de Aviso no Dashboard**
```tsx
// ComposerDashboard.tsx
{isManagingAccount && (
  <div className="bg-orange-500 text-white px-6 py-3 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <AlertCircle className="w-5 h-5" />
      <span className="font-medium">
        Você está gerenciando a conta de: {composerName}
      </span>
    </div>
    <button 
      onClick={handleStopManaging}
      className="text-white underline"
    >
      Voltar para minha conta
    </button>
  </div>
)}
```

**2.4. Menu no Perfil do Usuário**
```tsx
// UserMenu.tsx (widget dropdown)
<div className="profile-dropdown">
  <Link to="/perfil">Meu Perfil</Link>
  <Link to="/configuracoes">Configurações</Link>
  
  {/* Novo item */}
  {user.managedComposers?.length > 0 && (
    <>
      <hr />
      <div className="text-xs text-gray-400 px-3 py-1">
        Gerenciar Contas
      </div>
      {user.managedComposers.map(composer => (
        <Link 
          key={composer.id}
          to={`/composer/dashboard?manage=${composer.id}`}
        >
          🎵 {composer.nome}
        </Link>
      ))}
    </>
  )}
  
  <hr />
  <button onClick={handleLogout}>Sair</button>
</div>
```

#### Estrutura de Banco de Dados Necessária

```sql
-- Nova tabela: gestores de conta
CREATE TABLE compositores_gestores (
  id SERIAL PRIMARY KEY,
  compositor_id INT NOT NULL REFERENCES compositores(id),
  usuario_id INT NOT NULL REFERENCES usuarios(id),
  permissoes JSON DEFAULT '{"publish": true, "edit": true, "viewAnalytics": true}',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT true,
  UNIQUE(compositor_id, usuario_id)
);

-- Índices
CREATE INDEX idx_compositores_gestores_compositor ON compositores_gestores(compositor_id);
CREATE INDEX idx_compositores_gestores_usuario ON compositores_gestores(usuario_id);
```

#### Fluxo de Implementação Sugerido

**Fase 1: Estrutura Base**
1. Criar tabela `compositores_gestores`
2. Criar API endpoints:
   - `POST /api/compositores/{id}/gestores` - Adicionar gestor
   - `GET /api/compositores/{id}/gestores` - Listar gestores
   - `DELETE /api/compositores/{id}/gestores/{userId}` - Remover gestor
   - `GET /api/usuarios/{id}/compositores-gerenciados` - Listar contas gerenciadas

**Fase 2: Interface de Onboarding**
1. Adicionar campo de busca de email na etapa 3 ou criar etapa nova
2. Implementar busca de usuário por email
3. Permitir seleção de gestor encontrado
4. Salvar relacionamento ao finalizar cadastro

**Fase 3: Pré-preenchimento**
1. Detectar se usuário está logado ao acessar onboarding
2. Pré-preencher email, telefone e outros dados do perfil
3. Mostrar aviso: "Usando dados da sua conta"

**Fase 4: Dashboard com Barra de Aviso**
1. Adicionar estado global de "conta sendo gerenciada"
2. Implementar barra laranja no topo do dashboard
3. Adicionar lógica para "voltar para minha conta"

**Fase 5: Menu do Usuário**
1. Buscar contas gerenciadas ao carregar perfil
2. Adicionar seção "Gerenciar Contas" no dropdown
3. Implementar navegação com parâmetro `?manage=ID`

---

### 3. 🟢 **VALIDAÇÕES E FEEDBACK**

#### Feedback de Senha
```tsx
// Adicionar abaixo dos campos de senha:
{formData.password && formData.password.length < 6 && (
  <p className="text-red-400 text-sm">
    Senha deve ter no mínimo 6 caracteres
  </p>
)}

{formData.password && formData.passwordConfirm && 
 formData.password !== formData.passwordConfirm && (
  <p className="text-red-400 text-sm">
    As senhas não coincidem
  </p>
)}

{formData.password && formData.password.length >= 6 && 
 formData.password === formData.passwordConfirm && (
  <p className="text-green-400 text-sm flex items-center gap-2">
    <CheckCircle className="w-4 h-4" />
    Senhas conferem
  </p>
)}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Imediato (Urgente)
- [ ] Implementar autenticação após cadastro
- [ ] Criar conta na API ao finalizar onboarding
- [ ] Fazer login automático
- [ ] Testar redirecionamento para dashboard

### Curto Prazo (1-2 dias)
- [ ] Adicionar feedback visual de senha
- [ ] Criar tabela `compositores_gestores` no banco
- [ ] Criar endpoints de API para gestores
- [ ] Implementar busca de usuário por email

### Médio Prazo (3-5 dias)
- [ ] Implementar campo de busca de gestor no onboarding
- [ ] Implementar pré-preenchimento de dados
- [ ] Adicionar barra laranja no dashboard
- [ ] Atualizar menu do usuário

### Longo Prazo (Features Extras)
- [ ] Sistema de permissões granulares para gestores
- [ ] Notificações para compositor quando gestor faz alterações
- [ ] Logs de auditoria de ações do gestor
- [ ] Painel de gestores na conta do compositor

---

## 🎯 PRIORIDADES

1. **CRÍTICO:** Corrigir problema do dashboard preto (autenticação)
2. **ALTO:** Adicionar feedback visual de senha
3. **MÉDIO:** Implementar sistema de gestor de conta
4. **BAIXO:** Melhorias adicionais de UX

---

## 📝 NOTAS TÉCNICAS

### Arquivos Principais
- `/src/pages/composer/ComposerOnboarding.tsx` - Formulário de cadastro
- `/src/pages/composer/ComposerDashboard.tsx` - Dashboard do compositor
- `/src/contexts/AuthContextMock.tsx` - Contexto de autenticação
- `/src/lib/api-client.ts` - Cliente de API

### Dependências
- `categoriasApi.listar()` - Buscar categorias do banco
- `useAuth()` - Hook de autenticação
- Sistema de rotas protegidas

---

**Última Atualização:** 19/10/2025
**Status Geral:** 40% Completo
