const Visit = require('../models/Visit');
const Order = require('../models/Order');
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const FAQ = require('../models/FAQ');
const User = require('../models/User');
const ReturnRequest = require('../models/ReturnRequest');
const Attendance = require('../models/Attendance');
const Shift = require('../models/Shift');
const Expense = require('../models/Expense');
const { isDevStore } = require('../config/database');

// @desc    Log a new visit
// @route   POST /api/analytics/log-visit
// @access  Public
exports.logVisit = async (req, res) => {
   try {
      if (isDevStore()) {
         return res.status(200).json({ success: true, source: 'dev-store' });
      }

      const { path } = req.body;
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
      const userAgent = req.headers['user-agent'];

      // Don't log admin paths or developer environment calls if already handled by CORS/Auth
      if (path && !path.startsWith('/admin')) {
         await Visit.create({
            ip,
            userAgent,
            path: path || '/'
         });
      }

      res.status(200).json({ success: true });
   } catch (err) {
      console.error('Error logging visit:', err);
      res.status(200).json({ success: true });
   }
};

// MRM THABITH: Order & Supplier Performance Analytics Report
// @desc    Get order velocity and supplier fulfillment performance
// @route   GET /api/analytics/order-supplier-report
// @access  Private (Admin / Warehouse / Sales)
exports.getOrderSupplierReport = async (req, res) => {
   try {
      const [orders, pos, suppliers] = await Promise.all([
         Order.find().lean(),
         PurchaseOrder.find().populate('supplier', 'supplierName contactPerson email phone').lean(),
         Supplier.find().lean()
      ]);

      // 1. Order Performance Metrics
      const totalOrders = orders.length;
      let completedOrders = 0;
      let cancelledOrders = 0;
      let onlineOrders = 0;
      let posOrders = 0;
      let totalRevenue = 0;

      const statusBreakdown = {};

      orders.forEach(o => {
         const st = o.status || 'pending';
         statusBreakdown[st] = (statusBreakdown[st] || 0) + 1;

         if (st === 'completed' || st === 'delivered') completedOrders++;
         if (st === 'cancelled') cancelledOrders++;

         if (o.channel === 'POS') posOrders++;
         else onlineOrders++;

         if (st !== 'cancelled') totalRevenue += (o.totalPrice || 0);
      });

      const orderFulfillmentRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;
      const cancellationRate = totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : 0;
      const aov = totalOrders > 0 ? Math.round(totalRevenue / (totalOrders - cancelledOrders || 1)) : 0;

      // 2. Supplier Performance Metrics
      const supplierStats = {};
      suppliers.forEach(s => {
         supplierStats[s._id.toString()] = {
            supplierId: s._id,
            supplierName: s.supplierName,
            contactPerson: s.contactPerson,
            phone: s.phone,
            totalPOs: 0,
            completedPOs: 0,
            totalSpend: 0,
            itemsOrdered: 0,
            itemsReceived: 0
         };
      });

      pos.forEach(po => {
         const supId = po.supplier ? (po.supplier._id || po.supplier).toString() : null;
         if (supId && supplierStats[supId]) {
            supplierStats[supId].totalPOs++;
            supplierStats[supId].totalSpend += (po.totalCost || 0);
            if (po.status === 'RECEIVED') supplierStats[supId].completedPOs++;

            (po.items || []).forEach(item => {
               supplierStats[supId].itemsOrdered += (item.quantity || 0);
               supplierStats[supId].itemsReceived += (item.receivedQuantity || 0);
            });
         }
      });

      const supplierPerformance = Object.values(supplierStats).map(s => ({
         ...s,
         fulfillmentRate: s.itemsOrdered > 0 ? ((s.itemsReceived / s.itemsOrdered) * 100).toFixed(1) : 100
      }));

      res.status(200).json({
         success: true,
         data: {
            orders: {
               totalOrders,
               completedOrders,
               cancelledOrders,
               onlineOrders,
               posOrders,
               totalRevenue,
               aov,
               orderFulfillmentRate: Number(orderFulfillmentRate),
               cancellationRate: Number(cancellationRate),
               statusBreakdown
            },
            suppliers: {
               totalSuppliers: suppliers.length,
               totalPOs: pos.length,
               supplierPerformance
            }
         }
      });
   } catch (error) {
      console.error('getOrderSupplierReport error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// SRIHARAN: User Activity & Review/FAQ Engagement Reports
// @desc    Get customer activity, review moderation, and FAQ metrics
// @route   GET /api/analytics/user-review-faq-report
// @access  Private (Admin / Sales)
exports.getUserReviewFAQReport = async (req, res) => {
   try {
      const [users, products, faqs] = await Promise.all([
         User.find().select('name email role createdAt status').lean(),
         Product.find().select('name rating numReviews reviews category price').lean(),
         FAQ.find().lean()
      ]);

      // 1. User Engagement Metrics
      const totalUsers = users.length;
      const customers = users.filter(u => !u.role || u.role === 'customer').length;
      const staffUsers = totalUsers - customers;

      // 2. Review Metrics across all products
      let totalReviews = 0;
      let approvedReviews = 0;
      let rejectedReviews = 0;
      let pendingReviews = 0;
      let totalRatingSum = 0;
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const topRatedProducts = [];

      products.forEach(p => {
         if (p.numReviews > 0) {
            topRatedProducts.push({
               _id: p._id,
               name: p.name,
               rating: p.rating,
               numReviews: p.numReviews
            });
         }

         (p.reviews || []).forEach(r => {
            totalReviews++;
            totalRatingSum += (r.rating || 5);
            const stars = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
            ratingDistribution[stars] = (ratingDistribution[stars] || 0) + 1;

            if (r.isApproved === true || r.isApproved === undefined) approvedReviews++;
            else if (r.isApproved === false) rejectedReviews++;
            else pendingReviews++;
         });
      });

      topRatedProducts.sort((a, b) => b.rating - a.rating);

      const avgGlobalRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : 5.0;
      const approvalRate = totalReviews > 0 ? ((approvedReviews / totalReviews) * 100).toFixed(1) : 100;

      // 3. FAQ Metrics
      const totalFAQs = faqs.length;
      const publishedFAQs = faqs.filter(f => f.isPublished !== false).length;
      const faqCategoryBreakdown = {};
      faqs.forEach(f => {
         const cat = f.category || 'General';
         faqCategoryBreakdown[cat] = (faqCategoryBreakdown[cat] || 0) + 1;
      });

      res.status(200).json({
         success: true,
         data: {
            users: {
               totalUsers,
               customers,
               staffUsers
            },
            reviews: {
               totalReviews,
               approvedReviews,
               rejectedReviews,
               pendingReviews,
               approvalRate: Number(approvalRate),
               avgGlobalRating: Number(avgGlobalRating),
               ratingDistribution,
               topRatedProducts: topRatedProducts.slice(0, 5)
            },
            faqs: {
               totalFAQs,
               publishedFAQs,
               faqCategoryBreakdown
            }
         }
      });
   } catch (error) {
      console.error('getUserReviewFAQReport error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// MAHATHIR: Consolidated Executive Analytics Report
// @desc    Consolidated Multi-Module Executive Report across Sales, Margins, Inventory, Returns, and Staff
// @route   GET /api/analytics/consolidated-report
// @access  Private (Admin)
exports.getConsolidatedReport = async (req, res) => {
   try {
      const [orders, products, returns, staff, attendance, shifts, expenses] = await Promise.all([
         Order.find({ status: { $ne: 'cancelled' } }).lean(),
         Product.find().select('name stock price lowStockThreshold category').lean(),
         ReturnRequest.find().lean(),
         User.find({ role: { $in: ['admin', 'sales', 'warehouse'] } }).select('-password').lean(),
         Attendance.find().lean(),
         Shift.find().lean(),
         Expense.find().lean()
      ]);

      // 1. Sales & Revenue
      let grossRevenue = 0;
      orders.forEach(o => { grossRevenue += (o.totalPrice || 0); });
      const orderCount = orders.length;

      // 2. Inventory & Stock Valuation
      let totalStockUnits = 0;
      let totalStockValuation = 0;
      let lowStockCount = 0;

      products.forEach(p => {
         const st = p.stock || 0;
         totalStockUnits += st;
         totalStockValuation += (st * (p.price || 0));
         const threshold = p.lowStockThreshold || 5;
         if (st <= threshold) lowStockCount++;
      });

      // 3. Financials & Profit Margin
      let totalExpenses = 0;
      expenses.forEach(e => { totalExpenses += (e.amount || 0); });
      const estimatedCOGS = Math.round(grossRevenue * 0.55);
      const grossProfit = Math.max(0, grossRevenue - estimatedCOGS);
      const netProfit = grossProfit - totalExpenses;
      const profitMarginPercent = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : 0;

      // 4. Returns & Reconciliation
      const totalReturns = returns.length;
      const approvedReturns = returns.filter(r => r.status === 'APPROVED' || r.status === 'REFUNDED').length;
      const returnRate = orderCount > 0 ? ((totalReturns / orderCount) * 100).toFixed(1) : 0;

      // 5. Staff & Operations
      const totalStaff = staff.length;
      const activeClockIns = attendance.filter(a => a.clockIn && !a.clockOut).length;
      const totalShiftsScheduled = shifts.length;

      res.status(200).json({
         success: true,
         data: {
            executiveSummary: {
               grossRevenue,
               orderCount,
               netProfit,
               profitMarginPercent: Number(profitMarginPercent),
               totalStockUnits,
               totalStockValuation,
               lowStockCount,
               totalReturns,
               returnRatePercent: Number(returnRate),
               totalStaff,
               activeClockIns
            },
            generatedAt: new Date().toISOString()
         }
      });
   } catch (error) {
      console.error('getConsolidatedReport error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};
