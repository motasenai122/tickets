const UserView = {
  async init() {
    this.bindEvents();
    await this.loadTickets();
  },

  bindEvents() {
    document.getElementById('user-filter-status')?.addEventListener('change', () => this.loadTickets());
    document.getElementById('user-filter-priority')?.addEventListener('change', () => this.loadTickets());

    document.getElementById('form-create-ticket')?.addEventListener('submit', (e) => this.handleCreateTicket(e));
  },

  async loadTickets() {
    const status = document.getElementById('user-filter-status')?.value || '';
    const prioridade = document.getElementById('user-filter-priority')?.value || '';

    let query = [];
    if (status) query.push(`status=${status}`);
    if (prioridade) query.push(`prioridade=${prioridade}`);
    const queryString = query.length ? `?${query.join('&')}` : '';

    try {
      const tickets = await API.get(`/api/tickets${queryString}`);
      this.renderTickets(tickets);
    } catch (error) {
      App.showToast(error.message, 'error');
    }
  },

  renderTickets(tickets) {
    const container = document.getElementById('user-tickets-list');
    if (!container) return;

    if (tickets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎫</div>
          <p>Você ainda não possui tickets cadastrados com estes filtros.</p>
          <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="App.openModal('modal-create-ticket')">
            ➕ Abrir Meu Primeiro Ticket
          </button>
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
              <span>📅 Criado em ${new Date(ticket.criadoEm).toLocaleString('pt-BR')}</span>
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
              <span>💬 Resposta do Suporte (${this.escapeHtml(ticket.respondidoPor?.nome || 'Admin')})</span>
              <span>${new Date(ticket.atualizadoEm).toLocaleString('pt-BR')}</span>
            </div>
            <div>${this.escapeHtml(ticket.resposta)}</div>
          </div>
        ` : `
          <div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; margin-top: 0.5rem;">
            ⏳ Aguardando análise da equipe de suporte...
          </div>
        `}
      </div>
    `).join('');
  },

  async handleCreateTicket(e) {
    e.preventDefault();
    const titulo = document.getElementById('ticket-title-input').value;
    const descricao = document.getElementById('ticket-desc-input').value;
    const prioridade = document.getElementById('ticket-priority-input').value;

    try {
      await API.post('/api/tickets', { titulo, descricao, prioridade });
      document.getElementById('form-create-ticket').reset();
      App.closeModal('modal-create-ticket');
      App.showToast('Ticket criado com sucesso!', 'success');
      this.loadTickets();
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
