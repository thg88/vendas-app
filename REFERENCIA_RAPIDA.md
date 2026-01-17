# 📚 REFERÊNCIA RÁPIDA - Sistema de Lotes

## 🔥 Comece Aqui

### Para Usuários
1. [QUICK_START_LOTES.md](./QUICK_START_LOTES.md) - 2 minutos
2. [MANUAL_LOTES.md](./MANUAL_LOTES.md) - 5 minutos

### Para Desenvolvedores
1. [QUICK_START_LOTES.md](./QUICK_START_LOTES.md) - 2 minutos
2. [SUMARIO_TECNICO_LOTES.md](./SUMARIO_TECNICO_LOTES.md) - 10 minutos
3. [GUIDE_CONTINUAR_DESENVOLVENDO.md](./GUIDE_CONTINUAR_DESENVOLVENDO.md) - 5 minutos

### Para QA/Testes
1. [TESTE_LOTES.md](./TESTE_LOTES.md) - 10 minutos
2. [CHECKLIST_LOTES.md](./CHECKLIST_LOTES.md) - 5 minutos

---

## ⚡ Comandos Rápidos

```bash
# Iniciar Backend
cd backend && npm start

# Iniciar Frontend
cd frontend && npm run dev

# Acessar BD SQLite
sqlite3 backend/vendas.db

# Ver tabelas
sqlite3 backend/vendas.db ".tables"

# Ver lotes
sqlite3 backend/vendas.db "SELECT * FROM lotes;"

# Ver produtos em lotes
sqlite3 backend/vendas.db "SELECT * FROM produtos WHERE lote_id IS NOT NULL;"
```

---

## 🎯 Funcionalidades Principais

| Ação | Onde | Como |
|------|------|------|
| **Criar Lote** | Dashboard → Controle de Lotes | Novo Lote → Preencher → Criar |
| **Adicionar Produto** | Dentro do Lote Aberto | Adicionar Produto → Preencher → Adicionar |
| **Fechar Lote** | Painel do Lote | Fechar Lote → Confirmar |
| **Reabrir Lote** | Histórico de Lotes | Reabrir → Confirmar |
| **Deletar Lote** | Histórico (apenas vazios) | Deletar → Confirmar |

---

## 📁 Arquivos Importantes

### Backend
```
backend/src/
├── controllers/lotesController.js    ← Lógica de lotes
├── routes/lotesRoutes.js             ← API endpoints
├── controllers/productController.js   ← Integração com lotes
├── database.js                       ← Tabelas (incluindo lotes)
└── server.js                         ← Registrar rotas
```

### Frontend
```
frontend/src/
├── components/LotesManagement.jsx    ← Interface dos lotes
├── components/ProductsManagement.jsx ← Proteção de produtos
├── pages/Dashboard.jsx               ← Menu principal
└── services/api.js                   ← Chamadas da API
```

---

## 🔗 URLs e Endpoints

### API Base
```
http://localhost:5000/api
```

### Endpoints Lotes
```
GET    /lotes                      → Listar todos os lotes
GET    /lotes/aberto/atual         → Lote aberto atual
GET    /lotes/:id                  → Detalhes do lote
GET    /lotes/:id/stats            → Estatísticas
POST   /lotes                       → Criar novo lote
PUT    /lotes/:id/fechar           → Fechar lote
PUT    /lotes/:id/reabrir          → Reabrir lote
DELETE /lotes/:id                  → Deletar lote
```

### Frontend
```
http://localhost:3000               → Aplicação
http://localhost:3000/login         → Login
http://localhost:3000/dashboard     → Dashboard
```

---

## 📋 Campos do Banco de Dados

### Tabela: LOTES
```sql
id               → INTEGER PRIMARY KEY
numero_lote      → TEXT UNIQUE
status           → TEXT ('aberto' ou 'fechado')
data_abertura    → DATETIME
data_fechamento  → DATETIME
observacoes      → TEXT
created_at       → DATETIME
```

### Tabela: PRODUTOS
```sql
id               → INTEGER PRIMARY KEY
nome             → TEXT
descricao        → TEXT
preco            → REAL
estoque          → INTEGER
tipo             → TEXT
lote_id          → INTEGER (FK para lotes)
created_at       → DATETIME
```

---

## 🔒 Regras de Validação

### Criação de Lote
- ✓ Número obrigatório
- ✓ Número único
- ✓ Apenas 1 lote aberto por vez
- ✓ Observações opcionais

### Adição de Produto
- ✓ Nome obrigatório
- ✓ Preço obrigatório
- ✓ Quantidade obrigatória
- ✓ Tipo obrigatório
- ✓ Lote deve estar aberto
- ✓ Lote não pode estar fechado

### Fechamento de Lote
- ✓ Lote deve ter pelo menos 1 produto
- ✓ Confirmar ação

### Proteção de Produtos
- ✓ Não podem ser editados se em lote
- ✓ Não podem ser deletados se em lote
- ✓ Podem ser editados/deletados se sem lote

