import { Actions, Subjects } from '../common/ability.js';

function mapPermissionString(permission) {
  if (!permission || typeof permission !== 'string') return null;
  const parts = permission.split(':');
  if (parts.length !== 2) return null;
  const [resourceRaw, actionRaw] = parts;
  const resource = resourceRaw.toLowerCase();
  const action = actionRaw.toLowerCase();
  let subject = null;
  if (resource === 'bug' || resource === 'bugs') subject = Subjects.Bug;
  if (resource === 'user' || resource === 'users') subject = Subjects.User;
  if (!subject) subject = Subjects.All;
  const actionMap = Object.values(Actions).includes(action) ? action : action;
  return { action: actionMap, subject };
}

export default function permit(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const ability = req.ability;
    if (!ability) return res.status(500).json({ message: 'Authorization not initialized' });

    const ok = requiredPermissions.every(p => {
      const m = mapPermissionString(p);
      if (!m) return false;
      return ability.can(m.action, m.subject);
    });

    if (!ok) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}