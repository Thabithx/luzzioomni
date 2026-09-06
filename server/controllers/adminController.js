const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Visit = require('../models/Visit');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
   try {
      const { range = 'all' } = req.query;
      let startDate = new Date(0); // Default to beginning of time
      const now = new Date();

      if (range === 'today') {
         startDate = new Date(now.setHours(0, 0, 0, 0));
      } else if (range === 'week') {
         startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (range === 'month') {
         startDate = new Date(now.setMonth(now.getMonth() - 1));
      } else if (range === '6month') {
         startDate = new Date(now.setMonth(now.getMonth() - 6));
      } else if (range === 'year') {
         startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      }

      // Filter orders by date range
      const orders = await Order.find({
         createdAt: { $gte: startDate },
         isPaid: true,
         status: { $nin: ['cancelled', 'returned','draft','pending'] }
      });

      const userCount = await User.countDocuments({ role: 'user' });
      const productCount = await Product.countDocuments({});

      // Gross Revenue
      const grossRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);

      // Inventory Outflow (Total items sold across the selected range)
      const inventoryOutflow = orders.reduce((acc, order) => {
         return acc + order.orderItems.reduce((itemAcc, item) => itemAcc + item.qty, 0);
      }, 0);

      // Archive Momentum (Orders in last 30 days - always kept as 30d for momentum)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentOrdersCount = await Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

      // Visitor Traffic count for the range
      const visitorCount = await Visit.countDocuments({
         createdAt: { $gte: startDate }
      });

      // Recent Orders for the table - Keep full recent history
      const recentOrders = await Order.find({})
         .populate('user', 'name email')
         .sort('-createdAt')
         .limit(5);

      res.status(200).json({
         success: true,
         data: {
            grossRevenue,
            inventoryOutflow,
            clientRegistry: userCount,
            archiveMomentum: recentOrdersCount,
            visitorCount,
            recentOrders
         }
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};
