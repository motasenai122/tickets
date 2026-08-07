const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('./dataStore');

const TICKETS_FILE = 'tickets.json';
const USERS_FILE = 'usuarios.json';

const VALID_STATUSES = ['aberto', 'em_andamento', 'resolvido', 'fechado'];
const VALID_PRIORITIES = ['baixa', 'media', 'alta'];

/**
 * Popula os dados do usuário criador e do admin que respondeu,
 * sem duplicar ou persistir esses dados no arquivo tickets.json.
 */
function populateTicket(ticket, users) {
  const creator = users.find(u => u.id === ticket.criadoPor);
  const responder = ticket.respondidoPor ? users.find(u => u.id === ticket.respondidoPor) : null;

  return {
    ...ticket,
    criadoPor: creator
      ? { id: creator.id, nome: creator.nome, email: creator.email }
      : { id: ticket.criadoPor, nome: 'Usuário Removido', email: 'n/a' },
    respondidoPor: responder
      ? { id: responder.id, nome: responder.nome, email: responder.email }
      : null
  };
}

async function getTickets({ currentUser, status, prioridade }) {
  const tickets = readData(TICKETS_FILE);
  const users = readData(USERS_FILE);

  let filtered = tickets;

  // Regra de perfil: Usuários só enxergam os próprios tickets; Admins enxergam tudo
  if (currentUser.perfil === 'usuario') {
    filtered = filtered.filter(t => t.criadoPor === currentUser.id);
  }

  if (status && VALID_STATUSES.includes(status)) {
    filtered = filtered.filter(t => t.status === status);
  }

  if (prioridade && VALID_PRIORITIES.includes(prioridade)) {
    filtered = filtered.filter(t => t.prioridade === prioridade);
  }

  // Ordenar do mais recente para o mais antigo
  filtered.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  return filtered.map(ticket => populateTicket(ticket, users));
}

async function getTicketById(id, currentUser) {
  const tickets = readData(TICKETS_FILE);
  const users = readData(USERS_FILE);

  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return null;

  if (currentUser.perfil === 'usuario' && ticket.criadoPor !== currentUser.id) {
    throw new Error('Acesso negado. Você não tem permissão para visualizar este ticket.');
  }

  return populateTicket(ticket, users);
}

async function createTicket({ titulo, descricao, prioridade, userId }) {
  if (!titulo || !descricao || !prioridade) {
    throw new Error('Título, descrição e prioridade são obrigatórios.');
  }

  if (!VALID_PRIORITIES.includes(prioridade.toLowerCase())) {
    throw new Error('Prioridade inválida. Escolha entre baixa, media ou alta.');
  }

  const users = readData(USERS_FILE);
  const user = users.find(u => u.id === userId);

  // Validação de integridade referencial e status do usuário
  if (!user) {
    throw new Error('Não é possível criar um ticket para um usuário inexistente.');
  }
  if (!user.ativo) {
    throw new Error('Usuário inativo. Não é permitido criar tickets.');
  }

  const newTicket = {
    id: uuidv4(),
    titulo: titulo.trim(),
    descricao: descricao.trim(),
    status: 'aberto',
    prioridade: prioridade.toLowerCase(),
    criadoPor: userId,
    respondidoPor: null,
    resposta: null,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };

  const tickets = readData(TICKETS_FILE);
  tickets.push(newTicket);
  await writeData(TICKETS_FILE, tickets);

  return populateTicket(newTicket, users);
}

async function respondTicket({ ticketId, adminId, resposta, newStatus }) {
  if (!resposta || !resposta.trim()) {
    throw new Error('O texto da resposta não pode estar vazio.');
  }

  const users = readData(USERS_FILE);
  const admin = users.find(u => u.id === adminId);

  if (!admin || !admin.ativo || admin.perfil !== 'admin') {
    throw new Error('Apenas administradores ativos podem responder tickets.');
  }

  const tickets = readData(TICKETS_FILE);
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);

  if (ticketIndex === -1) {
    throw new Error('Ticket não encontrado.');
  }

  const ticket = tickets[ticketIndex];
  ticket.resposta = resposta.trim();
  ticket.respondidoPor = adminId;
  ticket.atualizadoEm = new Date().toISOString();

  if (newStatus && VALID_STATUSES.includes(newStatus)) {
    ticket.status = newStatus;
  } else if (ticket.status === 'aberto') {
    ticket.status = 'em_andamento';
  }

  tickets[ticketIndex] = ticket;
  await writeData(TICKETS_FILE, tickets);

  return populateTicket(ticket, users);
}

async function updateTicketStatus({ ticketId, adminId, status }) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Status inválido. Escolha um dos seguintes: ${VALID_STATUSES.join(', ')}.`);
  }

  const users = readData(USERS_FILE);
  const admin = users.find(u => u.id === adminId);

  if (!admin || !admin.ativo || admin.perfil !== 'admin') {
    throw new Error('Apenas administradores ativos podem alterar o status de tickets.');
  }

  const tickets = readData(TICKETS_FILE);
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);

  if (ticketIndex === -1) {
    throw new Error('Ticket não encontrado.');
  }

  tickets[ticketIndex].status = status;
  tickets[ticketIndex].atualizadoEm = new Date().toISOString();

  await writeData(TICKETS_FILE, tickets);

  return populateTicket(tickets[ticketIndex], users);
}

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  respondTicket,
  updateTicketStatus
};
