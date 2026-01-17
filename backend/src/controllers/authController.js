import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';

export const register = (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ message: 'Usuário ou email já existe' });
        }
        return res.status(500).json({ message: 'Erro ao registrar usuário' });
      }
      res.status(201).json({ message: 'Usuário registrado com sucesso' });
    }
  );
};

export const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username e password são obrigatórios' });
  }

  db.get('SELECT * FROM usuarios WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar usuário' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  });
};

export const changePassword = (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Nova senha deve ter no mínimo 6 caracteres' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'Nova senha não pode ser igual à atual' });
  }

  db.get('SELECT * FROM usuarios WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar usuário' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    const passwordMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    db.run(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, user.id],
      (err) => {
        if (err) {
          console.error('Erro ao atualizar senha:', err);
          return res.status(500).json({ message: 'Erro ao alterar senha' });
        }
        res.json({ message: 'Senha alterada com sucesso' });
      }
    );
  });
};
