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

      const supplierPerformance = Object.values(supplierStats).map(s => {
         const fulfillmentRate = s.itemsOrdered > 0 ? Number(((s.itemsReceived / s.itemsOrdered) * 100).toFixed(1)) : 100;
         const completionRate = s.totalPOs > 0 ? Number(((s.completedPOs / s.totalPOs) * 100).toFixed(1)) : 100;
         const score = Math.min(100, Math.max(0, Math.round(fulfillmentRate * 0.65 + completionRate * 0.35)));

         let grade = 'GRADE_A';
         let gradeLabel = 'Grade A (Preferred Partner)';
         let riskLevel = 'LOW';
         if (score < 50) {
            grade = 'GRADE_D';
            gradeLabel = 'Grade D (High Risk / Inconsistent)';
            riskLevel = 'HIGH';
         } else if (score < 75) {
            grade = 'GRADE_C';
            gradeLabel = 'Grade C (Needs Monitoring)';
            riskLevel = 'MEDIUM';
         } else if (score < 90) {
            grade = 'GRADE_B';
            gradeLabel = 'Grade B (Reliable Vendor)';
            riskLevel = 'LOW';
         }

         return {
            ...s,
            fulfillmentRate,
            completionRate,
            score,
            grade,
            gradeLabel,
            riskLevel
         };
      });

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

// @desc    Get Comprehensive Multi-Sheet Excel Report Data (Sheet 1: Summary, Sheet 2: Inventory, Sheet 3: POS Sales)
// @route   GET /api/analytics/comprehensive-report
// @access  Private (Admin / Warehouse / Sales)
exports.getComprehensiveReport = async (req, res) => {
   try {
      const [products, orders] = await Promise.all([
         Product.find().populate('categories', 'name').lean(),
         Order.find({ status: { $ne: 'cancelled' } })
            .populate('createdBy', 'name email')
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .lean()
      ]);

      let totalProducts = products.length;
      let totalStockUnits = 0;
      let totalInventoryValue = 0;
      let lowStockProducts = 0;
      let outOfStockProducts = 0;

      const inventoryData = products.map(p => {
         const st = p.stock || 0;
         totalStockUnits += st;
         const price = (p.salePrice && p.salePrice > 0) ? p.salePrice : (p.price || 0);
         const val = st * price;
         totalInventoryValue += val;

         const threshold = p.lowStockThreshold || 10;
         let stockStatus = 'IN STOCK';
         if (st === 0) {
            outOfStockProducts++;
            stockStatus = 'OUT OF STOCK';
         } else if (st <= threshold) {
            lowStockProducts++;
            stockStatus = 'LOW STOCK';
         }

         const catNames = p.categories && p.categories.length > 0 
            ? p.categories.map(c => c.name).join(', ') 
            : (p.category ? p.category.name : 'Uncategorized');

         return {
            sku: p.sku || 'N/A',
            barcode: p.barcode || 'N/A',
            name: p.name,
            category: catNames,
            price: p.price || 0,
            salePrice: p.salePrice || 0,
            stock: st,
            stockStatus,
            inventoryValue: val
         };
      });

      let totalPOSSales = 0;
      let numberPOSOrders = 0;
      let totalItemsSold = 0;
      let totalDiscounts = 0;
      let totalTax = 0;
      const paymentMethodMap = {};
      const posSalesData = [];

      orders.forEach(o => {
         const isPOS = o.channel === 'POS' || (o.paymentMethod && o.paymentMethod.toUpperCase().includes('POS')) || o.paymentMethod === 'CASH';
         const orderTotal = o.totalPrice || 0;
         const orderDiscount = o.discount || 0;
         const orderTax = o.tax || 0;

         totalDiscounts += orderDiscount;
         totalTax += orderTax;

         const pm = o.paymentMethod || 'Other';
         if (!paymentMethodMap[pm]) {
            paymentMethodMap[pm] = { totalSales: 0, orderCount: 0 };
         }
         paymentMethodMap[pm].totalSales += orderTotal;
         paymentMethodMap[pm].orderCount += 1;

         if (isPOS) {
            totalPOSSales += orderTotal;
            numberPOSOrders += 1;
         }

         (o.orderItems || []).forEach(item => {
            totalItemsSold += (item.qty || 1);

            if (isPOS) {
               const itemTotal = (item.qty || 1) * (item.price || 0);
               const cashierName = o.createdBy?.name || o.createdBy?.email || 'POS Cashier';
               const customerName = o.shippingAddress?.firstName
                  ? `${o.shippingAddress.firstName} ${o.shippingAddress.lastName || ''}`.trim()
                  : (o.user?.name || o.email || 'Walk-in Client');

               posSalesData.push({
                  date: o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A',
                  orderNo: o.orderNumber || o._id.toString(),
                  product: item.name,
                  sku: item.sku || 'N/A',
                  size: item.size || 'N/A',
                  qty: item.qty || 1,
                  unitPrice: item.price || 0,
                  discount: orderDiscount > 0 ? (orderDiscount / o.orderItems.length).toFixed(2) : 0,
                  tax: orderTax > 0 ? (orderTax / o.orderItems.length).toFixed(2) : 0,
                  total: itemTotal,
                  paymentMethod: o.paymentMethod,
                  cashier: cashierName,
                  customer: customerName
               });
            }
         });
      });

      const salesByPaymentMethod = Object.keys(paymentMethodMap).map(method => ({
         method,
         totalSales: paymentMethodMap[method].totalSales,
         orderCount: paymentMethodMap[method].orderCount
      }));

      res.status(200).json({
         success: true,
         data: {
            summaryData: {
               totalProducts,
               totalStockUnits,
               totalInventoryValue,
               lowStockProducts,
               outOfStockProducts,
               totalPOSSales,
               numberPOSOrders,
               totalItemsSold,
               totalDiscounts,
               totalTax,
               salesByPaymentMethod
            },
            inventoryData,
            posSalesData
         }
      });
   } catch (error) {
      console.error('getComprehensiveReport error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

