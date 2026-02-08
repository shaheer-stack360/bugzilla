import express from 'express';
import authenticateJWT from '../middleware/authenticateJWT.js';
import authorize from '../middleware/authorize.js';
import { Actions, Subjects } from '../common/ability.js';
import Bug from '../models/bugs.model.js';
import User from '../models/users.model.js';

const router = express.Router();

// GET all bugs
router.get('/',
  authenticateJWT(),
  authorize(Actions.Read, Subjects.Bug),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      const dbUser = await User.findById(jwtUser.id);
      if (!dbUser) return res.status(404).json({ success: false, message: 'User not found' });

      const isAdmin = jwtUser.role === 'Administrator';
      const isManager = jwtUser.role === 'Manager';

      let query = {};
      if (!isAdmin && !isManager) {
        query = { $or: [{ reported_by: dbUser._id }, { assigned_to: dbUser._id }] };
      }

      const bugs = await Bug.find(query)
        .populate('reported_by', 'name email')
        .populate('assigned_to', 'name email');

      res.json({
        success: true,
        user: { id: dbUser._id, email: dbUser.email, role: jwtUser.role, isAdmin, isManager },
        bugs,
        count: bugs.length
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// GET single bug
router.get('/:id',
  authenticateJWT(),
  authorize(Actions.Read, Subjects.Bug, async (req) => {
    return await Bug.findById(req.params.id);
  }),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      const dbUser = await User.findById(jwtUser.id);
      if (!dbUser) return res.status(404).json({ success: false, message: 'User not found' });

      const bug = await Bug.findById(req.params.id)
        .populate('reported_by', 'name email')
        .populate('assigned_to', 'name email');
      if (!bug) return res.status(404).json({ success: false, message: 'Bug not found' });

      const isAdmin = jwtUser.role === 'Administrator';
      const isManager = jwtUser.role === 'Manager';
      const isReporter = bug.reported_by && bug.reported_by._id.toString() === dbUser._id.toString();
      const isAssigned = bug.assigned_to && bug.assigned_to._id.toString() === dbUser._id.toString();

      if (!(isAdmin || isManager || isReporter || isAssigned)) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this bug' });
      }

      res.json({
        success: true,
        bug,
        access: {
          isAdmin, isManager, isReporter, isAssigned,
          canEdit: req.ability.can(Actions.Update, Subjects.Bug, bug),
          canDelete: req.ability.can(Actions.Delete, Subjects.Bug, bug),
          canAssign: req.ability.can(Actions.Assign, Subjects.Bug, bug),
          canResolve: req.ability.can(Actions.Resolve, Subjects.Bug, bug),
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// POST create bug
router.post('/create',
  authenticateJWT(),
  authorize(Actions.Create, Subjects.Bug),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      const dbUser = await User.findById(jwtUser.id);
      if (!dbUser) return res.status(404).json({ success: false, message: 'User not found' });

      if (!req.ability.can(Actions.Create, Subjects.Bug)) {
        return res.status(403).json({ success: false, message: 'Not authorized to create bugs' });
      }

      const bugData = { ...req.body, reported_by: dbUser._id, status: 'Open', priority: req.body.priority || 'Medium' };
      const bug = await Bug.create(bugData);

      res.status(201).json({ success: true, message: 'Bug reported successfully', bug });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// PUT update bug
router.put('/:id',
  authenticateJWT(),
  authorize(Actions.Update, Subjects.Bug, async (req) => {
    return await Bug.findById(req.params.id);
  }),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      const dbUser = await User.findById(jwtUser.id);
      if (!dbUser) return res.status(404).json({ success: false, message: 'User not found' });

      const bug = await Bug.findById(req.params.id);
      if (!bug) return res.status(404).json({ success: false, message: 'Bug not found' });

      if (!req.ability.can(Actions.Update, Subjects.Bug, bug)) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this bug' });
      }

      // Field limiting by role
      const isAssigned = bug.assigned_to && bug.assigned_to.toString() === dbUser._id.toString();
      const isReporter = bug.reported_by && bug.reported_by.toString() === dbUser._id.toString();

      if (jwtUser.role === 'Manager') {
        const { priority } = req.body;
        req.body = { priority };
      } else if (isAssigned && jwtUser.role === 'Developer') {
        const { status, attachments } = req.body;
        req.body = { status, attachments };
      } else if (isReporter && jwtUser.role === 'QA') {
        const { title, description, expected_behavior, actual_behavior, attachments } = req.body;
        req.body = { title, description, expected_behavior, actual_behavior, attachments };
      }

      const updatedBug = await Bug.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      res.json({ success: true, message: 'Bug updated successfully', bug: updatedBug });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// PATCH resolve bug
router.patch('/:id/resolve',
  authenticateJWT(),
  authorize(Actions.Resolve, Subjects.Bug, async (req) => {
    return await Bug.findById(req.params.id);
  }),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      const dbUser = await User.findById(jwtUser.id);
      if (!dbUser) return res.status(404).json({ success: false, message: 'User not found' });

      const bug = await Bug.findById(req.params.id);
      if (!bug) return res.status(404).json({ success: false, message: 'Bug not found' });

      if (!req.ability.can(Actions.Resolve, Subjects.Bug, bug)) {
        return res.status(403).json({ success: false, message: 'Not authorized to resolve this bug' });
      }

      const updatedBug = await Bug.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
      res.json({ success: true, message: 'Bug marked as resolved', bug: updatedBug });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);


// PUT assign bug
router.put('/:id/assign',
  authenticateJWT(),
  authorize(Actions.Assign, Subjects.Bug, async (req) => {
    return await Bug.findById(req.params.id);
  }),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      const { assigned_to, priority } = req.body;

      const bug = await Bug.findById(req.params.id);
      if (!bug) return res.status(404).json({ success: false, message: 'Bug not found' });

      if (!req.ability.can(Actions.Assign, Subjects.Bug, bug)) {
        return res.status(403).json({ success: false, message: 'Not authorized to assign bugs' });
      }

      if (!assigned_to) return res.status(400).json({ success: false, message: 'User ID to assign is required' });

      const assignedUser = await User.findById(assigned_to).populate('role');
      if (!assignedUser || assignedUser.role?.name !== 'Developer') {
        return res.status(400).json({ success: false, message: 'Assigned user must be a Developer' });
      }

      const updateData = { assigned_to, status: 'Assigned' };
      if (priority) updateData.priority = priority;

      const updated = await Bug.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Bug not found' });

      res.json({ success: true, message: 'Bug assigned successfully', bug: updated, assignedTo: { id: assignedUser._id, name: assignedUser.name, email: assignedUser.email } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// DELETE bug
router.delete('/:id',
  authenticateJWT(),
  authorize(Actions.Delete, Subjects.Bug, async (req) => {
    return await Bug.findById(req.params.id);
  }),
  async (req, res) => {
    try {
      const jwtUser = req.user;

      const bug = await Bug.findById(req.params.id);
      if (!bug) return res.status(404).json({ success: false, message: 'Bug not found' });

      if (!req.ability.can(Actions.Delete, Subjects.Bug, bug)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete bugs' });
      }

      const deleted = await Bug.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Bug not found' });

      res.json({ success: true, message: 'Bug deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
