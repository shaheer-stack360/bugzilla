import User from '../models/users.model.js';
import Bug from '../models/bugs.model.js';

// ==================== ADMIN DASHBOARD ====================

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalBugs,
      openBugs,
      resolvedBugs,
      recentUsers,
      recentBugs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Bug.countDocuments(),
      Bug.countDocuments({ status: 'Open' }),
      Bug.countDocuments({ status: 'Resolved' }),
      User.find({ isActive: true })
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Bug.find()
        .populate('reported_by', 'name email')
        .populate('assigned_to', 'name email')
        .select('title status priority createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Weekly bug creation stats
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyStats = await Bug.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        bugs: {
          total: totalBugs,
          open: openBugs,
          resolved: resolvedBugs,
          openRate: totalBugs > 0 ? (openBugs / totalBugs * 100).toFixed(1) : 0
        }
      },
      weeklyStats,
      recent: {
        users: recentUsers,
        bugs: recentBugs
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== USER MANAGEMENT ====================

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, showInactive = 'false' } = req.query;
    const skip = (page - 1) * limit;

    const query = {};

    if (showInactive !== 'true') {
      query.isActive = true;
    }

    // Filter by role if provided
    if (role && role !== 'all') {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -__v')
        .populate('role', 'name permissions')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -__v')
      .populate('role', 'name permissions');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    // Check if email is being updated to an existing email (except current user)
    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: req.params.id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another user'
        });
      }
    }

    // Don't allow updating password via this endpoint
    if (password) {
      return res.status(400).json({
        success: false,
        message: 'Use password reset endpoint to update password'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User activated successfully',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== BUG MANAGEMENT ====================

export const getAllBugsAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      priority,
      reportedBy,
      assignedTo,
      fromDate,
      toDate
    } = req.query;

    const skip = (page - 1) * limit;

    const query = {};

    // Apply filters if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (reportedBy) {
      query.reported_by = reportedBy;
    }

    if (assignedTo) {
      query.assigned_to = assignedTo;
    }

    // Date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const [bugs, total] = await Promise.all([
      Bug.find(query)
        .populate('reported_by', 'name email')
        .populate('assigned_to', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Bug.countDocuments(query)
    ]);

    // Get stats
    const stats = await Bug.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Bug.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      bugs,
      stats: {
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        byPriority: priorityStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBugAdmin = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('reported_by', 'name email role')
      .populate('assigned_to', 'name email role');

    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    res.json({ success: true, bug });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBugAdmin = async (req, res) => {
  try {
    const bug = await Bug.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('reported_by', 'name email')
      .populate('assigned_to', 'name email');

    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    res.json({
      success: true,
      message: 'Bug updated successfully',
      bug
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBugAdmin = async (req, res) => {
  try {
    const bug = await Bug.findByIdAndDelete(req.params.id);

    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    res.json({
      success: true,
      message: 'Bug deleted permanently'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};