# 🚀 Quick Start - Sistema de Lotes

## ⏱️ Começar em 2 minutos

### 1. Iniciar Backend
```bash
cd backend
npm start
# Espere: "Servidor rodando na porta 5000"
```

### 2. Iniciar Frontend (outro terminal)
```bash
cd frontend
npm run dev
# Acesse: http://localhost:3000
```

### 3. Login
- Username: (use existente ou crie um novo)
- Password: (sua senha)

### 4. Acessar Lotes
1. Clique em **"Controle de Lotes"** (novo menu com ícone de caixas)
2. Clique em **"Novo Lote"**
3. Digite: `LOTE-JAN-2026`
4. Clique **"Criar Lote"**

### 5. Adicionar Produtos
1. Clique **"Adicionar Produto"**
2. Preencha:
   - Nome: `Camiseta`
   - Preço: `29.90`
   - Quantidade: `50`
   - Tipo: `Roupas`
3. Clique **"Adicionar Produto"**
4. Repita para mais produtos

### 6. Fechar Lote
1. Clique **"🔒 Fechar Lote"**
2. Confirme
3. ✅ Feito! Seu lote está fechado

## 📋 O que Mudou?

### Novo Menu
- **Controle de Lotes** ← Clique aqui!

### Novo Componente
- Gerenciar lotes (abrir, adicionar, fechar)
- Ver histórico de lotes
- Reabrir lotes se necessário

### Tabela de Produtos
- Coluna "Lote" mostra se produto está em lote
- Botões desabilitados para produtos em lote

## 🔑 Funcionalidades

| Ação | Como Fazer |
|------|-----------|
| Criar lote | Novo Lote → Número → Criar |
| Adicionar produto | Adicionar Produto → Preencher → Adicionar |
| Fechar lote | Fechar Lote → Confirmar |
| Reabrir lote | Histórico → Reabrir → Confirmar |
| Deletar lote vazio | Histórico → Deletar → Confirmar |

## ⚠️ Importante

- ✅ Apenas **1 lote pode estar aberto** por vez
- ✅ Lote **fechado bloqueia novos produtos**
- ✅ Produtos em lote **não podem ser editados**
- ✅ Todos os dados **salvos no banco de dados**

## 🔧 Arquivos Importantes

### Backend
- `backend/src/controllers/lotesController.js` ← Lógica dos lotes
- `backend/src/routes/lotesRoutes.js` ← Rotas da API
- `backend/src/database.js` ← Tabela de lotes

### Frontend  
- `frontend/src/components/LotesManagement.jsx` ← Interface dos lotes
- `frontend/src/services/api.js` ← Chamadas da API
- `frontend/src/pages/Dashboard.jsx` ← Menu principal

## 📚 Documentação Completa

Leia para mais informações:
- `README_LOTES.md` - Visão geral
- `MANUAL_LOTES.md` - Como usar
- `TESTE_LOTES.md` - Como testar
- `SUMARIO_TECNICO_LOTES.md` - Detalhes técnicos

## 💡 Exemplo Real

```
Você recebe mercadoria dia 1º de janeiro

1️⃣ Abre "Controle de Lotes"
2️⃣ Clica "Novo Lote"
3️⃣ Escreve "LOTE-JAN-2026"
4️⃣ Clica "Criar Lote"
5️⃣ Para cada produto recebido:
   • Clica "Adicionar Produto"
   • Preenche dados
   • Clica "Adicionar"
6️⃣ Quando termina:
   • Clica "Fechar Lote"
7️⃣ Próximo mês:
   • Repete tudo com "LOTE-FEV-2026"
```

## ✅ Verificar se Funciona

1. Backend rodando? → Terminal mostra "Servidor rodando na porta 5000"
2. Frontend rodando? → Browser mostra a aplicação
3. Menu "Controle de Lotes" aparece? → Está funcionando!
4. Conseguiu criar lote? → 100% pronto!

## 🆘 Se Algo Não Funcionar

| Problema | Solução |
|----------|---------|
| Menu não aparece | Refresh na página (F5) |
| Botão "Novo Lote" desabilitado | Feche o lote aberto primeiro |
| API error | Reinicie o backend (`npm start`) |
| Banco vazio | Será criado automaticamente |

## 🎯 Próximos Passos

Depois de testar:
1. Crie seus próprios lotes
2. Adicione seus produtos
3. Feche os lotes
4. Veja no histórico

## 📊 Status

- ✅ Backend: Pronto
- ✅ Frontend: Pronto
- ✅ Database: Pronto
- ✅ Documentação: Pronta
- ✅ Testes: Prontos

**Tudo 100% funcional!** 🚀

---

Dúvidas? Veja a documentação completa!
