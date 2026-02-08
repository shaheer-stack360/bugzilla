import jwt from 'jsonwebtoken';
import { defineAbilityFor } from '../common/ability.js';

export default function authenticateJWT() {
  return (req, res, next) => {
    // Accept token from cookie or Authorization header (Bearer)
    const cookieToken = req.cookies?.token;
    const headerToken = req.headers?.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null;
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ message: 'Missing token' });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = { 
        id: payload.sub, 
        role: payload.role || '',  
        permissions: payload.permissions || [] 
      };
      
      req.ability = defineAbilityFor(req.user, req.user.permissions);
      
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}