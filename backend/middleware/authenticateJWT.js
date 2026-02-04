import jwt from 'jsonwebtoken';

export default function authenticateJWT() {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });

    const token = auth.split(' ')[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      req.user = { id: payload.sub, roles: payload.roles || [], permissions: payload.permissions || [] };
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}