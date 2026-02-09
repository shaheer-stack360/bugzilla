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


// GET dashboard statistics
router.get('/dashboard', getDashboardStats);


// GET all users with pagination
router.get('/users', getAllUsers);

// GET single user
router.get('/users/:id', getUser);

// PUT update user
router.put('/users/:id', updateUser);

// DELETE user (soft delete)
router.delete('/users/:id', deleteUser);

// Activate user
router.put('/users/:id/activate', activateUser);

// GET all bugs (admin can see all without filters)
router.get('/bugs', getAllBugsAdmin);

// GET bug details
router.get('/bugs/:id', getBugAdmin);

// PUT update any bug (admin can update any field)
router.put('/bugs/:id', updateBugAdmin);

// DELETE bug (admin can delete any bug)
router.delete('/bugs/:id', deleteBugAdmin);

export default router;