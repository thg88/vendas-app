# Guia de Teste - Sistema de Lotes

## Para Testar o Sistema Completo

### Pré-requisitos
- Backend rodando em http://localhost:5000
- Frontend rodando em http://localhost:3000
- Estar logado na aplicação

### Teste Passo a Passo

#### 1. Acessar o Controle de Lotes
- [ ] Clique no menu "Controle de Lotes" (ícone de caixas)
- [ ] Verifique se o interface carregou corretamente

#### 2. Criar um Novo Lote
- [ ] Clique em "Novo Lote"
- [ ] Insira número: `LOTE-JAN-2026`
- [ ] Insira observações: `Primeira entrada de janeiro`
- [ ] Clique em "Criar Lote"
- [ ] Verifique se o lote aparece no painel

#### 3. Adicionar Produtos ao Lote
- [ ] Clique em "Adicionar Produto"
- [ ] Preencha:
  - Nome: `Camiseta Básica`
  - Preço: `29,90`
  - Quantidade: `50`
  - Tipo: `Roupas`
- [ ] Clique em "Adicionar Produto"
- [ ] Repita para adicionar mais produtos:
  - `Calça Jeans` - R$ 89,90 - 30 un - Roupas
  - `Colar Dourado` - R$ 15,00 - 100 un - Semi-joias
- [ ] Verifique se total do lote está correto

#### 4. Fechar o Lote
- [ ] Clique em "Fechar Lote"
- [ ] Confirme a ação
- [ ] Verifique se:
  - Lote desaparece do painel
  - Botão "Novo Lote" fica disponível
  - Lote aparece no histórico como "Fechado"

#### 5. Verificar Produtos no Cadastro
- [ ] Vá para "Produtos"
- [ ] Verifique se os 3 produtos aparecem com coluna "Lote" = "Em Lote"
- [ ] Tente editar um produto em lote - deve estar desabilitado
- [ ] Tente deletar um produto em lote - deve estar desabilitado

#### 6. Reabrir Lote (Opcional)
- [ ] No histórico de lotes, clique em "Reabrir" em um lote fechado
- [ ] Verifique se o lote retorna ao painel com os mesmos produtos
- [ ] Tente adicionar novo produto
- [ ] Feche novamente

#### 7. Criar Segundo Lote
- [ ] Clique em "Novo Lote"
- [ ] Insira número: `LOTE-FEV-2026`
- [ ] Adicione novos produtos
- [ ] Feche o lote

#### 8. Deletar Lote Vazio
- [ ] Abra um novo lote: `LOTE-TESTE`
- [ ] Feche sem adicionar produtos
- [ ] No histórico, clique "Deletar"
- [ ] Confirme
- [ ] Verifique se foi removido do histórico

### Teste de Validações

#### Validação 1: Não Pode Ter Dois Lotes Abertos
- [ ] Com lote aberto, botão "Novo Lote" deve estar desabilitado
- [ ] Mensagem deve dizer para fechar o lote primeiro

#### Validação 2: Não Pode Adicionar a Lote Fechado
- [ ] Feche um lote
- [ ] Tente usar API ou tentar adicionar via código
- [ ] Deve retornar erro "Lote não pode estar aberto"

#### Validação 3: Não Pode Deletar Lote com Produtos
- [ ] Tente deletar um lote com produtos
- [ ] Deve mostrar erro "Lote possui produtos"

#### Validação 4: Número de Lote Único
- [ ] Tente criar outro lote com mesmo número
- [ ] Deve mostrar erro "Número de lote já existe"

#### Validação 5: Produtos em Lote Protegidos
- [ ] Produtos adicionados a lote não podem ser:
  - Editados (botão desabilitado)
  - Deletados (botão desabilitado)

### Teste de Dados

#### Verificar Banco de Dados
```sql
-- Para verificar no SQLite
SELECT * FROM lotes;
SELECT * FROM produtos WHERE lote_id IS NOT NULL;

-- Deve haver:
-- - Tabela 'lotes' com status 'aberto' ou 'fechado'
-- - Produtos com lote_id preenchido
```

### Teste de UI

- [ ] Interface responsiva no mobile
- [ ] Layout se adapta bem em diferentes tamanhos
- [ ] Cores são consistentes (âmbar para lotes)
- [ ] Ícones aparecem corretamente
- [ ] Mensagens de sucesso/erro aparecem
- [ ] Buttons desabilitados têm visual correto

### Possíveis Problemas e Soluções

| Problema | Solução |
|----------|---------|
| Lotes não aparecem | Reinicie o servidor backend |
| Erro ao adicionar produto | Verifique se lote está aberto |
| Coluna lote_id não existe | Banco será criado automaticamente na primeira execução |
| Botões desabilitados não funcionam | Clear cache do navegador |
| API retorna 401 | Faça login novamente |

---

**Status**: Sistema completo e pronto para uso! ✅
