import { ForbiddenError } from '@casl/ability';

/**
 * Admin-only middleware
 * Checks if user has Administrator role
 */
export default function adminOnly(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (req.user.role !== 'Administrator') {
      throw new ForbiddenError('Administrator role required');
    }

    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return res.status(403).json({
        success: false,
        message: 'Administrator access required',
        detail: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Admin check failed',
      error: error.message
    });
  }
}