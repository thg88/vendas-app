# Sistema de Controle de Vendas

Aplicação web para registro e controle de vendas de roupas e semi joias.

## Requisitos

- Node.js (versão 14+)
- npm ou yarn

## Estrutura do Projeto

```
App controle vendas/
├── backend/          # API Express.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── database.js
│   │   └── server.js
│   ├── package.json
│   └── .env
└── frontend/         # Aplicação React
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── services/
    │   ├── styles/
    │   ├── App.jsx
    │   └── main.jsx
    ├── public/_redirects
    ├── package.json
    └── vite.config.js
```

## Instalação

### Backend

1. Navegue até a pasta `backend`:
   ```bash
   cd backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o arquivo `.env` se necessário (já vem pré-configurado)

4. Inicie o servidor:
   ```bash
   npm run dev
   ```

O servidor rodará em `http://localhost:5000`

### Frontend

1. Em outro terminal, navegue até a pasta `frontend`:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie a aplicação:
   ```bash
   npm run dev
   ```

A aplicação abrirá em `http://localhost:3000`

## Funcionalidades

- **Login**: Autenticação de usuários
- **Lançar Venda**: Registrar vendas com cliente, produtos, valor e forma de pagamento
- **Consulta Vendas**: Visualizar histórico de vendas
- **Cadastro de Clientes**: Gerenciar dados de clientes
- **Cadastro de Produtos**: Gerenciar catálogo de produtos

### Banco de Dados

O sistema utiliza SQLite com as seguintes tabelas:

- **usuarios**: Dados de autenticação
- **clientes**: Informações dos clientes
- **produtos**: Catálogo de produtos
- **vendas**: Registro de vendas com data
- **itens_venda**: Itens/produtos de cada venda

## Recursos Principais

- Autenticação JWT
- Criação rápida de clientes e produtos durante o lançamento de venda
- Registro automático de data/hora na venda
- Suporte para pagamento à vista e a prazo
- Interface responsiva e intuitiva

## Próximas Melhorias

- Consulta de vendas com filtros por data
- Relatórios de vendas
- Gerenciamento completo de estoque
- Edição de vendas registradas
- Exportar vendas em PDF/Excel
