const App = {
  async init() {
    this.bindEvents();
    const user = await Auth.verifySession();

    if (user) {
      this.showDashboard(user);
    } else {
      this.showLoginView();
    }
  },

  bindEvents() {
    // Form de Login
    document.getElementById('form-login')?.addEventListener('submit', (e) => this.handleLogin(e));

    // Botão de Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => Auth.logout());

    // Fechar modais ao clicar no X ou no backdrop
    document.querySelectorAll('.close-btn, [data-dismiss="modal"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-backdrop');
        if (modal) this.closeModal(modal.id);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeModal(backdrop.id);
        }
      });
    });
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-password').value;

    try {
      const user = await Auth.login(email, senha);
      this.showToast(`Bem-vindo(a), ${user.nome}!`, 'success');
      this.showDashboard(user);
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  },

  fillDemo(email, senha) {
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = senha;
  },

  showLoginView() {
    document.getElementById('view-login').classList.remove('hidden');
    document.getElementById('view-admin').classList.add('hidden');
    document.getElementById('view-user').classList.add('hidden');
    document.getElementById('header-user-nav').classList.add('hidden');
  },

  showDashboard(user) {
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('header-user-nav').classList.remove('hidden');

    document.getElementById('nav-user-name').textContent = user.nome;
    const badgeEl = document.getElementById('nav-user-role-badge');
    badgeEl.textContent = user.perfil.toUpperCase();
    badgeEl.className = `badge badge-${user.perfil}`;

    if (user.perfil === 'admin') {
      document.getElementById('view-admin').classList.remove('hidden');
      document.getElementById('view-user').classList.add('hidden');
      AdminView.init();
    } else {
      document.getElementById('view-user').classList.remove('hidden');
      document.getElementById('view-admin').classList.add('hidden');
      UserView.init();
    }
  },

  /* --- MODAL CONTROL --- */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
  },

  /* --- TOAST NOTIFICATIONS --- */
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  }
};

// Expor o objeto App no objeto window para acessibilidade global
window.App = App;

// Inicializa a aplicação ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

