import { Actions, Subjects } from '../utils/ability.js';
import Bug from '../models/bugs.model.js';
import User from '../models/users.model.js';

/**
 * Filter allowed fields using CASL field-level permissions
 */
export function filterAllowedFields(ability, userRole, body, bug) {
  const allowedFields = {};
  const fieldsToCheck = Object.keys(body);

  if (userRole === 'Administrator') {
    return { ...body };
  }

  for (const field of fieldsToCheck) {
    if (ability.can(Actions.Update, Subjects.Bug, field, bug)) {
      allowedFields[field] = body[field];
    }
  }

  return allowedFields;
}

/**
 * Check if fields are empty
 */
export function hasAllowedFields(allowedFields) {
  return Object.keys(allowedFields).length > 0;
}

/**
 * Get user role flags
 */
export function getUserRoleFlags(role) {
  return {
    isAdmin: role === 'Administrator',
    isManager: role === 'Manager',
    isQA: role === 'QA',
    isDeveloper: role === 'Developer'
  };
}

/**
 * Get bug relationship flags
 */
export function getBugRelationshipFlags(bug, dbUser) {
  const isReporter = bug.reported_by && bug.reported_by._id.toString() === dbUser._id.toString();
  const isAssigned = bug.assigned_to && bug.assigned_to._id.toString() === dbUser._id.toString();
  return { isReporter, isAssigned };
}

/**
 * Get UI permission flags for a bug
 */
export function getUIPermissionFlags(ability, bug) {
  return {
    canEdit: ability.can(Actions.Update, Subjects.Bug),
    canDelete: ability.can(Actions.Delete, Subjects.Bug),
    canAssign: ability.can(Actions.Assign, Subjects.Bug),
    canResolve: ability.can(Actions.Resolve, Subjects.Bug),
    canOpen: ability.can('open', Subjects.Bug),
    canClose: ability.can('close', Subjects.Bug),
    canReopen: ability.can('reopen', Subjects.Bug),
  };
}

/**
 * Validate and get assigned user
 */
export async function validateAndGetAssignedUser(assigned_to) {
  if (!assigned_to) throw new Error('User ID to assign is required');

  const assignedUser = await User.findById(assigned_to).populate('role');
  if (!assignedUser || assignedUser.role?.name !== 'Developer') {
    throw new Error('Assigned user must be a Developer');
  }

  return assignedUser;
}

/**
 * Build bug query based on user role
 */
export function buildBugQuery(dbUser, userRole) {
  if (userRole === 'Developer') {
    return { $or: [{ reported_by: dbUser._id }, { assigned_to: dbUser._id }] };
  }
  return {}; // Managers/Admins can see all
}

/**
 * Create assignment update data with permission checks
 */
export function createAssignmentUpdateData(body, ability, bug) {
  const { assigned_to, priority } = body;
  const updateData = { assigned_to, status: 'Assigned' };
  if (priority !== undefined && ability.can(Actions.Update, Subjects.Bug, 'priority', bug)) {
    updateData.priority = priority;
  }
  return updateData;
}
