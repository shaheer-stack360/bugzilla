import { createMongoAbility } from '@casl/ability';

// Define actions and subjects matching backend
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

// Create ability from rules received from backend
export const createAbility = (rules = []) => {
  return createMongoAbility(rules);
};

// Get ability from session storage
export const getAbility = () => {
  const rules = sessionStorage.getItem('ability');
  return rules ? createAbility(JSON.parse(rules)) : createAbility();
};

// Store ability rules
export const setAbility = (rules) => {
  sessionStorage.setItem('ability', JSON.stringify(rules));
};

export const clearAbility = () => {
  sessionStorage.removeItem('ability');
};