import { AbilityBuilder, createMongoAbility } from '@casl/ability';


export const Actions = {
  Manage: 'manage',
  Create: 'create',
  Read: 'read',
  Update: 'update',
  Delete: 'delete',
  Resolve: 'resolve',
  Verify: 'verify',
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
  // Permissions from DB come as strings like 'bug:read', 'bug:create', 'bug:update', 'bug:delete', 'bug:resolve', 'bug:verify'
  const permSet = new Set(permissions || []);

  // ADMINISTRATOR: Can do anything (no need to check permissions)
  if (role === 'Administrator') {
    can(Actions.Manage, Subjects.All);
    return build();
  }

  // Apply permissions from database
  // For each permission string, parse it and apply the corresponding ability

  // Bug: Read
  if (permSet.has('bug:read')) {
    can(Actions.Read, Subjects.Bug);
  }

  // Bug: Create
  if (permSet.has('bug:create')) {
    can(Actions.Create, Subjects.Bug);
  }

  // Bug: Update
  if (permSet.has('bug:update')) {
    can(Actions.Update, Subjects.Bug);
  }

  // Bug: Delete
  if (permSet.has('bug:delete')) {
    can(Actions.Delete, Subjects.Bug);
  }

  // Bug: Resolve
  if (permSet.has('bug:resolve')) {
    can(Actions.Resolve, Subjects.Bug);
  }

  // Bug: Verify
  if (permSet.has('bug:verify')) {
    can(Actions.Verify, Subjects.Bug);
  }

  // Bug: Assign
  if (permSet.has('bug:assign')) {
    can(Actions.Assign, Subjects.Bug);
  }

  // User: Read
  if (permSet.has('user:read')) {
    can(Actions.Read, Subjects.User);
  }

  // User: Update
  if (permSet.has('user:update')) {
    can(Actions.Update, Subjects.User);
  }

  // User: Delete
  if (permSet.has('user:delete')) {
    can(Actions.Delete, Subjects.User);
  }

  // Role-specific restrictions for Developer and Manager (field-level control still applied in routes)
  if (role === 'Developer') {
    // Developer can only read bugs they reported or are assigned to
    if (permSet.has('bug:read')) {
      cannot(Actions.Read, Subjects.Bug);
      can(Actions.Read, Subjects.Bug, (bug) => {
        const isBugReporter = bug.reported_by && bug.reported_by.toString() === id.toString();
        const isBugAssignee = bug.assigned_to && bug.assigned_to.toString() === id.toString();
        return isBugReporter || isBugAssignee;
      });
    }

    // Developer can only resolve bugs assigned to them
    if (permSet.has('bug:resolve')) {
      cannot(Actions.Resolve, Subjects.Bug);
      can(Actions.Resolve, Subjects.Bug, (bug) => {
        return bug.assigned_to && bug.assigned_to.toString() === id.toString();
      });
    }
  }

  return build();
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
