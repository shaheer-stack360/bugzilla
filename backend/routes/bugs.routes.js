import express from 'express';
import authenticateJWT from '../middleware/authenticateJWT.js';
import checkPermission from '../middleware/checkPemission.js';
import Bug from '../models/bugs.model.js';
import User from '../models/users.model.js';

const router = express.Router();

// GET all bugs - requires bug:read permission
router.get('/', 
  authenticateJWT(), 
  checkPermission('bug:read'),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      console.log('🔍 Fetching bugs for user:', {
        id: jwtUser.id,
        role: jwtUser.role,
        permissions: jwtUser.permissions
      });
      
      // Find user in database
      const dbUser = await User.findById(jwtUser.id);
      if (!dbUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found in database'
        });
      }
      
      // Determine user role
      const isAdmin = jwtUser.role === 'Administrator';
      const isManager = jwtUser.role === 'Manager';
      
      let query = {};
      
      if (isAdmin || isManager) {
        console.log('👔 Admin/Manager - Showing ALL bugs');
      } else {
        // Developers and QA can only see bugs they reported or are assigned to
        query = {
          $or: [
            { reported_by: dbUser._id },
            { assigned_to: dbUser._id }
          ]
        };
        console.log('👤 Developer/QA - Filtered query:', query);
      }
      
      const bugs = await Bug.find(query)
        .populate('reported_by', 'name email')
        .populate('assigned_to', 'name email');
      
      res.json({
        success: true,
        user: {
          id: dbUser._id,
          email: dbUser.email,
          role: jwtUser.role,
          permissions: jwtUser.permissions || [],
          isAdmin: isAdmin,
          isManager: isManager,
          isDeveloper: jwtUser.role === 'Developer',
          isQA: jwtUser.role === 'QA'
        },
        bugs: bugs,
        count: bugs.length,
        accessLevel: isAdmin ? 'Administrator (Full access)' : 
                    isManager ? 'Manager (All bugs)' : 
                    'Developer/QA (Only assigned/reported bugs)'
      });
      
    } catch (error) {
      console.error('❌ Error fetching bugs:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
);

// GET single bug by ID - requires bug:read permission
router.get('/:id', 
  authenticateJWT(), 
  checkPermission('bug:read'),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      
      if (!jwtUser.id || jwtUser.id === 'undefined') {
        return res.status(400).json({
          success: false,
          message: 'Invalid token'
        });
      }
      
      const dbUser = await User.findById(jwtUser.id);
      if (!dbUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const bug = await Bug.findById(req.params.id)
        .populate('reported_by', 'name email')
        .populate('assigned_to', 'name email');
        
      if (!bug) {
        return res.status(404).json({
          success: false,
          message: 'Bug not found'
        });
      }
      
      // Check access permissions
      const isAdmin = jwtUser.role === 'Administrator';
      const isManager = jwtUser.role === 'Manager';
      const isReporter = bug.reported_by && bug.reported_by._id.toString() === dbUser._id.toString();
      const isAssigned = bug.assigned_to && bug.assigned_to._id.toString() === dbUser._id.toString();
      
      console.log('🔍 Bug access check:', {
        bugId: req.params.id,
        bugReporter: bug.reported_by?._id,
        bugAssignee: bug.assigned_to?._id,
        userId: dbUser._id,
        isAdmin: isAdmin,
        isManager: isManager,
        isReporter: isReporter,
        isAssigned: isAssigned,
        canView: isAdmin || isManager || isReporter || isAssigned
      });
      
      if (isAdmin || isManager || isReporter || isAssigned) {
        return res.json({
          success: true,
          bug: bug,
          access: {
            isAdmin: isAdmin,
            isManager: isManager,
            isReporter: isReporter,
            isAssigned: isAssigned,
            canEdit: isAdmin || isManager || isAssigned,
            canDelete: isAdmin || isManager,
            canAssign: isAdmin || isManager,
            canResolve: isAssigned && jwtUser.permissions.includes('bug:resolve'),
            canVerify: jwtUser.role === 'QA' && jwtUser.permissions.includes('bug:verify')
          }
        });
      } else {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this bug',
          hint: 'You must be Admin, Manager, the reporter, or assigned to this bug'
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching bug:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
);

// POST create new bug - requires bug:create permission (QA only)
router.post('/create', 
  authenticateJWT(), 
  checkPermission('bug:create'),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      const dbUser = await User.findById(jwtUser.id);
      
      if (!dbUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Only QA can create bugs (except Admins)
      if (jwtUser.role !== 'QA' && jwtUser.role !== 'Administrator') {
        return res.status(403).json({
          success: false,
          message: 'Only QA can report new bugs'
        });
      }
      
      const bugData = {
        ...req.body,
        reported_by: dbUser._id,
        status: 'Open',
        priority: req.body.priority || 'Medium'
      };
      
      const bug = await Bug.create(bugData);
      
      res.status(201).json({
        success: true,
        message: 'Bug reported successfully',
        bug: bug
      });
      
    } catch (error) {
      console.error('❌ Error creating bug:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
);

// PUT update bug - requires bug:update permission
router.put('/:id', 
  authenticateJWT(), 
  checkPermission('bug:update'),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      const dbUser = await User.findById(jwtUser.id);
      
      if (!dbUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const bug = await Bug.findById(req.params.id);
      if (!bug) {
        return res.status(404).json({
          success: false,
          message: 'Bug not found'
        });
      }
      
      // Authorization check based on role
      const isAdmin = jwtUser.role === 'Administrator';
      const isManager = jwtUser.role === 'Manager';
      const isAssigned = bug.assigned_to && bug.assigned_to.toString() === dbUser._id.toString();
      const isReporter = bug.reported_by && bug.reported_by.toString() === dbUser._id.toString();
      
      // Who can update what:
      if (isAdmin || isManager) {
        // Admin/Manager can update anything
      } else if (isAssigned && jwtUser.role === 'Developer') {
        // Developer can update bugs assigned to them
        // Limit what developers can update (only status and comments)
        const { status, attachments } = req.body;
        req.body = { status, attachments };
      } else if (isReporter && jwtUser.role === 'QA') {
        // QA can update bugs they reported
        // Limit what QA can update (basic info)
        const { title, description, expected_behavior, actual_behavior, attachments } = req.body;
        req.body = { title, description, expected_behavior, actual_behavior, attachments };
      } else {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this bug'
        });
      }
      
      // Update bug
      const updatedBug = await Bug.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      
      res.json({
        success: true,
        message: 'Bug updated successfully',
        bug: updatedBug
      });
      
    } catch (error) {
      console.error('❌ Error updating bug:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
);

// PATCH resolve bug - requires bug:resolve permission (Developer only)
router.patch('/:id/resolve', 
  authenticateJWT(), 
  checkPermission('bug:resolve'),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      const dbUser = await User.findById(jwtUser.id);
      
      if (!dbUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const bug = await Bug.findById(req.params.id);
      if (!bug) {
        return res.status(404).json({
          success: false,
          message: 'Bug not found'
        });
      }
      
      // Only assigned Developer can resolve (or Admin)
      const isAssigned = bug.assigned_to && bug.assigned_to.toString() === dbUser._id.toString();
      
      if (!isAssigned && jwtUser.role !== 'Administrator') {
        return res.status(403).json({
          success: false,
          message: 'Only assigned Developer can resolve this bug'
        });
      }
      
      // Update bug status to Resolved
      const updatedBug = await Bug.findByIdAndUpdate(
        req.params.id,
        { status: 'Resolved' },
        { new: true }
      );
      
      res.json({
        success: true,
        message: 'Bug marked as resolved',
        bug: updatedBug
      });
      
    } catch (error) {
      console.error('❌ Error resolving bug:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
);

// PATCH verify bug - requires bug:verify permission (QA only)
router.patch('/:id/verify', 
  authenticateJWT(), 
  checkPermission('bug:verify'),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      const dbUser = await User.findById(jwtUser.id);
      
      if (!dbUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Only QA can verify bugs (or Admin)
      if (jwtUser.role !== 'QA' && jwtUser.role !== 'Administrator') {
        return res.status(403).json({
          success: false,
          message: 'Only QA can verify bugs'
        });
      }
      
      const bug = await Bug.findById(req.params.id);
      if (!bug) {
        return res.status(404).json({
          success: false,
          message: 'Bug not found'
        });
      }
      
      if (bug.status !== 'Resolved') {
        return res.status(400).json({
          success: false,
          message: 'Bug must be in Resolved status before verification'
        });
      }
      
      const { verified } = req.body;
      
      let updateData;
      if (verified) {
        updateData = { status: 'Closed' };
      } else {
        updateData = { status: 'Reopened' };
      }
      
      const updatedBug = await Bug.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
      
      res.json({
        success: true,
        message: verified ? 'Bug verified and closed' : 'Bug verification failed, reopened',
        bug: updatedBug
      });
      
    } catch (error) {
      console.error('❌ Error verifying bug:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
);

// PUT assign bug - requires bug:assign permission (Manager/Admin only)
router.put('/:id/assign', 
  authenticateJWT(), 
  checkPermission('bug:assign'),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      const { assigned_to, priority } = req.body;
      
      // Only Managers and Admins can assign bugs
      if (jwtUser.role !== 'Manager' && jwtUser.role !== 'Administrator') {
        return res.status(403).json({
          success: false,
          message: 'Only Managers and Administrators can assign bugs'
        });
      }
      
      if (!assigned_to) {
        return res.status(400).json({
          success: false,
          message: 'User ID to assign is required'
        });
      }
      
      // Check if assigned user exists and is a Developer
      const assignedUser = await User.findById(assigned_to).populate('role');
      if (!assignedUser || assignedUser.role?.name !== 'Developer') {
        return res.status(400).json({
          success: false,
          message: 'Assigned user must be a Developer'
        });
      }
      
      const updateData = {
        assigned_to,
        status: 'Assigned'
      };
      
      // Allow priority updates
      if (priority) updateData.priority = priority;
      
      const bug = await Bug.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
      
      if (!bug) {
        return res.status(404).json({
          success: false,
          message: 'Bug not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Bug assigned successfully',
        bug: bug,
        assignedTo: {
          id: assignedUser._id,
          name: assignedUser.name,
          email: assignedUser.email
        }
      });
      
    } catch (error) {
      console.error('❌ Error assigning bug:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
);

// DELETE bug - requires bug:delete permission (Manager/Admin only)
router.delete('/:id', 
  authenticateJWT(), 
  checkPermission('bug:delete'),
  async (req, res) => {
    try {
      const jwtUser = req.user;
      
      // Only Managers and Admins can delete bugs
      if (jwtUser.role !== 'Manager' && jwtUser.role !== 'Administrator') {
        return res.status(403).json({
          success: false,
          message: 'Only Managers and Administrators can delete bugs'
        });
      }
      
      const bug = await Bug.findByIdAndDelete(req.params.id);
      
      if (!bug) {
        return res.status(404).json({
          success: false,
          message: 'Bug not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Bug deleted successfully'
      });
      
    } catch (error) {
      console.error('❌ Error deleting bug:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
);

export default router;