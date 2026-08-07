const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const { getUserByEmailWithPassword, sanitizeUser } = require('../services/userService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const user = await getUserByEmailWithPassword(email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
    }

    // Regra de negócio: Usuário inativo não pode realizar login
    if (!user.ativo) {
      return res.status(403).json({ error: 'Sua conta está inativa. Entre em contato com o administrador do sistema.' });
    }

    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
    }

    // Gerar token de sessão JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, perfil: user.perfil },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('[Auth Route Error]:', error);
    return res.status(500).json({ error: 'Erro interno ao processar autenticação.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
