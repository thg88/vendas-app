import db from '../database.js';

export const getAllProducts = (req, res) => {
  db.all(`
    SELECT p.*, l.numero_lote, l.status as lote_status
    FROM produtos p 
    LEFT JOIN lotes l ON p.lote_id = l.id 
    ORDER BY p.nome
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar produtos' });
    }
    res.json(rows);
  });
};

export const getProductById = (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT p.*, l.numero_lote, l.status as lote_status
    FROM produtos p 
    LEFT JOIN lotes l ON p.lote_id = l.id 
    WHERE p.id = ?
  `, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar produto' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(row);
  });
};

export const createProduct = (req, res) => {
  const { nome, descricao, preco, estoque, tipo, lote_id } = req.body;

  if (!nome || !preco) {
    return res.status(400).json({ message: 'Nome e preço são obrigatórios' });
  }

  // Se lote_id foi fornecido, verificar se o lote está aberto
  if (lote_id) {
    db.get("SELECT status FROM lotes WHERE id = ?", [lote_id], (err, lote) => {
      if (err || !lote) {
        return res.status(400).json({ message: 'Lote não encontrado ou inválido' });
      }
      if (lote.status !== 'aberto') {
        return res.status(400).json({ message: 'Não é possível adicionar produtos a um lote fechado' });
      }

      insertProduct(nome, descricao, preco, estoque, tipo, lote_id, res);
    });
  } else {
    insertProduct(nome, descricao, preco, estoque, tipo, null, res);
  }
};

const insertProduct = (nome, descricao, preco, estoque, tipo, lote_id, res) => {
  db.run(
    'INSERT INTO produtos (nome, descricao, preco, estoque, estoque_original, tipo, lote_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nome, descricao || null, preco, estoque || 0, estoque || 0, tipo || null, lote_id || null],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Erro ao criar produto' });
      }
      res.status(201).json({ 
        id: this.lastID, 
        nome, 
        descricao: descricao || null, 
        preco, 
        estoque: estoque || 0,
        estoque_original: estoque || 0,
        tipo: tipo || null,
        lote_id: lote_id || null
      });
    }
  );
};

export const updateProduct = (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, estoque, tipo } = req.body;

  if (!nome || !preco) {
    return res.status(400).json({ message: 'Nome e preço são obrigatórios' });
  }

  db.run(
    'UPDATE produtos SET nome = ?, descricao = ?, preco = ?, estoque = ?, tipo = ? WHERE id = ?',
    [nome, descricao || null, preco, estoque || 0, tipo || null, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Erro ao atualizar produto' });
      }
      res.json({ message: 'Produto atualizado com sucesso' });
    }
  );
};

export const deleteProduct = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM produtos WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Erro ao deletar produto' });
    }
    res.json({ message: 'Produto deletado com sucesso' });
  });
};
