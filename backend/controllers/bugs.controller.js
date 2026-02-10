import Bug from '../models/bugs.model.js';
import {
  filterAllowedFields,
  getUserRoleFlags,
  getBugRelationshipFlags,
  getUIPermissionFlags,
  validateAndGetAssignedUser,
  buildBugQuery,
  createAssignmentUpdateData,
  hasAllowedFields
} from '../utils/helper_func_users_bugs.js';

/**
 * GET all bugs — no $lookup, uses denormalized name fields
 */
export const getAllBugs = async (req, res) => {
  try {
    const dbUser = req.dbUser;
    const userRole = req.user.role;

    const query = buildBugQuery(dbUser, userRole);

    const bugs = await Bug.find(query)
      .select('_id title description status priority reported_by reported_by_name assigned_to assigned_to_name createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

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
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET single bug — still populates full user objects for detail view
 */
export const getBug = async (req, res) => {
  try {
    const bug = req.bug;
    const dbUser = req.dbUser;

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
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * CREATE bug — saves reporter name at creation time
 */
export const createBug = async (req, res) => {
  try {
    const dbUser = req.dbUser;

    const bugData = {
      ...req.body,
      reported_by: dbUser._id,
      reported_by_name: dbUser.name || '',   // ✅ store once, never join again
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
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * UPDATE bug
 */
export const updateBug = async (req, res) => {
  try {
    const bug = req.bug;

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
      bug._id,
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
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ASSIGN bug — saves assignee name at assign time
 */
export const assignBug = async (req, res) => {
  try {
    const bug = req.bug;

    const assignedUser = await validateAndGetAssignedUser(req.body.assigned_to);
    const updateData = createAssignmentUpdateData(req.body, req.ability, bug);

    // ✅ store assignee name so getAll never needs to join
    updateData.assigned_to_name = assignedUser.name || '';

    const updatedBug = await Bug.findByIdAndUpdate(
      bug._id,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Bug assigned successfully',
      bug: updatedBug,
      assignedTo: {
        id: assignedUser._id,
        name: assignedUser.name,
        email: assignedUser.email
      }
    });
  } catch (error) {
    console.error(error);

    const statusCode =
      error.message.includes('required') ||
      error.message.includes('must be a Developer')
        ? 400
        : 500;

    res.status(statusCode).json({ success: false, error: error.message });
  }
};

/**
 * DELETE bug
 */
export const deleteBug = async (req, res) => {
  try {
    await Bug.findByIdAndDelete(req.bug._id);
    res.json({ success: true, message: 'Bug deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};