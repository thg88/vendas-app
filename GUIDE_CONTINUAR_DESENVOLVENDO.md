# 🔧 Guia para Continuar Desenvolvendo - Sistema de Lotes

## 📍 Onde Está o Código?

### Backend
```
backend/
├── src/
│   ├── controllers/
│   │   ├── lotesController.js ← Lógica dos lotes
│   │   ├── productController.js ← Integração com lotes
│   │   └── ...
│   ├── routes/
│   │   ├── lotesRoutes.js ← API dos lotes
│   │   └── ...
│   ├── database.js ← Tabelas (incluindo lotes)
│   └── server.js ← Registrar novas rotas aqui
└── vendas.db ← Banco de dados SQLite
```

### Frontend
```
frontend/src/
├── components/
│   ├── LotesManagement.jsx ← Interface dos lotes
│   ├── ProductsManagement.jsx ← Proteção de produtos
│   └── ...
├── pages/
│   └── Dashboard.jsx ← Menu principal
├── services/
│   └── api.js ← Chamadas da API
└── styles/ ← CSS global
```

## 🔄 Fluxo de Código

### Ao Criar um Lote
```
1. Frontend: LotesManagement.jsx
   └─ handleCreateLote()
   
2. Chama: lotesService.create(formData)
   └─ api.post('/lotes', data)

3. Backend: lotesRoutes.js
   └─ router.post('/', verifyToken, createLote)

4. Backend: lotesController.js
   └─ createLote()
   └─ INSERT INTO lotes (...)
   └─ SQLite Database

5. Response retorna para Frontend
   └─ setLoteAberto(response.data)
   
6. UI atualiza com novo lote
```

### Ao Adicionar Produto
```
1. Frontend: LotesManagement.jsx
   └─ handleAddProduct()
   └─ { ...productData, lote_id: loteAberto.id }

2. Chama: productService.create(dataToSend)
   └─ api.post('/products', data)

3. Backend: productRoutes.js
   └─ router.post('/', verifyToken, createProduct)

4. Backend: productController.js
   └─ createProduct()
   └─ Valida: status lote = 'aberto'
   └─ INSERT INTO produtos (..., lote_id, ...)
   └─ SQLite Database

5. Response retorna para Frontend
   └─ setLoteAberto({ ...loteAberto, produtos })
   
6. Tabela atualiza com novo produto
```

## 🎯 Próximas Melhorias Sugeridas

### 1. Exportar Lote em PDF
```javascript
// Arquivo: backend/src/controllers/lotesController.js
// Função: exportLoteToPDF(id)

// Passos:
// 1. GET lote com produtos
// 2. Usar biblioteca 'pdfkit'
// 3. Gerar PDF com dados
// 4. Retornar arquivo ao frontend
```

**Exemplo de rota:**
```javascript
router.get('/:id/export-pdf', verifyToken, exportLoteToPDF)
```

### 2. Importar Produtos via CSV
```javascript
// Arquivo: backend/src/controllers/lotesController.js
// Função: importProdutosCSV(loteId, file)

// Passos:
// 1. Upload do arquivo CSV
// 2. Parse CSV (usar 'csv-parser')
// 3. Validar dados
// 4. INSERT múltiplos produtos
// 5. Retornar resultado
```

**Exemplo de rota:**
```javascript
router.post('/:id/import-csv', verifyToken, uploadMiddleware, importProdutosCSV)
```

### 3. Adicionar Busca/Filtro de Lotes
```javascript
// Arquivo: frontend/src/components/LotesManagement.jsx
// Adicionar: state [searchTerm, setSearchTerm]

// Funcionalidade:
// 1. Campo de busca
// 2. Filtrar por numero_lote
// 3. Filtrar por status
// 4. Filtrar por data

// Exemplo:
const filteredLotes = lotes.filter(l =>
  l.numero_lote.includes(searchTerm)
)
```

### 4. Gráficos de Lotes por Mês
```javascript
// Arquivos necessários:
// - Instalar: npm install chart.js react-chartjs-2
// - Novo componente: frontend/src/components/LotesChart.jsx

// Mostrar:
// 1. Quantidade de lotes por mês
// 2. Valor total por lote
// 3. Produtos por tipo
```

### 5. Relatório Detalhado de Lotes
```javascript
// Rota: GET /api/lotes/:id/relatorio
// Response:
{
  lote: { ... },
  produtos: [ ... ],
  totalProdutos: number,
  totalEstoque: number,
  valorTotal: number,
  dataAbertura: date,
  dataFechamento: date,
  diasAberto: number
}
```

