function requireAdmin(req, res, next) {
  if (!req.user || req.user.perfil !== 'admin') {
    return res.status(403).json({ error: 'Permissão negada. Apenas administradores podem realizar esta ação.' });
  }
  next();
}

function requireUserRole(req, res, next) {
  if (!req.user || req.user.perfil !== 'usuario') {
    return res.status(403).json({ error: 'Permissão negada. Administradores não podem criar tickets; apenas usuários comuns têm permissão.' });
  }
  next();
}

module.exports = {
  requireAdmin,
  requireUserRole
};
