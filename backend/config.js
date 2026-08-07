module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'helpdesk_super_secret_jwt_key_2026',
  JWT_EXPIRES_IN: '24h'
};
