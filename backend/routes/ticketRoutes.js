const express = require('express');
const { 
  getTickets, 
  getTicketById, 
  createTicket, 
  respondTicket, 
  updateTicketStatus 
} = require('../services/ticketService');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireUserRole } = require('../middleware/permissions');

const router = express.Router();

// Todas as rotas de ticket requerem autenticação
router.use(authenticateToken);

// GET /api/tickets - Listagem de tickets (usuário vê os próprios; admin vê todos)
router.get('/', async (req, res) => {
  try {
    const { status, prioridade } = req.query;
    const tickets = await getTickets({ 
      currentUser: req.user, 
      status, 
      prioridade 
    });
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/tickets/:id - Obter ticket individual
router.get('/:id', async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.id, req.user);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado.' });
    }
    return res.json(ticket);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }
});

// POST /api/tickets - Criar novo ticket (Exclusivo perfil USUARIO)
router.post('/', requireUserRole, async (req, res) => {
  try {
    const { titulo, descricao, prioridade } = req.body;
    const newTicket = await createTicket({
      titulo,
      descricao,
      prioridade,
      userId: req.user.id
    });
    return res.status(201).json(newTicket);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// PATCH /api/tickets/:id/responder - Responder ticket (Exclusivo perfil ADMIN)
router.patch('/:id/responder', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { resposta, newStatus } = req.body;
    
    const updatedTicket = await respondTicket({
      ticketId: id,
      adminId: req.user.id,
      resposta,
      newStatus
    });
    return res.json(updatedTicket);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// PATCH /api/tickets/:id/status - Alterar status do ticket (Exclusivo perfil ADMIN)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedTicket = await updateTicketStatus({
      ticketId: id,
      adminId: req.user.id,
      status
    });
    return res.json(updatedTicket);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
