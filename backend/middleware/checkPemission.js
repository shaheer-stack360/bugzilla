import { Actions, Subjects } from '../common/ability.js';

function mapPermissionString(permission) {
  // expected format: resource:action e.g. 'bug:read'
  if (!permission || typeof permission !== 'string') return null;
  const parts = permission.split(':');
  if (parts.length !== 2) return null;
  const [resourceRaw, actionRaw] = parts;
  const resource = resourceRaw.toLowerCase();
  const action = actionRaw.toLowerCase();

  // map resource to Subjects
  let subject = null;
  if (resource === 'bug' || resource === 'bugs') subject = Subjects.Bug;
  if (resource === 'user' || resource === 'users') subject = Subjects.User;
  if (!subject) subject = Subjects.All;

  // map action to Actions (fallback to raw)
  const actionMap = Object.values(Actions).includes(action) ? action : action;

  return { action: actionMap, subject };
}

export default function checkPermission(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const ability = req.ability;
    if (!ability) {
      return res.status(500).json({ success: false, message: 'Authorization not initialized' });
    }

    const mapped = mapPermissionString(requiredPermission);
    if (!mapped) {
      return res.status(400).json({ success: false, message: 'Invalid permission format' });
    }

    const canDo = ability.can(mapped.action, mapped.subject);
    if (canDo) return next();

    return res.status(403).json({ success: false, message: 'Insufficient permissions', requiredPermission });
  };
}