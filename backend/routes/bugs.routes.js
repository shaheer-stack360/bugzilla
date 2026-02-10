import express from 'express';
import authenticateJWT from '../middleware/authenticateJWT.js';
import authorize from '../middleware/authorize.js';
import { Actions, Subjects } from '../utils/ability.js';
import { loadBug } from '../middleware/loadBug.js';
import { getDevelopers } from '../controllers/user.controller.js';
import {
  getAllBugs,
  getBug,
  createBug,
  updateBug,
  assignBug,
  deleteBug
} from '../controllers/bugs.controller.js';

const router = express.Router();

// GET developers list — used for assign dropdown, any authenticated user
router.get('/developers',
  authenticateJWT(),
  getDevelopers
);

// GET all bugs
router.get('/',
  authenticateJWT(),
  authorize(Actions.Read, Subjects.Bug),
  getAllBugs
);

// GET single bug
router.get('/:id',
  authenticateJWT(),
  loadBug,
  authorize(Actions.Read, Subjects.Bug),
  getBug
);

// POST create bug
router.post('/create',
  authenticateJWT(),
  authorize(Actions.Create, Subjects.Bug),
  createBug
);

// PUT update bug
router.put('/:id',
  authenticateJWT(),
  loadBug,
  authorize(Actions.Update, Subjects.Bug),
  updateBug
);

// PUT assign bug
router.put('/:id/assign',
  authenticateJWT(),
  loadBug,
  authorize(Actions.Assign, Subjects.Bug),
  assignBug
);

// DELETE bug
router.delete('/:id',
  authenticateJWT(),
  loadBug,
  authorize(Actions.Delete, Subjects.Bug),
  deleteBug
);

export default router;