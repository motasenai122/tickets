const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('./dataStore');

const USERS_FILE = 'usuarios.json';

function sanitizeUser(user) {
  if (!user) return null;
  const { senha, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function getAllUsers() {
  const users = readData(USERS_FILE);
  return users.map(sanitizeUser);
}

async function getUserById(id) {
  const users = readData(USERS_FILE);
  const user = users.find(u => u.id === id);
  return user ? sanitizeUser(user) : null;
}

async function getUserByEmailWithPassword(email) {
  const users = readData(USERS_FILE);
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

async function createUser({ nome, email, senha, perfil }) {
  if (!nome || !email || !senha || !perfil) {
    throw new Error('Todos os campos obrigatórios (nome, email, senha, perfil) devem ser preenchidos.');
  }

  const normalizedPerfil = perfil.toLowerCase();
  if (!['admin', 'usuario'].includes(normalizedPerfil)) {
    throw new Error('Perfil inválido. Deve ser "admin" ou "usuario".');
  }

  const users = readData(USERS_FILE);
  const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    throw new Error('Já existe um usuário cadastrado com este e-mail.');
  }

  const hashedPassword = await bcrypt.hash(senha, 10);
  const newUser = {
    id: uuidv4(),
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    senha: hashedPassword,
    perfil: normalizedPerfil,
    ativo: true,
    criadoEm: new Date().toISOString()
  };

  users.push(newUser);
  await writeData(USERS_FILE, users);

  return sanitizeUser(newUser);
}

async function setUserStatus(id, ativo) {
  const users = readData(USERS_FILE);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    throw new Error('Usuário não encontrado.');
  }

  users[userIndex].ativo = Boolean(ativo);
  await writeData(USERS_FILE, users);

  return sanitizeUser(users[userIndex]);
}

async function updateUserPassword(id, newPassword) {
  if (!newPassword || newPassword.trim().length < 4) {
    throw new Error('A nova senha deve ter no mínimo 4 caracteres.');
  }

  const users = readData(USERS_FILE);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    throw new Error('Usuário não encontrado.');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  users[userIndex].senha = hashedPassword;
  await writeData(USERS_FILE, users);

  return sanitizeUser(users[userIndex]);
}

/**
 * Garante a existência de usuários padrão (Admin e Usuário) no momento em que o sistema sobe.
 */
async function seedInitialUsers() {
  const users = readData(USERS_FILE);
  
  const hasAdmin = users.some(u => u.perfil === 'admin');
  if (!hasAdmin) {
    console.log('[Seeding] Criando usuário admin padrão...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = {
      id: uuidv4(),
      nome: 'Administrador do Sistema',
      email: 'admin@helpdesk.com',
      senha: adminPassword,
      perfil: 'admin',
      ativo: true,
      criadoEm: new Date().toISOString()
    };
    users.push(adminUser);
  }

  const hasUser = users.some(u => u.perfil === 'usuario');
  if (!hasUser) {
    console.log('[Seeding] Criando usuário comum de teste...');
    const userPassword = await bcrypt.hash('user123', 10);
    const normalUser = {
      id: uuidv4(),
      nome: 'João Silva',
      email: 'usuario@helpdesk.com',
      senha: userPassword,
      perfil: 'usuario',
      ativo: true,
      criadoEm: new Date().toISOString()
    };
    users.push(normalUser);
  }

  await writeData(USERS_FILE, users);
}

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmailWithPassword,
  createUser,
  setUserStatus,
  updateUserPassword,
  seedInitialUsers,
  sanitizeUser
};
