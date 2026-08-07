const express = require('express');
const { 
  getAllUsers, 
  createUser, 
  setUserStatus, 
  updateUserPassword 
} = require('../services/userService');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/permissions');

const router = express.Router();

// Todas as rotas de gerenciamento de usuários exigem autenticação e perfil ADMIN
router.use(authenticateToken, requireAdmin);

// GET /api/users - Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Criar novo usuário (Admin define nome, email, senha inicial e perfil)
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;
    const newUser = await createUser({ nome, email, senha, perfil });
    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// PATCH /api/users/:id/status - Ativar/Desativar usuário
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    
    if (typeof ativo !== 'boolean') {
      return res.status(400).json({ error: 'O campo "ativo" deve ser boolean (true/false).' });
    }

    const updatedUser = await setUserStatus(id, ativo);
    return res.json(updatedUser);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// PATCH /api/users/:id/password - Alterar senha de um usuário
router.patch('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { novaSenha } = req.body;

    const updatedUser = await updateUserPassword(id, novaSenha);
    return res.json({ message: 'Senha alterada com sucesso.', user: updatedUser });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
