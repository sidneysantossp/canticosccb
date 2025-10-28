# 🔍 DIAGNÓSTICO - Acesso ao Vite Dev Server

## ❌ Problema
O navegador não está acessando o servidor Vite.

## ✅ Soluções

### Opção 1: Acessar pelo TERMINAL DO VITE
1. Com o `npm run dev` rodando, veja no terminal a linha que começa com "➜  Local:"
2. Copie o endereço completo (ex: `http://localhost:5175/`)
3. Cole EXATAMENTE esse endereço no navegador

### Opção 2: Abrir AUTOMATICAMENTE pelo Vite
1. Com o `npm run dev` rodando
2. Foque o terminal (clique nele)
3. Pressione a tecla `o` (de "open")
4. O Vite abre o navegador automaticamente

### Opção 3: Acessar pelo PREVIEW (build estático)
1. Pare o dev server (Ctrl+C)
2. Execute:
   ```bash
   npm run build
   npm run preview
   ```
3. Abra: `http://localhost:4173/`

### Opção 4: Testar TODOS os endereços possíveis
Cole cada um desses no navegador (em aba anônima):
- http://localhost:5173/
- http://localhost:5174/
- http://localhost:5175/
- http://127.0.0.1:5173/
- http://127.0.0.1:5174/
- http://127.0.0.1:5175/

## 🐛 Se NADA funcionar

### Verificar CONFLITO COM XAMPP
1. Pare o Apache do XAMPP
2. Reinicie o Vite: `npm run dev`
3. Tente acessar novamente

### Limpar CACHE do navegador
1. Abra o navegador em modo anônimo (Ctrl+Shift+N)
2. Tente acessar o endereço

### Ver ERROS no console do Vite
1. Olhe o terminal onde está rodando `npm run dev`
2. Se tiver erros vermelhos, me envie a mensagem completa

## 📊 Informações para DEBUG
- Porta padrão configurada: 5173
- Porta atual (se ocupada): 5175
- Framework: Vite 4.5.14
- Build: dist/
- Rotas ativas: `/`, `/login`, `/register`, `/termos`, `/privacidade`, `/disclaimer`
