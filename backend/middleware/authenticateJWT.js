import jwt from 'jsonwebtoken';
import { defineAbilityFor } from '../utils/ability.js';

// ✅ Zero DB queries on every request.
// name, email, isActive are now embedded in the JWT at login/register time.

export default function authenticateJWT() {
  return (req, res, next) => {
    const cookieToken = req.cookies?.token;
    const headerToken = req.headers?.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ message: 'Missing token' });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ isActive check from token — no DB needed
      if (payload.isActive === false) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      req.user = {
        id: payload.sub,
        role: payload.role,
        permissions: payload.permissions || []
      };

      // ✅ Reconstruct dbUser from token — no User.findById() call
      req.dbUser = {
        _id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: { name: payload.role },
        isActive: payload.isActive ?? true
      };

      req.ability = defineAbilityFor(req.user, req.user.permissions);

      next();
    } catch (err) {
      console.error('JWT Error:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}