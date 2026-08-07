const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORT } = require('./backend/config');
const { seedInitialUsers } = require('./backend/services/userService');

const authRoutes = require('./backend/routes/authRoutes');
const userRoutes = require('./backend/routes/userRoutes');
const ticketRoutes = require('./backend/routes/ticketRoutes');

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do front-end
app.use(express.static(path.join(__dirname, 'frontend')));

// Rotas da API REST
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);

// Rota genérica para SPA - redirecionar index.html para qualquer página não API
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Rota de API não encontrada.' });
  }
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Inicialização do servidor com Seeding Padrão
async function startServer(initialPort = PORT) {
  try {
    await seedInitialUsers();
    
    const server = app.listen(initialPort, () => {
      const actualPort = server.address().port;
      console.log(`===================================================`);
      console.log(` Servidor HelpDesk rodando com sucesso!`);
      console.log(` Endereço Local: http://localhost:${actualPort}`);
      console.log(` Credenciais de Admin Inicial: admin@helpdesk.com / admin123`);
      console.log(` Credenciais de Usuário Inicial: usuario@helpdesk.com / user123`);
      console.log(`===================================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Aviso] Porta ${initialPort} em uso. Tentando a porta ${Number(initialPort) + 1}...`);
        startServer(Number(initialPort) + 1);
      } else {
        console.error('Falha ao inicializar o servidor:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Falha ao inicializar o servidor:', error);
    process.exit(1);
  }
}

startServer();

