import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database.js';

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    await query(
      'INSERT INTO usuarios (username, email, password) VALUES ($1, $2, $3)',
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ message: 'Usuário ou email já existe' });
    }
    console.error('Erro ao registrar usuário:', err);
    return res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username e password são obrigatórios' });
  }

  try {
    const result = await query('SELECT * FROM usuarios WHERE username = $1', [username]);
    const user = result.rows ? result.rows[0] : result[0];

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    console.log('Usuário encontrado:', user.username);
    console.log('Senha armazenada:', user.password);
    console.log('Senha enviada:', password);
    
    const passwordMatch = bcrypt.compareSync(password, user.password);
    console.log('Senha corresponde?', passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'sua-chave-secreta',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    return res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
};

export const changePassword = async (req, res) => {
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

  try {
    const result = await query('SELECT * FROM usuarios WHERE username = $1', [username]);
    const user = result.rows ? result.rows[0] : result[0];

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    const passwordMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    await query(
      'UPDATE usuarios SET password = $1 WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar senha:', err);
    return res.status(500).json({ message: 'Erro ao alterar senha' });
  }
};
