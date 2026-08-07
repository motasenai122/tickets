const AdminView = {
  activeTab: 'tickets',

  async init() {
    this.bindEvents();
    await this.render();
  },

  bindEvents() {
    // Alternância de abas
    document.getElementById('tab-admin-tickets')?.addEventListener('click', () => {
      this.switchTab('tickets');
    });

    document.getElementById('tab-admin-users')?.addEventListener('click', () => {
      this.switchTab('users');
    });

    // Filtros de tickets
    document.getElementById('admin-filter-status')?.addEventListener('change', () => this.loadTickets());
    document.getElementById('admin-filter-priority')?.addEventListener('change', () => this.loadTickets());

    // Form Criar Usuário
    document.getElementById('form-create-user')?.addEventListener('submit', (e) => this.handleCreateUser(e));

    // Form Resposta de Ticket
    document.getElementById('form-respond-ticket')?.addEventListener('submit', (e) => this.handleRespondTicket(e));

    // Form Redefinir Senha
    document.getElementById('form-reset-password')?.addEventListener('submit', (e) => this.handleResetPassword(e));
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.add('hidden'));

    if (tabName === 'tickets') {
      document.getElementById('tab-admin-tickets').classList.add('active');
      document.getElementById('admin-tickets-section').classList.remove('hidden');
      this.loadTickets();
    } else {
      document.getElementById('tab-admin-users').classList.add('active');
      document.getElementById('admin-users-section').classList.remove('hidden');
      this.loadUsers();
    }
  },

  async render() {
    if (this.activeTab === 'tickets') {
      await this.loadTickets();
    } else {
      await this.loadUsers();
    }
  },

  /* --- TICKETS --- */
  async loadTickets() {
    const status = document.getElementById('admin-filter-status')?.value || '';
    const prioridade = document.getElementById('admin-filter-priority')?.value || '';

    let query = [];
    if (status) query.push(`status=${status}`);
    if (prioridade) query.push(`prioridade=${prioridade}`);
    const queryString = query.length ? `?${query.join('&')}` : '';

    try {
      const tickets = await API.get(`/api/tickets${queryString}`);
      this.renderKPIs(tickets);
      this.renderTicketsList(tickets);
    } catch (error) {
      App.showToast(error.message, 'error');
    }
  },

  renderKPIs(tickets) {
    document.getElementById('kpi-total').textContent = tickets.length;
    document.getElementById('kpi-open').textContent = tickets.filter(t => t.status === 'aberto').length;
    document.getElementById('kpi-progress').textContent = tickets.filter(t => t.status === 'em_andamento').length;
    document.getElementById('kpi-resolved').textContent = tickets.filter(t => t.status === 'resolvido' || t.status === 'fechado').length;
  },

  renderTicketsList(tickets) {
    const container = document.getElementById('admin-tickets-list');
    if (!container) return;

    if (tickets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📂</div>
          <p>Nenhum ticket encontrado com os filtros aplicados.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tickets.map(ticket => `
      <div class="ticket-card">
        <div class="ticket-card-header">
          <div>
            <h4 class="ticket-title">${this.escapeHtml(ticket.titulo)}</h4>
            <div class="ticket-meta">
              <span>👤 <strong>${this.escapeHtml(ticket.criadoPor?.nome || 'Usuário')}</strong> (${this.escapeHtml(ticket.criadoPor?.email || '')})</span>
              <span>📅 ${new Date(ticket.criadoEm).toLocaleString('pt-BR')}</span>
            </div>
          </div>
          <div style="display: flex; gap: 0.4rem; flex-direction: column; align-items: flex-end;">
            <span class="badge badge-${ticket.status}">${ticket.status.replace('_', ' ')}</span>
            <span class="badge badge-${ticket.prioridade}">${ticket.prioridade}</span>
          </div>
        </div>

        <div class="ticket-desc">${this.escapeHtml(ticket.descricao)}</div>

        ${ticket.resposta ? `
          <div class="ticket-response-box">
            <div class="response-header">
              <span>Resposta de ${this.escapeHtml(ticket.respondidoPor?.nome || 'Admin')}</span>
              <span>${new Date(ticket.atualizadoEm).toLocaleString('pt-BR')}</span>
            </div>
            <div>${this.escapeHtml(ticket.resposta)}</div>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
          <button class="btn btn-primary btn-sm" onclick="AdminView.openRespondModal('${ticket.id}')">
            ${ticket.resposta ? '✏️ Editar Resposta / Status' : '💬 Responder Ticket'}
          </button>
        </div>
      </div>
    `).join('');
  },

  async openRespondModal(ticketId) {
    try {
      const ticket = await API.get(`/api/tickets/${ticketId}`);
      document.getElementById('respond-ticket-id').value = ticket.id;
      document.getElementById('respond-ticket-title').textContent = ticket.titulo;
      document.getElementById('respond-text').value = ticket.resposta || '';
      document.getElementById('respond-status').value = ticket.status;
      
      App.openModal('modal-respond-ticket');
    } catch (error) {
      App.showToast(error.message, 'error');
    }
  },

  async handleRespondTicket(e) {
    e.preventDefault();
    const ticketId = document.getElementById('respond-ticket-id').value;
    const resposta = document.getElementById('respond-text').value;
    const newStatus = document.getElementById('respond-status').value;

    try {
      await API.patch(`/api/tickets/${ticketId}/responder`, { resposta, newStatus });
      App.closeModal('modal-respond-ticket');
      App.showToast('Resposta e status atualizados com sucesso!', 'success');
      this.loadTickets();
    } catch (error) {
      App.showToast(error.message, 'error');
    }
  },

  /* --- USUÁRIOS --- */
  async loadUsers() {
    try {
      const users = await API.get('/api/users');
      this.renderUsersList(users);
    } catch (error) {
      App.showToast(error.message, 'error');
    }
  },

  renderUsersList(users) {
    const container = document.getElementById('admin-users-tbody');
    if (!container) return;

    const currentUser = Auth.getCurrentUser();

    container.innerHTML = users.map(user => `
      <tr>
        <td><strong>${this.escapeHtml(user.nome)}</strong></td>
        <td>${this.escapeHtml(user.email)}</td>
        <td><span class="badge badge-${user.perfil}">${user.perfil}</span></td>
        <td>
          <span class="badge badge-${user.ativo ? 'active' : 'inactive'}">
            ${user.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td>${new Date(user.criadoEm).toLocaleDateString('pt-BR')}</td>
        <td>
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            <button 
              class="btn btn-sm ${user.ativo ? 'btn-danger' : 'btn-success'}"
              onclick="AdminView.toggleUserStatus('${user.id}', ${!user.ativo})"
              ${user.id === currentUser?.id ? 'disabled title="Você não pode desativar seu próprio usuário"' : ''}
            >
              ${user.ativo ? 'Desativar' : 'Reativar'}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AdminView.openResetPasswordModal('${user.id}', '${this.escapeHtml(user.nome)}')">
              🔑 Senha
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  async handleCreateUser(e) {
    e.preventDefault();
    const nome = document.getElementById('new-user-name').value;
    const email = document.getElementById('new-user-email').value;
    const senha = document.getElementById('new-user-password').value;
    const perfil = document.getElementById('new-user-role').value;

    try {
      await API.post('/api/users', { nome, email, senha, perfil });
      document.getElementById('form-create-user').reset();
      App.closeModal('modal-create-user');
      App.showToast('Novo usuário cadastrado com sucesso!', 'success');
      this.loadUsers();
    } catch (error) {
      App.showToast(error.message, 'error');
    }
  },

  async toggleUserStatus(userId, newStatus) {
    try {
      await API.patch(`/api/users/${userId}/status`, { ativo: newStatus });
      App.showToast(`Usuário ${newStatus ? 'reativado' : 'desativado'} com sucesso!`, 'info');
      this.loadUsers();
    } catch (error) {
      App.showToast(error.message, 'error');
    }
  },

  openResetPasswordModal(userId, userName) {
    document.getElementById('reset-user-id').value = userId;
    document.getElementById('reset-user-name-display').textContent = userName;
    document.getElementById('reset-new-password').value = '';
    App.openModal('modal-reset-password');
  },

  async handleResetPassword(e) {
    e.preventDefault();
    const userId = document.getElementById('reset-user-id').value;
    const novaSenha = document.getElementById('reset-new-password').value;

    try {
      await API.patch(`/api/users/${userId}/password`, { novaSenha });
      App.closeModal('modal-reset-password');
      App.showToast('Senha alterada com sucesso!', 'success');
    } catch (error) {
      App.showToast(error.message, 'error');
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
