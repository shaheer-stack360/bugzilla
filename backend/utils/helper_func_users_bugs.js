// /helpers/bugHelpers.js
import { Actions, Subjects } from '../utils/ability.js';
import Bug from '../models/bugs.model.js';
import User from '../models/users.model.js';

/**
 * Get authenticated user from database
 */
export async function getAuthenticatedUser(jwtUser) {
  const dbUser = await User.findById(jwtUser.id);
  if (!dbUser) throw new Error('User not found');
  return dbUser;
}

/**
 * Get bug by ID with population
 * @param {string} bugId - The bug ID
 * @param {Object} options - Options for population
 * @param {boolean} [options.populateReporter=true] - Whether to populate reporter
 * @param {boolean} [options.populateAssignee=true] - Whether to populate assignee
 */
export async function getBugById(bugId, options = {}) {
  const { 
    populateReporter = true, 
    populateAssignee = true 
  } = options;
  
  const query = Bug.findById(bugId);
  
  if (populateReporter) {
    query.populate('reported_by', 'name email');
  }
  
  if (populateAssignee) {
    query.populate('assigned_to', 'name email');
  }
  
  const bug = await query;
  if (!bug) throw new Error('Bug not found');
  return bug;
}

/**
 * Filter allowed fields using CASL field-level permissions
 */
export function filterAllowedFields(ability, userRole, body, bug) {
  const allowedFields = {};
  const fieldsToCheck = Object.keys(body);
  
  // Administrator can update everything (manage:all)
  if (userRole === 'Administrator') {
    return { ...body };
  }
  
  // For non-admins, check each field individually using CASL
  for (const field of fieldsToCheck) {
    // FIXED: Field is the 4th parameter, not 3rd!
    if (ability.can(Actions.Update, Subjects.Bug, bug, field)) {
      allowedFields[field] = body[field];
    }
  }
  
  return allowedFields;
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
    // For GENERAL permission checks (no field), just use subject type
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
  if (!assigned_to) {
    throw new Error('User ID to assign is required');
  }
  
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
  let query = {};
  
  // Developer can only see bugs they're involved with
  if (userRole === 'Developer') {
    query = { $or: [{ reported_by: dbUser._id }, { assigned_to: dbUser._id }] };
  }
  
  return query;
}

/**
 * Create assignment update data with permission checks
 */
export function createAssignmentUpdateData(body, ability, bug) {
  const { assigned_to, priority } = body;
  const updateData = { assigned_to, status: 'Assigned' };
  
  // FIXED: Field is the 4th parameter!
  if (priority !== undefined && ability.can(Actions.Update, Subjects.Bug, bug, 'priority')) {
    updateData.priority = priority;
  }
  
  return updateData;
}

/**
 * Check if fields are empty
 */
export function hasAllowedFields(allowedFields) {
  return Object.keys(allowedFields).length > 0;
}