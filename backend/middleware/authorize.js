import { ForbiddenError } from '@casl/ability';
import { Subjects } from '../common/ability.js';

/**
 * CASL Authorization Middleware
 * Checks if user has ability to perform a specific action on a resource
 * 
 * @param {String} action - Action name (e.g., 'read', 'create', 'update', 'delete')
 * @param {String} subject - Subject name (e.g., 'Bug', 'User')
 * @param {Function} resourceLoader - Optional function to load the resource from request
 *                                    If provided, will check field-level permissions
 * @returns {Function} - Express middleware function
 */
export default function authorize(action, subject, resourceLoader = null) {
  return async (req, res, next) => {
    try {
      if (!req.ability) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (resourceLoader) {
        const resource = await resourceLoader(req);
        ForbiddenError.from(req.ability).throwUnlessCan(action, resource || subject);
      } else {
        ForbiddenError.from(req.ability).throwUnlessCan(action, subject);
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          requiredAction: action,
          requiredSubject: subject,
          detail: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: error.message
      });
    }
  };
}
