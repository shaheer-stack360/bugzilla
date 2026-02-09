import express from 'express';
import { 
  login, 
  register, 
  logout
} from '../controllers/auth.controller.js';
import authenticateJWT from '../middleware/authenticateJWT.js';
import bugRoutes from '../routes/bugs.routes.js';
import adminRoutes from '../routes/admin.routes.js';

const router = express.Router();

// ========== PUBLIC ROUTES ==========
// Auth routes
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);

// ========== PROTECTED ROUTES ==========
// Bug routes
router.use('/bugs', authenticateJWT(), bugRoutes);
router.use('/admin', adminRoutes);

// Admin routes
//router.use('/admin', authenticateJWT(), adminRoutes);

// ========== 404 HANDLER ==========
router.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

export default router;