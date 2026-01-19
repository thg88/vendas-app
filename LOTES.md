# 📦 Sistema de Controle de Estoques por Lote

## Visão Geral

Sistema completo para gerenciar estoques por lote mensal, permitindo que você:
- Abra um novo lote de entrada (mensal)
- Adicione produtos a esse lote
- Feche o lote quando terminar de adicionar produtos
- Consulte histórico de lotes anteriores
- Reabra lotes se necessário

---

## 🚀 Quick Start (2 minutos)

### 1. Iniciar Backend
```bash
cd backend
npm run dev
# Espere: "Servidor rodando na porta 5000"
```

### 2. Iniciar Frontend (outro terminal)
```bash
cd frontend
npm run dev
# Acesse: http://localhost:3000
```

### 3. Login
- Use suas credenciais ou crie um novo usuário

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

---

## 📋 Como Funciona?

### Fluxo Mensal Típico

```
1️⃣ RECEBIMENTO DO MÊS
   └─ Você recebe mercadorias do fornecedor
   
2️⃣ ABRIR NOVO LOTE
   └─ Clique em "Controle de Lotes" → "Novo Lote"
   └─ Dê um nome: "LOTE-JAN-2026"
   
3️⃣ ADICIONAR PRODUTOS
   └─ Para cada produto recebido:
      • Clique "Adicionar Produto"
      • Preencha nome, preço, quantidade e tipo
      • Clique "Adicionar Produto"
      • Repita...
   
4️⃣ FECHAR LOTE
   └─ Quando terminar de adicionar todos
   └─ Clique "Fechar Lote"
   └─ ⚠️ Não poderá adicionar mais produtos
   
5️⃣ AGUARDAR PRÓXIMO MÊS
   └─ Próximo mês, repita de 2️⃣
```

---

## 🔑 Funcionalidades

| Ação | Como Fazer | Restrições |
|------|-----------|-----------|
| Criar lote | Novo Lote → Número → Criar | Apenas 1 aberto por vez |
| Adicionar produto | Adicionar Produto → Preencher → Adicionar | Apenas em lote aberto |
| Fechar lote | Fechar Lote → Confirmar | Bloqueia novos produtos |
| Reabrir lote | Histórico → Reabrir → Confirmar | Lote deve estar fechado |
| Deletar lote vazio | Histórico → Deletar → Confirmar | Apenas lotes vazios |

---

## 💾 Estrutura do Banco de Dados

### Tabela: LOTES
```
id              → ID único do lote
numero_lote     → Nome do lote (ex: LOTE-JAN-2026)
status          → 'aberto' ou 'fechado'
tipo            → Tipo de produto (Roupas ou Semi-joias)
data_abertura   → Quando foi criado
data_fechamento → Quando foi fechado
data_recebimento → Data de recebimento
data_finalizacao → Data de finalização
observacoes     → Notas sobre o lote
created_at      → Timestamp de criação
```

### Tabela: PRODUTOS
```
id              → ID único do produto
nome            → Nome do produto
descricao       → Descrição (opcional)
preco           → Preço unitário
estoque         → Quantidade em estoque
estoque_original → Quantidade original
tipo            → Tipo (Roupas ou Semi-joias)
lote_id         → 🔑 Qual lote este produto pertence
created_at      → Timestamp de criação
```

---

## 🎨 Interface Principal

### Quando há Lote Aberto

```
┌─────────────────────────────────────────┐
│ 🔒 LOTE-JAN-2026                        │
│ Lote Aberto                             │
│ Abertura: 14/01/2026                    │
│                                         │
│ Produtos do Lote        [+ Adicionar]   │
│ ┌─────────────────────────────────────┐ │
│ │ Nome  │ Tipo  │ Preço  │ Qtd │ Total│ │
│ │Camisa │Roupas │ 29,90  │ 50  │1.495│ │
│ │Calça  │Roupas │ 89,90  │ 30  │2.697│ │
│ │Colar  │Joias  │ 15,00  │100  │1.500│ │
│ └─────────────────────────────────────┘ │
│                 Total: R$ 5.692,00      │
│                         [🔒 Fechar Lote]│
└─────────────────────────────────────────┘
```

### Histórico de Lotes (lado direito)
```
┌──────────────────────┐
│ Histórico de Lotes   │
├──────────────────────┤
│ LOTE-JAN-2026        │
│ 14/01/2026 | Fechado │
│ [Reabrir] [Deletar]  │
├──────────────────────┤
│ LOTE-FEV-2026        │
│ 01/02/2026 | Fechado │
│ [Reabrir] [Deletar]  │
├──────────────────────┤
│ ...                  │
└──────────────────────┘
```

---

## 🔧 Arquivos Importantes

### Backend
- `backend/src/controllers/lotesController.js` ← Lógica dos lotes
- `backend/src/routes/lotesRoutes.js` ← Rotas da API
- `backend/src/database.js` ← Tabelas PostgreSQL

### Frontend
- `frontend/src/components/LotesManagement.jsx` ← Interface dos lotes
- `frontend/src/components/ProductsManagement.jsx` ← Integração com lotes
- `frontend/src/services/api.js` ← Chamadas da API

---

## ⚠️ Restrições Importantes

- ✅ Apenas **1 lote pode estar aberto** por vez
- ✅ Lote **fechado bloqueia novos produtos**
- ✅ Produtos em lote **não podem ser editados individualmente**
- ✅ Todos os dados **salvos no PostgreSQL**
- ✅ Histórico de lotes **sempre disponível para consulta**

---

## 📝 Changelog

### v1.0 - Lançamento Inicial
- Sistema de lotes implementado
- Gerenciar abertura e fechamento de lotes
- Associação de produtos a lotes
- Histórico completo de lotes
- Interface intuitiva com validações

---

## 🆘 Troubleshooting

**Problema**: Não consigo adicionar produto ao lote
- **Solução**: Verifique se o lote está aberto (status = 'aberto')

**Problema**: Lote não aparece na lista
- **Solução**: Recarregue a página (F5) ou verifique a conexão com o banco

**Problema**: Erro ao fechar lote
- **Solução**: Verifique se há produtos adicionados ao lote

---

## 📚 Para Desenvolvedores

Veja `GUIDE_CONTINUAR_DESENVOLVENDO.md` para detalhes de implementação e fluxos de código.