### 6. Integração com Vendas
```javascript
// Ao fazer uma venda, informar qual lote foi utilizado
// Campo novo em vendas: lote_id

// Tabela itens_venda seria atualizada:
// ALTER TABLE itens_venda ADD COLUMN lote_id INTEGER

// Benefício: Rastrear qual lote foi consumido
```

## 🛠️ Ferramentas Úteis

### Para Desenvolvimento
```bash
# Ver logs em tempo real
npm run dev  # Frontend
npm start    # Backend

# Ver banco de dados
sqlite3 backend/vendas.db
> .tables
> SELECT * FROM lotes;
> SELECT * FROM produtos WHERE lote_id IS NOT NULL;

# Resetar banco
rm backend/vendas.db
npm start
```

### Debugging Frontend
```javascript
// No console do navegador:
// Ver localStorage
localStorage.getItem('user')
localStorage.getItem('token')

// Inspecionar estado
// Use React DevTools

// Ver requisições
// Network tab no DevTools
```

### Debugging Backend
```javascript
// Em lotesController.js, adicione:
console.log('Criando lote:', { numero_lote, observacoes })
console.log('Lote aberto encontrado:', existingLote)
console.log('Erro:', err)

// Ou use debugger:
debugger;  // Adicione em qualquer linha
```

## 📦 Pacotes Instalados (Frontend)

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "lucide-react": "^0.x"
  }
}
```

## 📦 Pacotes Instalados (Backend)

```json
{
  "dependencies": {
    "express": "^4.x",
    "sqlite3": "^5.x",
    "cors": "^2.x",
    "dotenv": "^16.x",
    "jsonwebtoken": "^9.x",
    "bcrypt": "^5.x"
  }
}
```

## 🔐 Adicionar Segurança Extra

### Rate Limiting
```javascript
// npm install express-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

### Validação de Entrada
```javascript
// npm install joi
import Joi from 'joi';

const schema = Joi.object({
  numero_lote: Joi.string().required(),
  observacoes: Joi.string().allow(''),
});

const { error, value } = schema.validate(req.body);
if (error) return res.status(400).json(error);
```

## 📊 Monitoramento

### Adicionar Logs
```javascript
// Arquivo: backend/src/utils/logger.js
export const logAction = (action, user, details) => {
  console.log(`[${new Date().toISOString()}] ${user} - ${action}:`, details);
  // Ou salvar em banco de dados
}
```

### Ver Performance
```javascript
// Medir tempo de query
console.time('getAllLotes');
db.all('SELECT * FROM lotes', (err, rows) => {
  console.timeEnd('getAllLotes');
});
```

## 🧪 Testes Automatizados

### Instalar Jest
```bash
npm install --save-dev jest @testing-library/react
```

### Exemplo de Teste
```javascript
// frontend/src/components/__tests__/LotesManagement.test.jsx
import { render, screen } from '@testing-library/react';
import LotesManagement from '../LotesManagement';

test('render LotesManagement', () => {
  render(<LotesManagement />);
  expect(screen.getByText('Controle de Lotes')).toBeInTheDocument();
});
```

## 📝 Padrões de Código

### Nomenclatura
```
Controllers: camelCase + "Controller"
  ✓ lotesController.js
  ✓ productController.js

Routes: camelCase + "Routes"
  ✓ lotesRoutes.js
  ✓ productRoutes.js

Components: PascalCase
  ✓ LotesManagement.jsx
  ✓ ProductsManagement.jsx

Services: camelCase + "Service"
  ✓ lotesService
  ✓ productService

Functions: camelCase + Verbo
  ✓ getAllLotes()
  ✓ createLote()
  ✓ closeLote()
```

## 🚀 Deploy

### Para Produção
```bash
# Build frontend
cd frontend
npm run build

# Backend com PM2
npm install -g pm2
pm2 start "npm start" --name "vendas-api"
pm2 save
pm2 startup
```

### Variáveis de Ambiente
```bash
# .env
PORT=5000
NODE_ENV=production
DATABASE_URL=./vendas.db
JWT_SECRET=sua_chave_secreta_aqui
```

## 🐛 Troubleshooting Comum

| Problema | Solução |
|----------|---------|
| CORS error | Verificar corsOptions no server.js |
| Token inválido | Fazer login novamente |
| Banco de dados vazio | Rodar initializeDatabase() |
| Lote não aparece | Refresh na página (F5) |
| Produto não salva | Verificar conexão com backend |

## 📞 Suporte

Para entender melhor o código:
1. Leia [SUMARIO_TECNICO_LOTES.md](./SUMARIO_TECNICO_LOTES.md)
2. Veja os comentários no código
3. Execute com `npm run dev` e veja os logs

---

**Qualquer dúvida, consulte os arquivos de documentação ou analise o código!**

Happy coding! 🚀
