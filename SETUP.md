# Sistema de Controle de Vendas - Instruções de Uso

## Status do Projeto

✅ **Projeto criado com sucesso!**

A aplicação foi desenvolvida com as seguintes tecnologias:
- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Banco de Dados**: SQLite
- **Autenticação**: JWT

## Como Executar

### Passo 1: Abra dois terminais

**Terminal 1 - Backend:**
```bash
cd "c:\Users\Thiago\Desktop\App controle vendas\backend"
npm run dev
```

Você verá:
```
Servidor rodando na porta 5000
Conectado ao banco de dados SQLite
```

**Terminal 2 - Frontend:**
```bash
cd "c:\Users\Thiago\Desktop\App controle vendas\frontend"
npm run dev
```

A aplicação abrirá em `http://localhost:3000`

## Funcionalidades Implementadas

### 1. Tela de Login ✅
- Autenticação com username e password
- Tokens JWT para segurança
- Validação de credenciais

### 2. Tela Initial (Dashboard) ✅
Menu principal com 4 opções:
- **Lançar Venda** - Registrar vendas
- **Consulta Vendas** - Visualizar histórico (em desenvolvimento)
- **Cadastro Clientes** - Gerenciar clientes (em desenvolvimento)
- **Cadastro Produtos** - Gerenciar produtos (em desenvolvimento)

### 3. Lançar Venda ✅
Formulário completo para registrar vendas com:
- **Cliente**: Seleção de cliente existente
- **Produtos**: Adicione um ou mais produtos com quantidade
- **Valor**: Cálculo automático do total
- **Forma de Pagamento**: À vista ou A prazo
- **Data**: Registrada automaticamente no banco de dados

### 4. Criar Cliente/Produto sob Demanda ✅
- Modal para criar novo cliente durante lançamento de venda
- Modal para criar novo produto durante lançamento de venda
- Sem necessidade de sair do formulário de venda

### 5. Banco de Dados SQLite ✅
5 tabelas principais:
- **usuarios**: Autenticação de usuários
- **clientes**: Dados dos clientes
- **produtos**: Catálogo de produtos
- **vendas**: Registro de vendas (com data automática)
- **itens_venda**: Itens de cada venda

## Fluxo de Uso

1. **Login**: Entre com qualquer username/password
2. **Dashboard**: Escolha "Lançar Venda"
3. **Selecionar Cliente**: 
   - Escolha um cliente existente
   - Ou clique "+ Novo Cliente" para criar um novo
4. **Adicionar Produtos**:
   - Selecione um produto
   - Digite a quantidade
   - Clique "Adicionar"
   - Ou clique "+ Novo Produto" para criar um novo
5. **Escolher Forma de Pagamento**: À vista ou A prazo
6. **Registrar Venda**: Clique "Registrar Venda"
   - A data/hora é gravada automaticamente
   - Mensagem de sucesso será exibida

## Principais Recursos

✨ **JWT Authentication**: Tokens seguros para autenticação
✨ **CRUD Completo**: APIs para clientes, produtos e vendas
✨ **Responsivo**: Interface adaptável a diferentes tamanhos de tela
✨ **Modal Forms**: Criar dados rapidamente sem sair da página
✨ **Validações**: Validação de campos obrigatórios
✨ **Mensagens**: Feedback visual de sucesso/erro

## Estrutura de Pastas

```
App controle vendas/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Lógica de negócio
│   │   ├── routes/             # Endpoints da API
│   │   ├── middleware/         # Autenticação
│   │   ├── database.js         # Configuração SQLite
│   │   └── server.js           # Servidor Express
│   ├── package.json
│   ├── .env                    # Variáveis de ambiente
│   └── vendas.db              # Banco de dados (criado automaticamente)
│
└── frontend/
    ├── src/
    │   ├── pages/              # Pages (Login, Dashboard)
    │   ├── components/         # Components (SaleForm)
    │   ├── services/           # API calls
    │   ├── styles/             # CSS
    │   ├── App.jsx
    │   └── main.jsx
    ├── public/
    │   └── index.html
    ├── package.json
    └── vite.config.js
```

## Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login

### Clientes
- `GET /api/clients` - Listar todos
- `POST /api/clients` - Criar novo
- `PUT /api/clients/:id` - Atualizar
- `DELETE /api/clients/:id` - Deletar

### Produtos
- `GET /api/products` - Listar todos
- `POST /api/products` - Criar novo
- `PUT /api/products/:id` - Atualizar
- `DELETE /api/products/:id` - Deletar

### Vendas
- `GET /api/sales` - Listar todas
- `POST /api/sales` - Criar nova
- `GET /api/sales/:id` - Detalhes da venda

## Próximas Implementações

📋 Completar página "Consulta Vendas" com:
- Filtros por data
- Busca por cliente
- Listagem com paginação

📋 Completar página "Cadastro de Clientes"
📋 Completar página "Cadastro de Produtos"
📋 Relatórios e estatísticas
📋 Exportar vendas em PDF/Excel

## Troubleshooting

**Erro de porta em uso?**
- Backend usa porta 5000
- Frontend usa porta 3000
- Se já estão em uso, feche outros processos

**Erro ao conectar ao backend?**
- Verifique se o backend está rodando em `npm run dev`
- Verifique se está na porta 5000

**Erro no banco de dados?**
- O arquivo `vendas.db` será criado automaticamente
- Se houver problemas, delete o arquivo `.db` e reinicie

## Variáveis de Ambiente

Arquivo `.env` do backend (já configurado):
```
PORT=5000
JWT_SECRET=seu_secret_key_aqui_mude_em_producao
NODE_ENV=development
```

**⚠️ Importante**: Em produção, altere o `JWT_SECRET` para uma chave segura!
