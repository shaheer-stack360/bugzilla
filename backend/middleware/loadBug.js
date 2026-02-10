import Bug from '../models/bugs.model.js';

export const loadBug = async (req, res, next) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('reported_by', 'name email')
      .populate('assigned_to', 'name email')
      .lean();

    if (!bug) {
      return res.status(404).json({ error: 'Bug not found' });
    }

    req.bug = bug; // 🔥 reuse everywhere
    next();
  } catch (err) {
    next(err);
  }
};
