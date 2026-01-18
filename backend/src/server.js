import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database.js';
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import productRoutes from './routes/productRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import lotesRoutes from './routes/lotesRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Configurar CORS - em desenvolvimento, aceitar qualquer origem
const corsOptions = {
  origin: true, // Aceita qualquer origem em desenvolvimento
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Inicializar banco de dados
//initializeDatabase();

// Inicializar banco de dados em segundo plano
initializeDatabase()
  .then(() => {
    console.log("Banco de dados inicializado com sucesso");
  })
  .catch((err) => {
    console.error("Erro ao inicializar banco de dados:", err.message);
  });


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Database health check
app.get('/api/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'Database is healthy' });
  } catch (err) {
    res.status(500).json({ status: 'Database is DOWN', error: err.message });
  }
});


/*
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`CORS configurado para: ${FRONTEND_URL}`);
}); */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`CORS configurado para: ${FRONTEND_URL}`);
});

