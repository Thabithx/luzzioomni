// BIHANDU
// Return & Exchange management system replacing legacy Excel-based workflow.
// Fully linked to original order records with automated stock restock / damage audit handling.

const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const RevenueTransaction = require('../models/RevenueTransaction');
const { updateCentralInventory } = require('./inventoryController');

// @desc    Create new return or exchange request
// @route   POST /api/returns
// @access  Private (Admin / Sales / Customer)
exports.createReturnRequest = async (req, res) => {
   try {
      const { originalOrderId, items, requestType = 'RETURN', notes } = req.body;

      if (!originalOrderId || !items || !Array.isArray(items) || items.length === 0) {
         return res.status(400).json({ success: false, message: 'Original order ID and items are required' });
      }

      const order = await Order.findById(originalOrderId);
      if (!order) {
         return res.status(404).json({ success: false, message: 'Original order not found' });
      }

      const returnNumber = `RET-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const returnItems = items.map(item => ({
         product: item.productId,
         size: item.size || '',
         quantity: Number(item.quantity) || 1,
         reason: item.reason || 'Customer Return',
         condition: item.condition || 'RESELLABLE'
      }));

      const returnRequest = await ReturnRequest.create({
         returnNumber,
         originalOrder: order._id,
         customer: order.user || req.user._id,
         items: returnItems,
         requestType,
         status: 'REQUESTED',
         notes: notes || ''
      });

      res.status(201).json({
         success: true,
         message: 'Return request submitted successfully',
         data: returnRequest
      });
   } catch (error) {
      console.error('createReturnRequest error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Get return and exchange requests
// @route   GET /api/returns
// @access  Private (Admin / Warehouse / Sales)
exports.getReturnRequests = async (req, res) => {
   try {
      const { status, requestType } = req.query;
      const query = {};

      if (status) query.status = status;
      if (requestType) query.requestType = requestType;

      const returns = await ReturnRequest.find(query)
         .populate('originalOrder', 'orderNumber totalPrice email createdAt')
         .populate('customer', 'name email phone')
         .populate('items.product', 'name images price')
         .populate('processedBy', 'name')
         .sort({ createdAt: -1 });

      res.status(200).json({
         success: true,
         count: returns.length,
         data: returns
      });
   } catch (error) {
      console.error('getReturnRequests error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Update return request status (Inspected, Approved, Refunded, Exchanged)
// @route   PUT /api/returns/:id/status
// @access  Private (Admin / Warehouse)
exports.processReturnStatus = async (req, res) => {
   try {
      const { status, refundAmount, notes, itemConditions } = req.body;
      const returnReq = await ReturnRequest.findById(req.params.id);

      if (!returnReq) {
         return res.status(404).json({ success: false, message: 'Return request not found' });
      }

      const previousStatus = returnReq.status;
      returnReq.status = status;
      returnReq.processedBy = req.user ? req.user._id : null;
      if (refundAmount !== undefined) returnReq.refundAmount = Number(refundAmount);
      if (notes) returnReq.notes = `${returnReq.notes}\n[Update Note]: ${notes}`.trim();

      // If condition overrides were provided during inspection
      if (itemConditions && Array.isArray(itemConditions)) {
         returnReq.items.forEach(item => {
            const match = itemConditions.find(c => c.productId === item.product.toString() && c.size === item.size);
            if (match && match.condition) {
               item.condition = match.condition;
            }
         });
      }

      await returnReq.save();

      // Stock adjustment logic when return is APPROVED
      if (previousStatus !== 'APPROVED' && (status === 'APPROVED' || status === 'REFUNDED' || status === 'EXCHANGED')) {
         for (const item of returnReq.items) {
            if (item.condition === 'RESELLABLE') {
               // Increase central inventory
               await updateCentralInventory({
                  productId: item.product,
                  variantSize: item.size,
                  quantityChange: item.quantity,
                  transactionType: 'RETURN',
                  source: 'WAREHOUSE',
                  referenceId: returnReq._id.toString(),
                  userId: req.user ? req.user._id : null,
                  notes: `Restocked approved return #${returnReq.returnNumber}`
               });
            } else if (item.condition === 'DAMAGED') {
               // Record damaged stock movement in audit ledger without increasing sellable quantity
               await updateCentralInventory({
                  productId: item.product,
                  variantSize: item.size,
                  quantityChange: 0,
                  transactionType: 'DAMAGED',
                  source: 'WAREHOUSE',
                  referenceId: returnReq._id.toString(),
                  userId: req.user ? req.user._id : null,
                  notes: `Damaged item returned #${returnReq.returnNumber}`
               });
            }
         }

         // Order status update
         const originalOrder = await Order.findById(returnReq.originalOrder);
         if (originalOrder) {
            originalOrder.status = 'returned';
            await originalOrder.save();
         }
      }

      // Financial refund record
      if (previousStatus !== 'REFUNDED' && status === 'REFUNDED' && returnReq.refundAmount > 0) {
         await RevenueTransaction.create({
            sourceChannel: 'ONLINE',
            orderId: returnReq.originalOrder,
            amount: -returnReq.refundAmount,
            paymentMethod: 'OTHER',
            status: 'REFUNDED',
            createdBy: req.user ? req.user._id : null,
            notes: `Refund issued for Return #${returnReq.returnNumber}`
         });
      }

      res.status(200).json({
         success: true,
         message: `Return request updated to ${status}`,
         data: returnReq
      });
   } catch (error) {
      console.error('processReturnStatus error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};
