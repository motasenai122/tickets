const Auth = {
  getCurrentUser() {
    const raw = localStorage.getItem('helpdesk_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    localStorage.setItem('helpdesk_user', JSON.stringify(user));
  },

  async login(email, senha) {
    const data = await API.post('/api/auth/login', { email, senha });
    API.setToken(data.token);
    this.setCurrentUser(data.user);
    return data.user;
  },

  logout() {
    API.removeToken();
    window.App.showLoginView();
    window.App.showToast('Sessão encerrada com sucesso.', 'info');
  },

  async verifySession() {
    const token = API.getToken();
    if (!token) return null;

    try {
      const data = await API.get('/api/auth/me');
      this.setCurrentUser(data.user);
      return data.user;
    } catch (error) {
      API.removeToken();
      return null;
    }
  }
};
