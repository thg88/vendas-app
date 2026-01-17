import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'vendas.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite');
});

// Dados do usuário a ser criado
const username = 'vendedor';
const email = 'vendedor@exemplo.com';
const password = '123456';

// Criptografar a senha
const hashedPassword = bcrypt.hashSync(password, 10);

// Inserir o usuário
db.run(
  'INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)',
  [username, email, hashedPassword],
  function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        console.log('❌ Usuário já existe!');
      } else {
        console.error('Erro ao criar usuário:', err.message);
      }
      process.exit(1);
    }
    console.log('✅ Usuário criado com sucesso!');
    console.log('');
    console.log('Credenciais de acesso:');
    console.log('─────────────────────');
    console.log(`Username: ${username}`);
    console.log(`Senha: ${password}`);
    console.log('─────────────────────');
    db.close();
    process.exit(0);
  }
);
