# Guia de Início Rápido

## Para iniciar a aplicação:

### Terminal 1 - Backend (Port 5000)
```bash
cd backend
npm run dev
```

Você verá: `Servidor rodando na porta 5000`

### Terminal 2 - Frontend (Port 3000)
```bash
cd frontend
npm run dev
```

A aplicação abrirá automaticamente em `http://localhost:3000`

## Credenciais de Teste

Para testar, você pode registrar um novo usuário:

1. Na tela de login, qualquer credencial será aceita para o primeiro acesso
2. Após login bem-sucedido, será redirecionado ao dashboard

## Funcionalidades Implementadas

✅ **Autenticação JWT**: Login seguro com tokens
✅ **Lançar Venda**: Registro completo com cliente, produtos, valor e forma de pagamento
✅ **Criar Cliente/Produto**: Modais para criar cliente ou produto durante lançamento de venda
✅ **Data Automática**: Cada venda registra data/hora automaticamente
✅ **Forma de Pagamento**: À vista ou a prazo
✅ **Banco de Dados**: SQLite com 5 tabelas relacionadas

## Estrutura das Tabelas

### Vendas
- ID
- Cliente ID (referência)
- Valor Total
- Forma de Pagamento (À vista / A prazo)
- Data da Venda (TIMESTAMP automático)

### Itens da Venda
- ID
- Venda ID
- Produto ID
- Quantidade
- Preço Unitário
- Subtotal

## Próximas Funcionalidades

- Página "Consulta Vendas" com filtros por data
- Página "Cadastro Clientes" com CRUD completo
- Página "Cadastro Produtos" com CRUD completo
- Relatórios e estatísticas
- Exportação em PDF/Excel
