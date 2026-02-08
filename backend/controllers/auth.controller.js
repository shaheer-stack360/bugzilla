import dotenv from 'dotenv';
import { clearAuthCookies } from '../common/cookies.js';
import { registerUser, getAvailableRoleNames } from '../services/auth.register.js';
import { loginUser } from '../services/auth.login.js';

dotenv.config();

export async function register(req, res) {
  const result = await registerUser(req.body, res);
  
  if (result.success) {
    return res.status(result.statusCode).json({
      message: result.message,
      user: result.data
    });
  } else {
    return res.status(result.statusCode).json({
      error: result.message,
      message: result.error
    });
  }
}

export async function login(req, res) {
  const result = await loginUser(req.body, res);
  
  if (result.success) {
    return res.status(result.statusCode).json({
      message: result.message,
      user: result.data
    });
  } else {
    return res.status(result.statusCode).json({
      error: result.message,
      message: result.error
    });
  }
}

// Logout function
export async function logout(req, res) {
  try {
    clearAuthCookies(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
}

// Export available roles and helper function
export { getAvailableRoleNames } from '../services/auth.register.js';