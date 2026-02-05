import jwt from 'jsonwebtoken';

export default function authenticateJWT() {
  return (req, res, next) => {
    console.log('🔐 AuthenticateJWT Middleware called');
    
    // Get token ONLY from cookies
    const token = req.cookies?.token;
    
    if (!token) {
      console.log('❌ No token found in cookies');
      return res.status(401).json({ message: 'Missing token' });
    }
    
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ JWT verified successfully:', {
        sub: payload.sub,
        role: payload.role,
        permissions: payload.permissions
      });
      
      req.user = { 
        id: payload.sub, 
        role: payload.role || '',  
        permissions: payload.permissions || [] 
      };
      
      console.log('📋 req.user set to:', req.user);
      next();
    } catch (err) {
      console.error('❌ JWT verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}