---

## 🧪 Teste Rápido

```
1. npm start (backend)
2. npm run dev (frontend)
3. Acesse http://localhost:3000
4. Login
5. Clique em "Controle de Lotes"
6. Clique em "Novo Lote"
7. Digite: "LOTE-TESTE"
8. Clique em "Criar Lote"
9. Clique em "Adicionar Produto"
10. Preencha: Camiseta, 29.90, 50, Roupas
11. Clique em "Adicionar Produto"
12. Clique em "Fechar Lote"
13. ✅ Teste concluído!
```

---

## 📊 Estrutura do Componente

### LotesManagement.jsx
```
├── Header
│   ├── Título
│   └─ Botão "Novo Lote"
│
├── Messages
│   ├── Erro
│   └─ Sucesso
│
├── Formulário Novo Lote (se showForm)
│
├── Painel Principal (Grid)
│   ├── Lote Aberto (col-2)
│   │   ├── Info do Lote
│   │   ├── Formulário Novo Produto (se showProductForm)
│   │   ├── Tabela de Produtos
│   │   └─ Botão Fechar
│   │
│   └── Histórico (col-1)
│       └─ Lista de Lotes
```

---

## 🔍 Debugging

### Ver Lotes Criados
```sql
sqlite3 backend/vendas.db "SELECT * FROM lotes ORDER BY id DESC LIMIT 5;"
```

### Ver Produtos de um Lote
```sql
sqlite3 backend/vendas.db "SELECT * FROM produtos WHERE lote_id = 1;"
```

### Contar Lotes por Status
```sql
sqlite3 backend/vendas.db "SELECT status, COUNT(*) FROM lotes GROUP BY status;"
```

### Ver Total em Estoque por Lote
```sql
sqlite3 backend/vendas.db 
"SELECT lote_id, SUM(preco * estoque) as total 
FROM produtos WHERE lote_id IS NOT NULL 
GROUP BY lote_id;"
```

---

## 🚀 Status do Sistema

```
✅ Backend:          Pronto
✅ Frontend:         Pronto
✅ Banco de Dados:   Pronto
✅ API:              Pronto
✅ Documentação:     Pronta
✅ Testes:           Prontos
✅ Segurança:        Implementada

Status Geral:        🟢 100% OPERACIONAL
```

---

## 📞 Documentação por Caso de Uso

| Necessidade | Documento |
|-------------|-----------|
| Começar a usar | [QUICK_START_LOTES.md](./QUICK_START_LOTES.md) |
| Aprender a usar | [MANUAL_LOTES.md](./MANUAL_LOTES.md) |
| Testar sistema | [TESTE_LOTES.md](./TESTE_LOTES.md) |
| Entender código | [SUMARIO_TECNICO_LOTES.md](./SUMARIO_TECNICO_LOTES.md) |
| Ver implementação | [LOTES_IMPLEMENTACAO.md](./LOTES_IMPLEMENTACAO.md) |
| Checklist | [CHECKLIST_LOTES.md](./CHECKLIST_LOTES.md) |
| Continuar desenvolvendo | [GUIDE_CONTINUAR_DESENVOLVENDO.md](./GUIDE_CONTINUAR_DESENVOLVENDO.md) |
| Ver mudanças | [LISTA_MUDANCAS.md](./LISTA_MUDANCAS.md) |
| Índice completo | [INDICE_DOCUMENTACAO.md](./INDICE_DOCUMENTACAO.md) |

---

## ⚠️ Avisos Importantes

### Não Fazer
- ❌ Deletar banco de dados manualmente
- ❌ Editar diretamente no SQLite em produção
- ❌ Deletar produtos em lote ativamente
- ❌ Ter 2 lotes abertos (o sistema impede)

### Fazer
- ✅ Reabrir lote se precisar corrigir
- ✅ Fechar lote quando terminar
- ✅ Usar a interface da aplicação
- ✅ Consultar documentação

---

## 🎁 Extras Inclusos

- ✨ Formatação de moeda pt-BR
- ✨ Formatação de datas
- ✨ Ícones visuais
- ✨ Responsividade mobile
- ✨ Mensagens de feedback
- ✨ Validações inteligentes
- ✨ Confirmações de ações
- ✨ Histórico completo
- ✨ Proteção de integridade
- ✨ Documentação abrangente

---

## 🔧 Manutenção

### Backup
```bash
cp backend/vendas.db backend/vendas.backup.db
```

### Resetar Sistema
```bash
# ⚠️ CUIDADO: Isso apaga todos os dados
rm backend/vendas.db
npm start  # Banco será recriado
```

### Logs
```bash
# Backend (já em console)
npm start

# Frontend (Ver console do navegador)
F12 → Console tab
```

---

**Última atualização:** 14 de Janeiro de 2026
**Versão:** 1.0
**Status:** ✅ Completo e Funcional

---

Qualquer dúvida? 👉 Consulte a [documentação completa](./INDICE_DOCUMENTACAO.md)!
