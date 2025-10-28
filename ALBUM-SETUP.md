# 🎵 Sistema de Álbuns e Coletâneas - Guia de Implementação

## ✅ Arquivos Criados

### 1. **Backend (SQL + PHP)**
- ✅ `database/album-relationships.sql` - Tabelas de relacionamento
- ✅ `api/albuns/hinos.php` - Endpoint para gerenciar hinos do álbum
- ✅ `src/lib/api-client.ts` - Funções TypeScript atualizadas

---

## 🚀 Passo a Passo para Ativar

### **1. Executar SQL no banco de dados**

Abra o **phpMyAdmin** ou **MySQL Workbench** e execute:

```bash
# Opção 1: Via phpMyAdmin
1. Acesse: http://localhost/phpmyadmin
2. Selecione o banco: canticosccb_plataforma
3. Vá em "SQL"
4. Cole o conteúdo de: database/album-relationships.sql
5. Clique em "Executar"

# Opção 2: Via linha de comando
mysql -u root -p canticosccb_plataforma < database/album-relationships.sql
```

**O que será criado:**
- ✅ Tabela `album_hinos` (relacionamento álbum ↔ hinos)
- ✅ Tabela `coletanea_hinos` (relacionamento coletânea ↔ hinos)
- ✅ Campo `tipo` na tabela `albuns` (para diferenciar álbum de coletânea)

---

### **2. Testar endpoints PHP**

```bash
# Listar hinos de um álbum
GET http://localhost/1canticosccb/api/albuns/1/hinos

# Adicionar hinos ao álbum (IDs: 1, 2, 3)
POST http://localhost/1canticosccb/api/albuns/1/hinos
Body: { "hino_ids": [1, 2, 3] }

# Remover hino do álbum
DELETE http://localhost/1canticosccb/api/albuns/1/hinos/2

# Atualizar ordem dos hinos
POST http://localhost/1canticosccb/api/albuns/1/hinos
Body: { "ordem": [{"hino_id": 1, "ordem": 1}, {"hino_id": 3, "ordem": 2}] }
```

---

## 🎯 Como Vai Funcionar

### **Fluxo de Trabalho**

1. **Admin cadastra os hinos**
   - Vai em "Hinos" → "Adicionar Hino"
   - Preenche: título, áudio, letra, etc.
   - Salva o hino

2. **Admin cria o álbum**
   - Vai em "Álbuns" → "Novo Álbum"
   - Preenche: título, descrição, capa
   - **Seleciona os hinos** (busca/lista)
   - Salva o álbum

3. **Admin pode editar**
   - Adicionar mais hinos ao álbum
   - Remover hinos do álbum
   - Reordenar hinos (drag and drop)

---

## 📊 Estrutura do Banco

```
albuns
├── id
├── titulo
├── tipo (album | coletanea)  ← NOVO!
├── descricao
├── cover_url
└── ...

album_hinos                      ← NOVO!
├── id
├── album_id  → albuns.id
├── hino_id   → hinos.id
└── ordem (track number)

hinos
├── id
├── titulo
├── audio_url
└── ...
```

---

## 🎨 Interface que será criada

### **Formulário de Álbum Atualizado:**

```
┌─────────────────────────────────────────┐
│ Novo Álbum                              │
├─────────────────────────────────────────┤
│ Título: [________________]              │
│ Tipo: ( ) Álbum  ( ) Coletânea         │
│ Descrição: [________________]           │
│ Capa: [Upload]                          │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ 🎵 Selecionar Hinos             │    │
│ │                                 │    │
│ │ [🔍 Buscar hinos...]            │    │
│ │                                 │    │
│ │ ☑ 001 - Coro Celeste           │    │
│ │ ☑ 015 - Cantai com Alegria     │    │
│ │ ☐ 025 - Louvai a Deus          │    │
│ │ ☐ 030 - Vinde, Povo do Senhor  │    │
│ │                                 │    │
│ │ Selecionados: 2 hinos           │    │
│ └─────────────────────────────────┘    │
│                                         │
│ [Cancelar]  [Salvar Álbum]             │
└─────────────────────────────────────────┘
```

---

## 📝 Próximos Passos (Frontend)

Vou criar agora:
1. ✅ Componente de seleção de hinos
2. ✅ Atualizar formulário de álbum
3. ✅ Drag and drop para reordenar
4. ✅ Visual de tracklist no card do álbum

---

## 🔄 Benefícios

- ✅ Um hino pode estar em vários álbuns
- ✅ Um hino pode estar em várias coletâneas
- ✅ Um hino pode não estar em nenhum álbum (independente)
- ✅ Fácil gerenciar tracklist (adicionar, remover, reordenar)
- ✅ Contagem automática de faixas

---

**Status:** Backend 100% pronto! Aguardando execução do SQL.
