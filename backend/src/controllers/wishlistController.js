import db from '../database.js';

// Obter todos os desejos
export const getAllWishes = (req, res) => {
  db.all('SELECT * FROM wishlist ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar desejos' });
    }
    res.json(rows || []);
  });
};

// Obter desejo por ID
export const getWishById = (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM wishlist WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar desejo' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Desejo não encontrado' });
    }
    res.json(row);
  });
};

// Criar novo desejo
export const createWish = (req, res) => {
  const { nome, item, data_pedido } = req.body;

  if (!nome || !item || !data_pedido) {
    return res.status(400).json({ message: 'Nome, item e data do pedido são obrigatórios' });
  }

  db.run(
    'INSERT INTO wishlist (nome, item, data_pedido) VALUES (?, ?, ?)',
    [nome, item, data_pedido],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Erro ao criar desejo' });
      }
      res.status(201).json({
        id: this.lastID,
        nome,
        item,
        data_pedido,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  );
};

// Atualizar desejo
export const updateWish = (req, res) => {
  const { id } = req.params;
  const { nome, item, data_pedido } = req.body;

  if (!nome || !item || !data_pedido) {
    return res.status(400).json({ message: 'Nome, item e data do pedido são obrigatórios' });
  }

  db.run(
    'UPDATE wishlist SET nome = ?, item = ?, data_pedido = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [nome, item, data_pedido, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Erro ao atualizar desejo' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Desejo não encontrado' });
      }
      res.json({ message: 'Desejo atualizado com sucesso' });
    }
  );
};

// Deletar desejo
export const deleteWish = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM wishlist WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Erro ao deletar desejo' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Desejo não encontrado' });
    }
    res.json({ message: 'Desejo deletado com sucesso' });
  });
};
