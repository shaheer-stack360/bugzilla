import User from '../models/users.model.js';
import Role from '../models/roles.model.js';

/**
 * GET /users/developers
 * Returns all active users with the Developer role.
 * Accessible by any authenticated user (not admin-only).
 */
export const getDevelopers = async (req, res) => {
  try {
    // Find the Developer role ID first
    const developerRole = await Role.findOne({ name: 'Developer' }).lean();

    if (!developerRole) {
      return res.status(404).json({ success: false, message: 'Developer role not found' });
    }

    const developers = await User.find({
      role: developerRole._id,
      isActive: true
    })
      .select('_id name email')
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, developers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};