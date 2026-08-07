const API = {
  getToken() {
    return localStorage.getItem('helpdesk_token');
  },

  setToken(token) {
    localStorage.setItem('helpdesk_token', token);
  },

  removeToken() {
    localStorage.removeItem('helpdesk_token');
    localStorage.removeItem('helpdesk_user');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Tratar expiração de token ou falta de autenticação
        if (response.status === 401 && !endpoint.includes('/login')) {
          this.removeToken();
          window.location.reload();
        }
        throw new Error(data.error || `Erro HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`[API Error ${endpoint}]:`, error.message);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }
};
