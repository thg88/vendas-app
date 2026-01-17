# 📦 Sistema de Controle de Estoques por Lote

## O que foi implementado?

Um sistema completo para gerenciar estoques por lote, permitindo que você:
- Abra um novo lote de entrada (mensal)
- Adicione produtos a esse lote
- Feche o lote quando terminar de adicionar produtos
- Consulte histórico de lotes anteriores
- Reabre lotes se necessário

## Como funciona?

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

## Estrutura no Banco de Dados

### Tabela: LOTES
```
id              → ID único do lote
numero_lote     → Nome do lote (ex: LOTE-JAN-2026)
status          → 'aberto' ou 'fechado'
data_abertura   → Quando foi criado
data_fechamento → Quando foi fechado
observacoes     → Notas sobre o lote
```

### Tabela: PRODUTOS
```
id              → ID único do produto
nome            → Nome do produto
preco           → Preço unitário
estoque         → Quantidade em estoque
tipo            → Tipo (Roupas ou Semi-joias)
lote_id         → 🔑 Qual lote este produto pertence
```

## Interface Principal

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

## Instruções de Uso

### ✅ Para Criar um Novo Lote

1. Acesse o menu **Controle de Lotes**
2. Clique no botão **"Novo Lote"** (no topo direito)
3. Preencha:
   - **Número do Lote**: Use formato `LOTE-MÊS-ANO` (ex: LOTE-JAN-2026)
   - **Observações**: Adicione notas (opcional)
4. Clique **"Criar Lote"**
5. O lote abrirá automaticamente pronto para receber produtos

### ✅ Para Adicionar Produtos

1. Com o lote aberto, clique **"Adicionar Produto"**
2. Preencha o formulário:
   - **Nome do Produto**: Nome exato do produto
   - **Preço**: Preço unitário (será formatado automaticamente)
   - **Quantidade**: Quantas unidades você recebeu
   - **Tipo**: Selecione entre "Roupas" ou "Semi-joias"
3. Clique **"Adicionar Produto"**
4. O produto aparecerá na tabela
5. O total do lote será atualizado automaticamente
6. Repita para todos os produtos

### ✅ Para Fechar o Lote

1. Após adicionar todos os produtos
2. Clique **"🔒 Fechar Lote"** (no rodapé)
3. Confirme a ação
4. ⚠️ Depois disso, **não será possível adicionar novos produtos** a este lote
5. Para adicionar novos produtos, **crie um novo lote**

### ✅ Para Reabrir um Lote (se necessário)

1. No **Histórico de Lotes**, encontre o lote que deseja reabrir
2. Clique **[Reabrir]**
3. Confirme a ação
4. O lote ficará aberto novamente
5. Você poderá adicionar mais produtos se necessário
6. Feche novamente quando terminar

### ✅ Para Deletar um Lote Vazio

1. No **Histórico de Lotes**, encontre o lote vazio
2. Clique **[Deletar]**
3. Confirme a ação
4. Apenas lotes sem produtos podem ser deletados

## Visualizar Produtos em Cadastro

Após fechar um lote, os produtos aparecem no menu **Produtos**:

```
┌─────────────────────────────────────────────────┐
│ Nome │ Tipo │ Preço │ Estoque │ Lote      │Ações│
├─────────────────────────────────────────────────┤
│Camisa│Roupas│ 29,90 │   50    │ Em Lote   │❌❌ │
│Calça │Roupas│ 89,90 │   30    │ Em Lote   │❌❌ │
│Blusa │Roupas│ 35,00 │   -     │ -         │✅✅ │
└─────────────────────────────────────────────────┘
```

**Produtos em Lote**:
- ❌ Não podem ser editados
- ❌ Não podem ser deletados
- ✅ Aparecem com marca "Em Lote"
- ✅ Seus dados estão protegidos

## Proteções Implementadas

| Proteção | Descrição |
|----------|-----------|
| 🔒 Apenas 1 lote aberto | Impossível ter dois lotes abertos simultaneamente |
| 🔒 Lote fechado é imutável | Não pode adicionar produtos a lote fechado |
| 🔒 Produtos protegidos | Produtos em lote não podem ser editados/deletados |
| 🔒 Números únicos | Cada lote tem número único no sistema |
| 🔒 Lote não vazio | Não pode fechar lote sem produtos |

## Exemplo Real de Uso

```
JANEIRO (1º recebimento)
├─ Abrir: LOTE-JAN-2026
├─ Adicionar: 50 Camisetas @ R$ 29,90
├─ Adicionar: 30 Calças @ R$ 89,90
├─ Adicionar: 100 Colares @ R$ 15,00
└─ Fechar lote ✅

FEVEREIRO (2º recebimento)
├─ Abrir: LOTE-FEV-2026
├─ Adicionar: 40 Camisetas @ R$ 29,90
├─ Adicionar: 25 Calças @ R$ 89,90
├─ Adicionar: 150 Colares @ R$ 15,00
└─ Fechar lote ✅

MARÇO (3º recebimento)
├─ Abrir: LOTE-MAR-2026
├─ (novos produtos)
└─ Fechar lote ✅
```

## Perguntas Frequentes

**P: O que acontece se eu fechei o lote por engano?**
R: Vá ao Histórico, clique "Reabrir" no lote e adicione os produtos faltantes.

**P: Posso ter dois lotes abertos?**
R: Não, o sistema impede automaticamente.

**P: Onde vejo o histórico de todos os lotes?**
R: No painel direito, na seção "Histórico de Lotes".

**P: Como gero relatório de um lote?**
R: Você pode ver as estatísticas na interface, ou extrair dados via SQL.

**P: Posso editar um produto que já está em lote?**
R: Não, produtos em lote são protegidos. Se precisar, reabra o lote e faça a alteração.

**P: E se receber produtos avulsos fora do lote mensal?**
R: Crie um novo lote especial (ex: LOTE-JAN-EXTRA) e feche após adicionar.

## Dados Persistidos

Todos os dados são salvos no banco SQLite:
- ✅ Lotes criados
- ✅ Datas de abertura/fechamento
- ✅ Produtos por lote
- ✅ Preços e quantidades
- ✅ Histórico completo

## Status do Sistema

✅ **100% Funcional**
✅ **Banco de Dados Integrado**
✅ **Frontend Completamente Testado**
✅ **Proteções Implementadas**
✅ **Documentação Completa**

---

**Pronto para começar!** 🚀
Abra o menu "Controle de Lotes" e crie seu primeiro lote.
