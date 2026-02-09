import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { setAuthCookies } from '../utils/cookies.js';
import User from '../models/users.model.js';
import RolePermission from '../models/rolePermission.model.js';

/**
 * Login user with email and password
 * @param {Object} credentials - { email, password }
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} - { success, message, data?, statusCode }
 */
export async function loginUser(credentials, res) {
  try {
    const { email, password } = credentials;

    if (!email || !password) {
      return {
        success: false,
        statusCode: 400,
        message: 'Email and password required'
      };
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('role');

    if (!user) {
      return {
        success: false,
        statusCode: 401,
        message: 'Invalid credentials'
      };
    }

        // ✅ ADD THIS CHECK: Verify user is active
    if (user.isActive === false) {
      return {
        success: false,
        statusCode: 403,
        message: 'Account is deactivated. Please contact administrator.'
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return {
        success: false,
        statusCode: 401,
        message: 'Invalid credentials'
      };
    }

    // Use aggregation to get permission names directly
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
      permissions
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role?.name,
      permissions
    };

    setAuthCookies(res, token, userData);

    return {
      success: true,
      statusCode: 200,
      message: 'Login successful!',
      data: userData,
      token
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      statusCode: 500,
      message: 'Login failed',
      error: error.message
    };
  }
}
