import express from 'express';
import authenticateJWT from '../middleware/authenticateJWT.js';
import adminOnly from '../middleware/adminCheck.js';
import {
  getDashboardStats,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  activateUser,
  getAllBugsAdmin,
  getBugAdmin,
  updateBugAdmin,
  deleteBugAdmin
} from '../controllers/admin.controller.js';

const router = express.Router();

// Apply adminOnly middleware to all admin routes
router.use(authenticateJWT(), adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/activate', activateUser);

// Bugs
router.get('/bugs', getAllBugsAdmin);
router.get('/bugs/:id', getBugAdmin);
router.put('/bugs/:id', updateBugAdmin);
router.delete('/bugs/:id', deleteBugAdmin);

export default router;