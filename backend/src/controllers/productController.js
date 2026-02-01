import { query } from '../database.js';

export const getAllProducts = async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, l.numero_lote, l.status as lote_status
      FROM produtos p 
      LEFT JOIN lotes l ON p.lote_id = l.id 
      ORDER BY p.nome
    `);
    const rows = result.rows || result;
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    return res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(`
      SELECT p.*, l.numero_lote, l.status as lote_status
      FROM produtos p 
      LEFT JOIN lotes l ON p.lote_id = l.id 
      WHERE p.id = $1
    `, [id]);
    
    const row = result.rows ? result.rows[0] : result[0];
    if (!row) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(row);
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    return res.status(500).json({ message: 'Erro ao buscar produto' });
  }
};

export const createProduct = async (req, res) => {
  const { nome, descricao, preco, estoque, tipo, lote_id } = req.body;

  if (!nome || !preco) {
    return res.status(400).json({ message: 'Nome e preço são obrigatórios' });
  }

  // Se lote_id foi fornecido, verificar se o lote está aberto
  if (lote_id) {
    try {
      const loteResult = await query("SELECT status FROM lotes WHERE id = $1", [lote_id]);
      const lote = loteResult.rows ? loteResult.rows[0] : loteResult[0];
      
      if (!lote) {
        return res.status(400).json({ message: 'Lote não encontrado ou inválido' });
      }
      if (lote.status !== 'aberto') {
        return res.status(400).json({ message: 'Não é possível adicionar produtos a um lote fechado' });
      }

      await insertProduct(nome, descricao, preco, estoque, tipo, lote_id, res);
    } catch (err) {
      console.error('Erro ao verificar lote:', err);
      return res.status(400).json({ message: 'Lote não encontrado ou inválido' });
    }
  } else {
    await insertProduct(nome, descricao, preco, estoque, tipo, null, res);
  }
};

const insertProduct = async (nome, descricao, preco, estoque, tipo, lote_id, res) => {
  try {
    const result = await query(
      'INSERT INTO produtos (nome, descricao, preco, estoque, estoque_original, tipo, lote_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [nome, descricao || null, preco, estoque || 0, estoque || 0, tipo || null, lote_id || null]
    );
    
    const insertedId = result.rows ? result.rows[0].id : result[0].id;
    res.status(201).json({ 
      id: insertedId, 
      nome, 
      descricao: descricao || null, 
      preco, 
      estoque: estoque || 0,
      estoque_original: estoque || 0,
      tipo: tipo || null,
      lote_id: lote_id || null
    });
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    return res.status(500).json({ message: 'Erro ao criar produto' });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, estoque, tipo } = req.body;

  if (!nome || !preco) {
    return res.status(400).json({ message: 'Nome e preço são obrigatórios' });
  }

  try {
    await query(
      'UPDATE produtos SET nome = $1, descricao = $2, preco = $3, estoque = $4, estoque_original = $4, tipo = $5 WHERE id = $6',
      [nome, descricao || null, preco, estoque || 0, tipo || null, id]
    );
    res.json({ message: 'Produto atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    return res.status(500).json({ message: 'Erro ao atualizar produto' });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    await query('DELETE FROM produtos WHERE id = $1', [id]);
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    return res.status(500).json({ message: 'Erro ao deletar produto' });
  }
};
