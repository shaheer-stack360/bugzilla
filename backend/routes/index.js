// routes/index.js
import express from 'express';
import { 
  login, 
  register, 
  logout, 
  verify 
} from '../controllers/auth.controller.js';
import authenticateJWT from '../middleware/authenticateJWT.js';

import bugRoutes from '../routes';
/*import userRoutes from './users.js';
import adminRoutes from './admin.js';*/

const router = express.Router();

// ========== PUBLIC ROUTES ==========
// Auth routes
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/verify', authenticateJWT(), verify);

// ========== PROTECTED ROUTES ==========
// Bug routes
router.use('/bugs', authenticateJWT(), bugRoutes);

// User management routes (for admins)
/*router.use('/users', authenticateJWT(), userRoutes);

// Admin routes
router.use('/admin', authenticateJWT(), adminRoutes);

// ========== HEALTH CHECK ==========
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Bugzilla API'
  });
});*/

// ========== 404 HANDLER ==========
router.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: {
      public: ['POST /login', 'POST /register', 'POST /logout', 'GET /verify'],
      protected: ['GET /bugs', 'GET /users', 'GET /admin/*']
    }
  });
});

export default router;