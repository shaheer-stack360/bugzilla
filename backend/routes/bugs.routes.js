import express from 'express';
import authenticateJWT from '../middleware/authenticateJWT.js';
import authorize from '../middleware/authorize.js';
import { Actions, Subjects } from '../utils/ability.js';
import { getBugById } from '../utils/helper_func_users_bugs.js';
import {
  getAllBugs,
  getBug,
  createBug,
  updateBug,
  assignBug,
  deleteBug
} from '../controllers/bugs.controller.js';

const router = express.Router();

// GET all bugs
router.get('/',
  authenticateJWT(),
  authorize(Actions.Read, Subjects.Bug),
  getAllBugs
);

// GET single bug
router.get('/:id',
  authenticateJWT(),
  authorize(Actions.Read, Subjects.Bug, async (req) => 
    getBugById(req.params.id, { populateReporter: false, populateAssignee: false })
  ), getBug );

// POST create bug
router.post('/create',
  authenticateJWT(),
  authorize(Actions.Create, Subjects.Bug),
  createBug
);

// PUT update bug
router.put('/:id',
  authenticateJWT(),
  authorize(Actions.Update, Subjects.Bug, async (req) => 
    getBugById(req.params.id, { populateReporter: false, populateAssignee: false })
  ),
  updateBug
);

// PUT assign bug
router.put('/:id/assign',
  authenticateJWT(),
  authorize(Actions.Assign, Subjects.Bug, async (req) => 
    getBugById(req.params.id, { populateReporter: false, populateAssignee: false })
  ),
  assignBug
);

// DELETE bug
router.delete('/:id',
  authenticateJWT(),
  authorize(Actions.Delete, Subjects.Bug, async (req) => 
    getBugById(req.params.id, { populateReporter: false, populateAssignee: false })
  ),
  deleteBug
);

export default router;