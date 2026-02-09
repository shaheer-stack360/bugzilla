import jwt from 'jsonwebtoken';
import User from '../models/users.model.js';
import Role from '../models/roles.model.js';
import { defineAbilityFor } from '../utils/ability.js';

export default function authenticateJWT() {
  return async (req, res, next) => {
    const cookieToken = req.cookies?.token;
    const headerToken = req.headers?.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null;
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ message: 'Missing token' });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user and populate role properly
      const user = await User.findById(payload.sub)
        .populate('role', 'name');  // Only populate 'name' field from Role
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      if (user.isActive === false) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      // If populate worked, user.role should be { _id: ..., name: 'Administrator' }
      // If not, fetch role separately
      let roleName = '';
      if (user.role && user.role.name) {
        roleName = user.role.name;
      } else if (user.role) {
        // Fallback: fetch role by ID
        const role = await Role.findById(user.role).select('name');
        roleName = role?.name || '';
      }

      // Get permissions (using the role ID)
      const RolePermission = (await import('../models/rolePermission.model.js')).default;
      const roleId = user.role._id || user.role;  // Could be ObjectId or populated object
      
      const permissionsData = await RolePermission.aggregate([
        { $match: { role: roleId } },
        {
          $lookup: {
            from: 'permissions',
            localField: 'permission',
            foreignField: '_id',
            as: 'permissionDoc'
          }
        },
        { $unwind: '$permissionDoc' },
        { $project: { permissionName: '$permissionDoc.name' } }
      ]);

      const permissions = permissionsData.map(p => p.permissionName);
      
      req.user = { 
        id: user._id.toString(), 
        role: roleName,  // Should be "Administrator" now
        permissions: permissions || [] 
      };
      
      req.ability = defineAbilityFor(req.user, req.user.permissions);
      
      next();
    } catch (err) {
      console.error('JWT Error:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}