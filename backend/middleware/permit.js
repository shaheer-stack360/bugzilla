export default function permit(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userPerms = req.user.permissions || [];
    const ok = requiredPermissions.every(p => userPerms.includes(p));
    if (!ok) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}