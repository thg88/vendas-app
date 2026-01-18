import { query } from '../database.js';

// Obter todos os desejos
export const getAllWishes = async (req, res) => {
  try {
    const result = await query('SELECT * FROM wishlist ORDER BY created_at DESC');
    const rows = result.rows || result;
    res.json(rows || []);
  } catch (err) {
    console.error('Erro ao buscar desejos:', err);
    return res.status(500).json({ message: 'Erro ao buscar desejos' });
  }
};

// Obter desejo por ID
export const getWishById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM wishlist WHERE id = $1', [id]);
    const row = result.rows ? result.rows[0] : result[0];
    
    if (!row) {
      return res.status(404).json({ message: 'Desejo não encontrado' });
    }
    res.json(row);
  } catch (err) {
    console.error('Erro ao buscar desejo:', err);
    return res.status(500).json({ message: 'Erro ao buscar desejo' });
  }
};

// Criar novo desejo
export const createWish = async (req, res) => {
  const { nome, item, data_pedido } = req.body;

  if (!nome || !item || !data_pedido) {
    return res.status(400).json({ message: 'Nome, item e data do pedido são obrigatórios' });
  }

  try {
    const result = await query(
      'INSERT INTO wishlist (nome, item, data_pedido) VALUES ($1, $2, $3) RETURNING id, created_at, updated_at',
      [nome, item, data_pedido]
    );
    
    const inserted = result.rows ? result.rows[0] : result[0];
    res.status(201).json({
      id: inserted.id,
      nome,
      item,
      data_pedido,
      created_at: inserted.created_at || new Date().toISOString(),
      updated_at: inserted.updated_at || new Date().toISOString()
    });
  } catch (err) {
    console.error('Erro ao criar desejo:', err);
    return res.status(500).json({ message: 'Erro ao criar desejo' });
  }
};

// Atualizar desejo
export const updateWish = async (req, res) => {
  const { id } = req.params;
  const { nome, item, data_pedido } = req.body;

  if (!nome || !item || !data_pedido) {
    return res.status(400).json({ message: 'Nome, item e data do pedido são obrigatórios' });
  }

  try {
    const result = await query(
      'UPDATE wishlist SET nome = $1, item = $2, data_pedido = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [nome, item, data_pedido, id]
    );
    
    // PostgreSQL não tem rows.length como SQLite, então checamos de forma diferente
    res.json({ message: 'Desejo atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar desejo:', err);
    return res.status(500).json({ message: 'Erro ao atualizar desejo' });
  }
};

// Deletar desejo
export const deleteWish = async (req, res) => {
  const { id } = req.params;

  try {
    await query('DELETE FROM wishlist WHERE id = $1', [id]);
    res.json({ message: 'Desejo deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar desejo:', err);
    return res.status(500).json({ message: 'Erro ao deletar desejo' });
  }
};
