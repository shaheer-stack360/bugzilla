import jwt from 'jsonwebtoken';
import { setAuthCookies } from '../common/cookies.js';
import encrypt_pass from '../common/pass_encryption.js';
import User from '../models/users.model.js';
import Role from '../models/roles.model.js';
import RolePermission from '../models/rolePermission.model.js';

/**
 * Enum for available roles
 */
export const AVAILABLE_ROLES = Object.freeze({
  DEVELOPER: 'Developer',
  QA: 'QA',
  MANAGER: 'Manager'
});

/**
 * Get all available role names as array
 */
export function getAvailableRoleNames() {
  return Object.values(AVAILABLE_ROLES);
}

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, role }
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} - { success, message, data? }
 */
export async function registerUser(userData, res) {
  try {
    const { name, email, password, role } = userData;

    if (!name || !email || !password || !role) {
      return {
        success: false,
        statusCode: 400,
        message: 'All fields are required: name, email, password, role'
      };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        success: false,
        statusCode: 400,
        message: 'User already exists with this email'
      };
    }

    const selectedRole = await Role.findById(role);

    if (!selectedRole) {
      return {
        success: false,
        statusCode: 400,
        message: 'Invalid role ID'
      };
    }

    if (!getAvailableRoleNames().includes(selectedRole.name)) {
      return {
        success: false,
        statusCode: 400,
        message: `Role not available for registration. Available roles: ${getAvailableRoleNames().join(', ')}`
      };
    }

    const passwordHash = await encrypt_pass(password);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: selectedRole._id
    });

    const rolePermissions = await RolePermission.find({ role: selectedRole._id }).populate('permission');

    const permissions = rolePermissions.map(rp => rp.permission?.name).filter(name => name);

    const payload = {
      sub: user._id.toString(),
      role: selectedRole.name,
      permissions
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    const userData_response = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: selectedRole.name,
      permissions
    };

    setAuthCookies(res, token, userData_response);

    return {
      success: true,
      statusCode: 201,
      message: 'Registration successful!',
      data: userData_response
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      statusCode: 500,
      message: 'Registration failed',
      error: error.message
    };
  }
}
