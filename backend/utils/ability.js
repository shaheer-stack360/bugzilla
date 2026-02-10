import { AbilityBuilder, createMongoAbility, fieldPatternMatcher } from '@casl/ability';

export const Actions = {
  Manage: 'manage',
  Create: 'create',
  Read: 'read',
  Update: 'update',
  Delete: 'delete',
  Resolve: 'resolve',
  Assign: 'assign'
};

export const Subjects = {
  Bug: 'Bug',
  User: 'User',
  All: 'all'
};

/**
 * Build CASL ability based on user role and permissions from database
 * @param {Object} user - User object with id and role
 * @param {Array} permissions - Array of permission names from database (e.g., ['bug:read', 'bug:create'])
 * @returns {Ability} - CASL ability object
 */
export function defineAbilityFor(user, permissions = []) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // If user doesn't exist, deny everything
  if (!user) {
    return build();
  }

  const { role, id } = user;

  // Parse permission strings and apply rules
  const permSet = new Set(permissions || []);

  // ADMINISTRATOR: Can do anything (wildcard permissions)
  if (role === 'Administrator') {
    can(Actions.Manage, Subjects.All);
    return build({
      detectSubjectType: (subject) => {
        if (subject === 'Bug' || subject === 'User' || subject === 'all') return subject;
        if (subject && subject.title !== undefined) return 'Bug';
        if (subject && subject.email !== undefined) return 'User';
        return subject;
      },
      fieldMatcher: fieldPatternMatcher
    });
  }

  // ============ BUG PERMISSIONS ============

  // Bug: Read - All roles with this permission can read bugs
  if (permSet.has('bug:read')) {
    // Developer can only read bugs they reported or are assigned to
    if (role === 'Developer') {
      cannot(Actions.Read, Subjects.Bug);
      can(Actions.Read, Subjects.Bug, (bug) => {
        const isBugReporter = bug.reported_by && bug.reported_by.toString() === id.toString();
        const isBugAssignee = bug.assigned_to && bug.assigned_to.toString() === id.toString();
        return isBugReporter || isBugAssignee;
      });
    } else {
      // Manager, QA can read all bugs
      can(Actions.Read, Subjects.Bug);
    }
  }

  // Bug: Create - Only QA can create bugs
  if (permSet.has('bug:create')) {
    if (role === 'QA') {
      can(Actions.Create, Subjects.Bug);
    }
  }

  // Bug: Update - WITH FIELD-LEVEL PERMISSIONS
  if (permSet.has('bug:update')) {
    if (role === 'Manager') {
      // Manager can only update priority field
      can(Actions.Update, Subjects.Bug, ['priority']);
    } else if (role === 'Developer') {
      // Developer can only update status and attachments if assigned
      can(Actions.Update, Subjects.Bug, ['status', 'attachments'], {
        assigned_to: id
      });
    } else if (role === 'QA') {
      // QA can update ALL fields on bugs they reported
      can(Actions.Update, Subjects.Bug,
        [
          'title', 'description', 'expected_behavior', 'actual_behavior',
          'attachments', 'priority', 'status', 'assigned_to', 'reported_by',
          'created_at', 'updated_at'
        ]);

      // QA can also open, close, and reopen bugs
      can('open', Subjects.Bug);
      can('close', Subjects.Bug);
      can('reopen', Subjects.Bug);
    }
  }

  // Bug: Delete - Only Administrator and QA can delete bugs
  if (permSet.has('bug:delete')) {
    if (role === 'QA' || role === 'Administrator') {
      can(Actions.Delete, Subjects.Bug);
    }
  }

  // Bug: Resolve - Only Developer can resolve bugs (if assigned)
  if (permSet.has('bug:resolve')) {
    if (role === 'Developer') {
      cannot(Actions.Resolve, Subjects.Bug);
      can(Actions.Resolve, Subjects.Bug, (bug) => {
        return bug.assigned_to && bug.assigned_to.toString() === id.toString();
      });
    }
  }

  // Bug: Assign - Manager and QA can assign bugs
  if (permSet.has('bug:assign')) {
    if (role === 'Manager' || role === 'QA') {
      can(Actions.Assign, Subjects.Bug);
    }
  }

  // ============ USER PERMISSIONS ============

  // User: Read - All roles can read users (with restrictions)
  if (permSet.has('user:read')) {
    // Managers can read all users
    if (role === 'Manager') {
      can(Actions.Read, Subjects.User);
    }
    // Developer and QA can only read themselves
    else if (role === 'Developer' || role === 'QA') {
      cannot(Actions.Read, Subjects.User);
      can(Actions.Read, Subjects.User, { _id: id });
    }
  }

  // Note: No user:delete permission for Manager - only Administrator can delete users

  // Special actions for QA: open, close, reopen bugs
  if (role === 'QA') {
    if (permSet.has('bug:update')) {
      can('open', Subjects.Bug);
      can('close', Subjects.Bug);
      can('reopen', Subjects.Bug);
    }
  }

  return build({
    detectSubjectType: (subject) => {
      if (subject === 'Bug' || subject === 'User' || subject === 'all') return subject;
      if (subject && subject.title !== undefined) return 'Bug';
      if (subject && subject.email !== undefined) return 'User';
      return subject;
    },
    fieldMatcher: fieldPatternMatcher
  });
}

/**
 * Check if user can perform an action on a subject
 * @param {Ability} ability - CASL ability object
 * @param {String} action - Action to check (from Actions)
 * @param {String} subject - Subject type (from Subjects)
 * @param {Object} resource - The actual resource object (optional, for field-based rules)
 * @returns {Boolean} - Whether the user can perform the action
 */
export function can(ability, action, subject, resource) {
  return ability.can(action, subject, resource);
}

/**
 * Check if user cannot perform an action
 * @param {Ability} ability - CASL ability object
 * @param {String} action - Action to check (from Actions)
 * @param {String} subject - Subject type (from Subjects)
 * @param {Object} resource - The actual resource object (optional, for field-based rules)
 * @returns {Boolean} - Whether the user cannot perform the action
 */
export function cannot(ability, action, subject, resource) {
  return ability.cannot(action, subject, resource);
}