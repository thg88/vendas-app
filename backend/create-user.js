import pkg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pkg;

// PostgreSQL
const isProduction = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase');
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

if (isProduction) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

// Dados do usuário a ser criado
const username = 'elisabeth';
const email = 'btsrv010203@gmail.com';
const password = '123456';

// Criptografar a senha
const hashedPassword = bcrypt.hashSync(password, 10);

// Inserir o usuário
pool.query(
  'INSERT INTO usuarios (username, email, password) VALUES ($1, $2, $3)',
  [username, email, hashedPassword],
  (err, result) => {
    if (err) {
      if (err.message.includes('duplicate')) {
        console.log('❌ Usuário já existe!');
      } else {
        console.error('Erro ao criar usuário:', err.message);
      }
      pool.end();
      process.exit(1);
    }
    console.log('✅ Usuário criado com sucesso!');
    console.log('');
    console.log('Credenciais de acesso:');
    console.log('─────────────────────');
    console.log(`Username: ${username}`);
    console.log(`Senha: ${password}`);
    console.log('─────────────────────');
    pool.end();
    process.exit(0);
  }
);
