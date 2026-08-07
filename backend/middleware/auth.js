const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { readData } = require('../services/dataStore');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token de autenticação não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = readData('usuarios.json');
    const user = users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Sessão inválida. Usuário não encontrado no sistema.' });
    }

    if (!user.ativo) {
      return res.status(403).json({ error: 'Acesso bloqueado. Esta conta de usuário está inativa.' });
    }

    // Anexa informações do usuário autenticado no request (sem a senha)
    const { senha, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessão expirada. Por favor, faça login novamente.' });
    }
    return res.status(403).json({ error: 'Token de autenticação inválido ou corrompido.' });
  }
}

module.exports = {
  authenticateToken
};
