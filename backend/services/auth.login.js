import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { setAuthCookies } from '../utils/cookies.js';
import User from '../models/users.model.js';
import RolePermission from '../models/rolePermission.model.js';
import { defineAbilityFor } from '../utils/ability.js';

export async function loginUser(credentials, res) {
  try {
    const { email, password } = credentials;

    if (!email || !password) {
      return { success: false, statusCode: 400, message: 'Email and password required' };
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('role');

    if (!user) {
      return { success: false, statusCode: 401, message: 'Invalid credentials' };
    }

    if (user.isActive === false) {
      return { success: false, statusCode: 403, message: 'Account is deactivated. Please contact administrator.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return { success: false, statusCode: 401, message: 'Invalid credentials' };
    }

    const permissionsData = await RolePermission.aggregate([
      { $match: { role: user.role._id } },
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

    const payload = {
      sub: user._id.toString(),
      role: user.role?.name,
      permissions,
      // ✅ Embed these so authenticateJWT never needs a DB query
      name: user.name,
      email: user.email,
      isActive: user.isActive
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role?.name,
      permissions
    };

    const ability = defineAbilityFor(userData, permissions);
    const abilityRules = ability.rules;

    setAuthCookies(res, token, userData);

    return { success: true, statusCode: 200, message: 'Login successful!', data: userData, abilityRules };

  } catch (error) {
    console.error('Login error:', error);
    return { success: false, statusCode: 500, message: 'Login failed', error: error.message };
  }
}