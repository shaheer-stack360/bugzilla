// routes/bugs.js
import express from 'express';
import authenticateJWT from '../middleware/authenticateJWT.js';
import Bug from '../models/bugs.model.js';
import User from '../models/users.model.js';

const router = express.Router();

router.get('/', authenticateJWT(), async (req, res) => {
  try {
    const jwtUser = req.user;
    console.log('🔍 JWT User data:', {
      id: jwtUser.id,
      roles: jwtUser.roles,
      isAdmin: jwtUser.roles?.includes('role_admin'),
      isManager: jwtUser.roles?.includes('role_manager')
    });
    
    
    // Find user in database
    const dbUser = await User.findById(jwtUser.id);
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }
    console.log("jwt roles: ", jwtUser.roles);
    
    // Determine user role
    const isAdmin = jwtUser.roles?.includes('Administrator') || jwtUser.roles?.includes('role_admin');
    const isManager = jwtUser.roles?.includes('Manager') || jwtUser.roles?.includes('role_manager');
    
    console.log('✅ Role check:', {
      isAdmin: isAdmin,
      isManager: isManager,
      userId: dbUser._id
    });
    
    let query = {};
    
    if (isAdmin || isManager) {
      console.log('👔 Admin/Manager - Showing ALL bugs');
    } else {
      query = {
        $or: [
          { reported_by: dbUser._id },
          { assigned_to: dbUser._id }
        ]
      };
      console.log('👤 Regular user - Filtered query:', query);
    }
    
    const bugs = await Bug.find(query);
    
    res.json({
      success: true,
      user: {
        id: dbUser._id,
        email: dbUser.email,
        roles: jwtUser.roles,
        isAdmin: isAdmin,
        isManager: isManager,
        isRegularUser: !isAdmin && !isManager
      },
      bugs: bugs,
      count: bugs.length,
      accessLevel: isAdmin ? 'Admin (All bugs)' : 
                  isManager ? 'Manager (All bugs)' : 
                  'Regular (Only assigned/reported bugs)'
    });
    
  } catch (error) {
    console.error('❌ Error fetching bugs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/:id', authenticateJWT(), async (req, res) => {
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
    
    const bug = await Bug.findById(req.params.id);
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }
    
    // Check access permissions
    const isAdmin = jwtUser.roles?.includes('role_admin');
    const isManager = jwtUser.roles?.includes('role_manager');
    const isReporter = bug.reported_by === dbUser._id;
    const isAssigned = bug.assigned_to === dbUser._id;
    
    console.log('🔍 Bug access check:', {
      bugId: req.params.id,
      bugReporter: bug.reported_by,
      bugAssignee: bug.assigned_to,
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
          canDelete: isAdmin
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
});


router.get('/my/bugs', authenticateJWT(), async (req, res) => {
  try {
    const dbUser = await User.findById(req.user.id);
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const bugs = await Bug.find({
      $or: [
        { reported_by: dbUser._id },
        { assigned_to: dbUser._id }
      ]
    });
    
    res.json({
      success: true,
      bugs: bugs,
      count: bugs.length,
      message: 'Your bugs (reported or assigned)'
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/my/reported', authenticateJWT(), async (req, res) => {
  try {
    const dbUser = await User.findById(req.user.id);
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const bugs = await Bug.find({ reported_by: dbUser._id });
    
    res.json({
      success: true,
      bugs: bugs,
      count: bugs.length,
      message: 'Bugs you reported'
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/my/assigned', authenticateJWT(), async (req, res) => {
  try {
    const dbUser = await User.findById(req.user.id);
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const bugs = await Bug.find({ assigned_to: dbUser._id });
    
    res.json({
      success: true,
      bugs: bugs,
      count: bugs.length,
      message: 'Bugs assigned to you'
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;