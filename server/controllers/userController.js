const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
   try {
      const users = await User.find().sort('-createdAt');
      res.status(200).json({
         success: true,
         count: users.length,
         data: users
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
   try {
      const user = await User.findById(req.params.id);

      if (!user) {
         return res.status(404).json({ success: false, message: 'User not found' });
      }

      await user.deleteOne();

      res.status(200).json({
         success: true,
         data: {}
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};
