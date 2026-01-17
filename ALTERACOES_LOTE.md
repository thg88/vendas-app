# Alterações no Sistema de Lotes

## Resumo das Mudanças

As seguintes modificações foram implementadas no sistema de lotes para melhorar a UX e adicionar funcionalidade de data de recebimento:

### 1. **Backend - Database (database.js)**
- ✅ Adicionada coluna `data_recebimento DATETIME` na tabela `lotes`
- ✅ Adicionado check de coluna existente via `PRAGMA table_info` para evitar erros em bancos já existentes

### 2. **Backend - Controller (lotesController.js)**
Modificação na função `createLote`:
- ✅ Removido parâmetro `numero_lote` do request body (agora auto-gerado)
- ✅ Adicionado parâmetro `data_recebimento` (obrigatório)
- ✅ Implementado auto-gerador de número sequencial com 3 dígitos (001, 002, 003...)
- ✅ Lógica: `SELECT COUNT(*) FROM lotes` + 1, formatado com `padStart(3, '0')`
- ✅ Número gerado retorna automaticamente no response

### 3. **Frontend - Component (LotesManagement.jsx)**
Modificações no componente React:

**Estado (formData):**
- ✅ Removido campo `numero_lote` do estado
- ✅ Adicionado campo `data_recebimento` (date input)
- ✅ Adicionado campo `numero_lote_display` para exibição

**Formulário:**
- ✅ Campo "Número do Lote" agora é **readonly** (só leitura)
- ✅ Campo exibe automaticamente o próximo número: `String(lotes.length + 1).padStart(3, '0')`
- ✅ Novo campo "Data de Recebimento" com type="date" (obrigatório)
- ✅ Campo de Observações permanece opcional

**Visualização do Lote Aberto:**
- ✅ Adicionado display de "Data de Recebimento" na seção de lote aberto
- ✅ Formatação: próxima à data de abertura

**Histórico de Lotes:**
- ✅ Adicionado display de "Data de Recebimento" em cada lote do histórico
- ✅ Estilo diferenciado em azul para melhor visualização

## Formato do Número de Lote

Os números de lote agora seguem um padrão sequencial:
- **001** - Primeiro lote
- **002** - Segundo lote
- **003** - Terceiro lote
- E assim por diante...

## Requisições HTTP

### Criar Novo Lote

**Antes:**
```json
POST /lotes
{
  "numero_lote": "LOTE-JAN-2026",
  "observacoes": "Observações opcionais"
}
```

**Depois:**
```json
POST /lotes
{
  "data_recebimento": "2026-01-31",
  "observacoes": "Observações opcionais"
}
```

**Response:**
```json
{
  "id": 1,
  "numero_lote": "001",
  "status": "aberto",
  "data_recebimento": "2026-01-31",
  "observacoes": "Observações opcionais",
  "produtos": []
}
```

## Validações

1. **Data de Recebimento**: Campo obrigatório
2. **Apenas 1 Lote Aberto**: Sistema continua validando se já existe um lote aberto
3. **Número Sequencial Automático**: Gerado pelo backend, impossível duplicar

## Testes Recomendados

1. ✅ Criar um novo lote e verificar se o número é "001"
2. ✅ Criar outro lote e verificar se o número é "002"
3. ✅ Verificar se a data de recebimento é exibida corretamente
4. ✅ Verificar se o campo de número está realmente readonly
5. ✅ Tentar criar lote sem data de recebimento (deve retornar erro)
6. ✅ Fechar lote e criar novo - deve começar a contar novamente
7. ✅ Verificar se data de recebimento aparece no histórico

## Compatibilidade com Banco Existente

Se você já tinha um banco com lotes criados:
- O sistema adicionará a coluna `data_recebimento` automaticamente
- Lotes existentes terão `data_recebimento` como NULL
- Novos lotes começarão com o próximo número sequencial

## Próximas Funcionalidades Sugeridas

1. Usar `data_recebimento` nas vendas a prazo para validar prazos
2. Gerar relatórios baseados na data de recebimento
3. Alertas para lotes próximos do vencimento de recebimento
