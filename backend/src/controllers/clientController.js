import db from '../database.js';

export const getAllClients = (req, res) => {
  db.all('SELECT * FROM clientes ORDER BY nome', (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar clientes' });
    }
    res.json(rows);
  });
};

export const getClientById = (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM clientes WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar cliente' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(row);
  });
};

export const createClient = (req, res) => {
  const { nome, email, telefone, endereco } = req.body;

  if (!nome) {
    return res.status(400).json({ message: 'Nome é obrigatório' });
  }

  db.run(
    'INSERT INTO clientes (nome, email, telefone, endereco) VALUES (?, ?, ?, ?)',
    [nome, email || null, telefone || null, endereco || null],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Erro ao criar cliente' });
      }
      res.status(201).json({ 
        id: this.lastID, 
        nome, 
        email: email || null, 
        telefone: telefone || null, 
        endereco: endereco || null 
      });
    }
  );
};

export const updateClient = (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, endereco } = req.body;

  if (!nome) {
    return res.status(400).json({ message: 'Nome é obrigatório' });
  }

  db.run(
    'UPDATE clientes SET nome = ?, email = ?, telefone = ?, endereco = ? WHERE id = ?',
    [nome, email || null, telefone || null, endereco || null, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Erro ao atualizar cliente' });
      }
      res.json({ message: 'Cliente atualizado com sucesso' });
    }
  );
};

export const deleteClient = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM clientes WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Erro ao deletar cliente' });
    }
    res.json({ message: 'Cliente deletado com sucesso' });
  });
};
