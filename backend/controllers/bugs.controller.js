import Bug from '../models/bugs.model.js';
import { 
  getAuthenticatedUser, 
  getBugById,
  filterAllowedFields,
  getUserRoleFlags,
  getBugRelationshipFlags,
  getUIPermissionFlags,
  validateAndGetAssignedUser,
  buildBugQuery,
  createAssignmentUpdateData,
  hasAllowedFields
} from '../utils/helper_func_users_bugs.js';

// Get all bugs
export const getAllBugs = async (req, res) => {
  try {
    const dbUser = await getAuthenticatedUser(req.user);
    const userRole = req.user.role;
    
    const query = buildBugQuery(dbUser, userRole);
    const bugs = await Bug.find(query)
      .populate('reported_by', 'name email')
      .populate('assigned_to', 'name email');

    res.json({
      success: true,
      user: { 
        id: dbUser._id, 
        email: dbUser.email, 
        role: userRole,
        ...getUserRoleFlags(userRole)
      },
      bugs,
      count: bugs.length
    });
  } catch (error) {
    console.error(error);
    res.status(error.message === 'User not found' ? 404 : 500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get single bug
export const getBug = async (req, res) => {
  try {
    const dbUser = await getAuthenticatedUser(req.user);
    const bug = await getBugById(req.params.id);

    const { isReporter, isAssigned } = getBugRelationshipFlags(bug, dbUser);
    const roleFlags = getUserRoleFlags(req.user.role);
    const uiPermissions = getUIPermissionFlags(req.ability, bug);

    res.json({
      success: true,
      bug,
      access: {
        ...roleFlags,
        isReporter,
        isAssigned,
        ...uiPermissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(error.message === 'User not found' || error.message === 'Bug not found' ? 404 : 500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Create bug
export const createBug = async (req, res) => {
  try {
    const dbUser = await getAuthenticatedUser(req.user);
    
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
      bug 
    });
  } catch (error) {
    console.error(error);
    res.status(error.message === 'User not found' ? 404 : 500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Update bug
export const updateBug = async (req, res) => {
  try {
    await getAuthenticatedUser(req.user);
    const bug = await getBugById(req.params.id, { 
      populateReporter: false, 
      populateAssignee: false 
    });

    const allowedFields = filterAllowedFields(
      req.ability,
      req.user.role,
      req.body,
      bug
    );

    if (!hasAllowedFields(allowedFields)) {
      return res.status(400).json({ 
        success: false, 
        message: 'No updatable fields provided or insufficient permissions' 
      });
    }

    const updatedBug = await Bug.findByIdAndUpdate(
      req.params.id, 
      allowedFields, 
      { new: true, runValidators: true }
    );
    
    res.json({ 
      success: true, 
      message: 'Bug updated successfully', 
      bug: updatedBug 
    });
  } catch (error) {
    console.error(error);
    res.status(error.message === 'User not found' || error.message === 'Bug not found' ? 404 : 500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Assign bug
export const assignBug = async (req, res) => {
  try {
    const bug = await getBugById(req.params.id, { 
      populateReporter: false, 
      populateAssignee: false 
    });

    const assignedUser = await validateAndGetAssignedUser(req.body.assigned_to);
    
    const updateData = createAssignmentUpdateData(req.body, req.ability, bug);
    
    const updated = await Bug.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    res.json({ 
      success: true, 
      message: 'Bug assigned successfully', 
      bug: updated, 
      assignedTo: { 
        id: assignedUser._id, 
        name: assignedUser.name, 
        email: assignedUser.email 
      } 
    });
  } catch (error) {
    console.error(error);
    const statusCode = error.message.includes('required') || error.message.includes('must be a Developer') 
      ? 400 
      : (error.message === 'Bug not found' ? 404 : 500);
    
    res.status(statusCode).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Delete bug
export const deleteBug = async (req, res) => {
  try {
    await getBugById(req.params.id, { 
      populateReporter: false, 
      populateAssignee: false 
    });
    
    const deleted = await Bug.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: 'Bug deleted successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(error.message === 'Bug not found' ? 404 : 500).json({ 
      success: false, 
      error: error.message 
    });
  }
};