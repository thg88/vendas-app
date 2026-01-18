import { query } from '../database.js';

export const getAllClients = async (req, res) => {
  try {
    const result = await query('SELECT * FROM clientes ORDER BY nome');
    const rows = result.rows || result;
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar clientes:', err);
    return res.status(500).json({ message: 'Erro ao buscar clientes' });
  }
};

export const getClientById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('SELECT * FROM clientes WHERE id = $1', [id]);
    const row = result.rows ? result.rows[0] : result[0];
    
    if (!row) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(row);
  } catch (err) {
    console.error('Erro ao buscar cliente:', err);
    return res.status(500).json({ message: 'Erro ao buscar cliente' });
  }
};

export const createClient = async (req, res) => {
  const { nome, email, telefone, endereco } = req.body;

  if (!nome) {
    return res.status(400).json({ message: 'Nome é obrigatório' });
  }

  try {
    const result = await query(
      'INSERT INTO clientes (nome, email, telefone, endereco) VALUES ($1, $2, $3, $4) RETURNING id',
      [nome, email || null, telefone || null, endereco || null]
    );
    
    const insertedId = result.rows ? result.rows[0].id : result[0].id;
    res.status(201).json({ 
      id: insertedId, 
      nome, 
      email: email || null, 
      telefone: telefone || null, 
      endereco: endereco || null 
    });
  } catch (err) {
    console.error('Erro ao criar cliente:', err);
    return res.status(500).json({ message: 'Erro ao criar cliente' });
  }
};

export const updateClient = async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, endereco } = req.body;

  if (!nome) {
    return res.status(400).json({ message: 'Nome é obrigatório' });
  }

  try {
    await query(
      'UPDATE clientes SET nome = $1, email = $2, telefone = $3, endereco = $4 WHERE id = $5',
      [nome, email || null, telefone || null, endereco || null, id]
    );
    res.json({ message: 'Cliente atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar cliente:', err);
    return res.status(500).json({ message: 'Erro ao atualizar cliente' });
  }
};

export const deleteClient = async (req, res) => {
  const { id } = req.params;

  try {
    await query('DELETE FROM clientes WHERE id = $1', [id]);
    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar cliente:', err);
    return res.status(500).json({ message: 'Erro ao deletar cliente' });
  }
};
