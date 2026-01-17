import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'vendas.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar:', err);
    process.exit(1);
  }
});

const command = process.argv[2] || 'help';

switch (command) {

  /* ===================== LISTAGENS ===================== */

  case 'usuarios':
    console.log('\n📋 USUÁRIOS:\n');
    db.all('SELECT id, username, email, created_at FROM usuarios', (err, rows) => {
      if (err) console.error(err);
      else console.table(rows);
      db.close();
    });
    break;

  case 'clientes':
    console.log('\n👥 CLIENTES:\n');
    db.all('SELECT * FROM clientes', (err, rows) => {
      if (err) console.error(err);
      else console.table(rows);
      db.close();
    });
    break;

  case 'produtos':
    console.log('\n📦 PRODUTOS:\n');
    db.all('SELECT * FROM produtos', (err, rows) => {
      if (err) console.error(err);
      else console.table(rows);
      db.close();
    });
    break;

  case 'vendas':
    console.log('\n💰 VENDAS:\n');
    db.all(`
      SELECT v.id, c.nome AS cliente, v.valor_total, 
             v.forma_pagamento, v.data_venda
      FROM vendas v
      JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.data_venda DESC
    `, (err, rows) => {
      if (err) console.error(err);
      else console.table(rows);
      db.close();
    });
    break;

  /* ===================== UPDATE ===================== */


  case 'update-cliente': {
    const [id, nome, email] = process.argv.slice(3);
    if (!id || !nome || !email) {
      console.log('❌ Use: node db-query.js update-cliente <id> <nome> <email>');
      process.exit(1);
    }

    db.run(
      'UPDATE clientes SET nome = ?, email = ? WHERE id = ?',
      [nome, email, id],
      function (err) {
        if (err) console.error(err);
        else console.log(`✅ Cliente ${id} atualizado`);
        db.close();
      }
    );
    break;
  }

  case 'update-produto': {
    const [id, nome, preco] = process.argv.slice(3);
    if (!id || !nome || !preco) {
      console.log('❌ Use: node db-query.js update-produto <id> <nome> <preco>');
      process.exit(1);
    }

    db.run(
      'UPDATE produtos SET nome = ?, preco = ? WHERE id = ?',
      [nome, preco, id],
      function (err) {
        if (err) console.error(err);
        else console.log(`✅ Produto ${id} atualizado`);
        db.close();
      }
    );
    break;
  }

  case 'update-usuario': {
  const [id, username, email] = process.argv.slice(3);

  if (!id || !username || !email) {
    console.log('❌ Use: node db-query.js update-usuario <id> <username> <email>');
    process.exit(1);
  }

  db.run(
    'UPDATE usuarios SET username = ?, email = ? WHERE id = ?',
    [username, email, id],
    function (err) {
      if (err) console.error(err);
      else if (this.changes === 0)
        console.log('⚠️ Nenhum usuário encontrado com esse ID');
      else
        console.log(`✅ Usuário ${id} atualizado com sucesso`);
      db.close();
    }
  );
  break;
  }

  /* ===================== DELETE ===================== */

  case 'delete-cliente': {
    const id = process.argv[3];
    if (!id) {
      console.log('❌ Use: node db-query.js delete-cliente <id>');
      process.exit(1);
    }

    db.run('DELETE FROM clientes WHERE id = ?', [id], function (err) {
      if (err) console.error(err);
      else console.log(`🗑️ Cliente ${id} excluído`);
      db.close();
    });
    break;
  }

  case 'delete-produto': {
    const id = process.argv[3];
    if (!id) {
      console.log('❌ Use: node db-query.js delete-produto <id>');
      process.exit(1);
    }

    db.run('DELETE FROM produtos WHERE id = ?', [id], function (err) {
      if (err) console.error(err);
      else console.log(`🗑️ Produto ${id} excluído`);
      db.close();
    });
    break;
  }

  case 'delete-venda': {
    const id = process.argv[3];
    if (!id) {
      console.log('❌ Use: node db-query.js delete-venda <id>');
      process.exit(1);
    }

    db.serialize(() => {
      db.run('DELETE FROM itens_venda WHERE venda_id = ?', [id]);
      db.run('DELETE FROM vendas WHERE id = ?', [id], function (err) {
        if (err) console.error(err);
        else console.log(`🗑️ Venda ${id} e seus itens foram excluídos`);
        db.close();
      });
    });
    break;
  }

  /* ===================== HELP ===================== */

  case 'help':
  default:
    console.log(`
COMANDOS DISPONÍVEIS:

LISTAR:
  node db-query.js usuarios
  node db-query.js clientes
  node db-query.js produtos
  node db-query.js vendas

ATUALIZAR:
  node db-query.js update-usuario <id> <nome> <email>
  node db-query.js update-cliente <id> <nome> <email>
  node db-query.js update-produto <id> <nome> <preco>

EXCLUIR:
  node db-query.js delete-cliente <id>
  node db-query.js delete-produto <id>
  node db-query.js delete-venda <id>
    `);
    db.close();
}
