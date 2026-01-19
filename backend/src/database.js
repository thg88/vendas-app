import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback para .env se .env.local não existir

const { Pool } = pkg;

// PostgreSQL (Supabase ou local)
const isProduction = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase');
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

// Usar SSL apenas para Supabase (produção)
if (isProduction) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Erro na pool de conexão PostgreSQL:', err);
});

console.log('Usando banco de dados PostgreSQL');

export const query = async (text, params = []) => {
  return pool.query(text, params);
};

export const initializeDatabase = async () => {
  await initializePostgreSQL();
};

const initializePostgreSQL = async () => {
  try {
    // Tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT,
        telefone TEXT,
        endereco TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de lotes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lotes (
        id SERIAL PRIMARY KEY,
        numero_lote TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'aberto',
        tipo TEXT,
        data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_fechamento TIMESTAMP,
        data_recebimento TIMESTAMP,
        data_finalizacao TIMESTAMP,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de produtos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        descricao TEXT,
        preco DECIMAL(10, 2) NOT NULL,
        estoque INTEGER DEFAULT 0,
        estoque_original INTEGER DEFAULT 0,
        tipo TEXT,
        lote_id INTEGER REFERENCES lotes(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de vendas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendas (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER NOT NULL REFERENCES clientes(id),
        valor_total DECIMAL(10, 2) NOT NULL,
        forma_pagamento TEXT NOT NULL,
        status TEXT DEFAULT 'ativa',
        resumo_original TEXT,
        data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de itens de venda
    await pool.query(`
      CREATE TABLE IF NOT EXISTS itens_venda (
        id SERIAL PRIMARY KEY,
        venda_id INTEGER NOT NULL REFERENCES vendas(id),
        produto_id INTEGER NOT NULL REFERENCES produtos(id),
        quantidade INTEGER NOT NULL,
        quantidade_original INTEGER NOT NULL,
        preco_unitario DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de pagamentos de venda
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pagamentos_venda (
        id SERIAL PRIMARY KEY,
        venda_id INTEGER NOT NULL REFERENCES vendas(id),
        valor_pago DECIMAL(10, 2) NOT NULL,
        tipo_pagamento TEXT NOT NULL,
        data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de wishlist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        item TEXT NOT NULL,
        data_pedido DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Banco de dados PostgreSQL inicializado com sucesso');
  } catch (err) {
    console.error('Erro ao inicializar PostgreSQL:', err);
  }
};

export default pool;
