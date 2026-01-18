import sqlite3 from 'sqlite3';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pkg;

// Determinar se usar PostgreSQL (Supabase) ou SQLite
const USE_POSTGRES = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql');

let db;
let pool;

if (USE_POSTGRES) {
  // PostgreSQL (Supabase)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  pool.on('error', (err) => {
    console.error('Erro na pool de conexão PostgreSQL:', err);
  });

  console.log('Usando banco de dados PostgreSQL (Supabase)');
} else {
  // SQLite (desenvolvimento local)
  const dbPath = path.join(__dirname, '..', 'vendas.db');

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err);
    } else {
      console.log('Conectado ao banco de dados SQLite');
    }
  });
}

// Função helper para converter placeholders PostgreSQL ($1, $2) para SQLite (?)
const convertPlaceholders = (text) => {
  if (USE_POSTGRES) return text;
  // Converter $1, $2, $3... para ?
  return text.replace(/\$\d+/g, '?');
};

export const query = async (text, params = []) => {
  if (USE_POSTGRES) {
    return pool.query(text, params);
  } else {
    const sqlText = convertPlaceholders(text);
    return new Promise((resolve, reject) => {
      // Detectar se é um SELECT ou comando de modificação (INSERT, UPDATE, DELETE)
      const isSelect = sqlText.trim().toUpperCase().startsWith('SELECT');
      
      if (isSelect) {
        // Para SELECT, usar db.all() para buscar múltiplas linhas
        db.all(sqlText, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      } else {
        // Para INSERT, UPDATE, DELETE, usar db.run()
        db.run(sqlText, params, function(err) {
          if (err) reject(err);
          else resolve({ rows: [], lastID: this.lastID });
        });
      }
    });
  }
};

/*
export const initializeDatabase = () => {
  if (USE_POSTGRES) {
    initializePostgreSQL();
  } else {
    initializeSQLite();
  }
};
*/

export const initializeDatabase = async () => {
  if (USE_POSTGRES) {
    await initializePostgreSQL();
  } else {
    await initializeSQLite();
  }
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
        subtotal DECIMAL(10, 2) NOT NULL
      )
    `);

    // Tabela de pagamentos
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

/*
const initializeSQLite = () => {
  db.serialize(() => {
    // Tabela de produtos
    db.run(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        preco REAL NOT NULL,
        estoque INTEGER DEFAULT 0,
        estoque_original INTEGER DEFAULT 0,
        tipo TEXT,
        lote_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lote_id) REFERENCES lotes(id)
      )
    `);

    // Tabela de vendas
    db.run(`
      CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        valor_total REAL NOT NULL,
        forma_pagamento TEXT NOT NULL,
        status TEXT DEFAULT 'ativa',
        resumo_original TEXT,
        data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      )
    `);

    // Tabela de itens de venda
    db.run(`
      CREATE TABLE IF NOT EXISTS itens_venda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        quantidade_original INTEGER NOT NULL,
        preco_unitario REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (venda_id) REFERENCES vendas(id),
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
      )
    `);

    // Tabela de pagamentos
    db.run(`
      CREATE TABLE IF NOT EXISTS pagamentos_venda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_id INTEGER NOT NULL,
        valor_pago REAL NOT NULL,
        tipo_pagamento TEXT NOT NULL,
        data_pagamento DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venda_id) REFERENCES vendas(id)
      )
    `);

    // Tabela de wishlist
    db.run(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        item TEXT NOT NULL,
        data_pedido DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Banco de dados SQLite inicializado com sucesso');
  });
};
*/

const initializeSQLite = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      try {
        db.run(`
          CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT,
            preco REAL NOT NULL,
            estoque INTEGER DEFAULT 0,
            estoque_original INTEGER DEFAULT 0,
            tipo TEXT,
            lote_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lote_id) REFERENCES lotes(id)
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS vendas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER NOT NULL,
            valor_total REAL NOT NULL,
            forma_pagamento TEXT NOT NULL,
            status TEXT DEFAULT 'ativa',
            resumo_original TEXT,
            data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id)
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS itens_venda (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venda_id INTEGER NOT NULL,
            produto_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL,
            quantidade_original INTEGER NOT NULL,
            preco_unitario REAL NOT NULL,
            subtotal REAL NOT NULL,
            FOREIGN KEY (venda_id) REFERENCES vendas(id),
            FOREIGN KEY (produto_id) REFERENCES produtos(id)
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS pagamentos_venda (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venda_id INTEGER NOT NULL,
            valor_pago REAL NOT NULL,
            tipo_pagamento TEXT NOT NULL,
            data_pagamento DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (venda_id) REFERENCES vendas(id)
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            item TEXT NOT NULL,
            data_pedido DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        console.log('Banco de dados SQLite inicializado com sucesso');
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
};


export default db;
