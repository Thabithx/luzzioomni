// THABITH SRIHARAN
// Purchase order & procurement controller.
// Manages creation, item addition, purchase pricing, status tracking,
// and automatic centralized stock intake upon receiving inventory.

const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const { updateCentralInventory } = require('./inventoryController');

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private (Admin / Warehouse)
exports.getPurchaseOrders = async (req, res) => {
   try {
      const { status, supplier } = req.query;
      const query = {};

      if (status) query.status = status;
      if (supplier) query.supplier = supplier;

      const pos = await PurchaseOrder.find(query)
         .populate('supplier', 'supplierName contactPerson phone email')
         .populate('items.product', 'name sku images price')
         .populate('createdBy', 'name')
         .sort({ createdAt: -1 });

      res.status(200).json({
         success: true,
         count: pos.length,
         data: pos
      });
   } catch (error) {
      console.error('getPurchaseOrders error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Create purchase order
// @route   POST /api/purchase-orders
// @access  Private (Admin / Warehouse)
exports.createPurchaseOrder = async (req, res) => {
   try {
      const { supplierId, items, expectedDate, notes, status } = req.body;

      if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
         return res.status(400).json({ success: false, message: 'Supplier and items are required' });
      }

      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
         return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      let totalCost = 0;
      const poItems = [];

      for (const item of items) {
         const product = await Product.findById(item.productId);
         if (!product) {
            return res.status(400).json({ success: false, message: `Product not found (ID: ${item.productId})` });
         }

         const qty = Number(item.quantity) || 1;
         const cost = Number(item.purchasePrice) || 0;

         totalCost += qty * cost;

         poItems.push({
            product: product._id,
            size: item.size || '',
            quantity: qty,
            receivedQuantity: 0,
            purchasePrice: cost
         });
      }

      const poNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const purchaseOrder = await PurchaseOrder.create({
         poNumber,
         supplier: supplier._id,
         items: poItems,
         totalCost,
         status: status || 'DRAFT',
         expectedDate: expectedDate || null,
         createdBy: req.user ? req.user._id : null,
         notes: notes || ''
      });

      res.status(201).json({
         success: true,
         message: 'Purchase Order created successfully',
         data: purchaseOrder
      });
   } catch (error) {
      console.error('createPurchaseOrder error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Receive purchase order items and perform automatic central stock intake
// @route   POST /api/purchase-orders/:id/receive
// @access  Private (Admin / Warehouse)
exports.receivePurchaseOrder = async (req, res) => {
   try {
      const { itemsReceived, notes } = req.body; // Array of { productId, size, quantityReceived }
      const po = await PurchaseOrder.findById(req.params.id);

      if (!po) {
         return res.status(404).json({ success: false, message: 'Purchase Order not found' });
      }

      if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
         return res.status(400).json({ success: false, message: `PO is already ${po.status}` });
      }

      let fullyReceived = true;

      for (const item of po.items) {
         const match = (itemsReceived || []).find(r =>
            r.productId.toString() === item.product.toString() &&
            (r.size || '').toLowerCase() === (item.size || '').toLowerCase()
         );

         const qtyReceived = match ? Number(match.quantityReceived) : (item.quantity - item.receivedQuantity);

         if (qtyReceived > 0) {
            item.receivedQuantity = Math.min(item.quantity, item.receivedQuantity + qtyReceived);

            // Execute central stock increase
            await updateCentralInventory({
               productId: item.product,
               variantSize: item.size,
               quantityChange: qtyReceived,
               transactionType: 'PURCHASE_ORDER_RECEIVED',
               source: 'WAREHOUSE',
               referenceId: po._id.toString(),
               userId: req.user ? req.user._id : null,
               notes: `PO Received Intake #${po.poNumber}`
            });
         }

         if (item.receivedQuantity < item.quantity) {
            fullyReceived = false;
         }
      }

      po.status = fullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
      po.receivedDate = Date.now();
      if (notes) po.notes = `${po.notes}\n[Receiving Note]: ${notes}`.trim();

      await po.save();

      // Log expense for completed purchase order
      if (po.status === 'RECEIVED') {
         await Expense.create({
            category: 'Supplier Payments',
            description: `Procurement Payment for PO #${po.poNumber}`,
            amount: po.totalCost,
            supplier: po.supplier,
            reference: po.poNumber,
            status: 'PAID',
            createdBy: req.user ? req.user._id : null
         });
      }

      res.status(200).json({
         success: true,
         message: `PO #${po.poNumber} stock intake processed successfully`,
         data: po
      });
   } catch (error) {
      console.error('receivePurchaseOrder error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Update Purchase Order status
// @route   PUT /api/purchase-orders/:id/status
// @access  Private (Admin / Warehouse)
exports.updatePOStatus = async (req, res) => {
   try {
      const { status } = req.body;
      const po = await PurchaseOrder.findById(req.params.id);

      if (!po) {
         return res.status(404).json({ success: false, message: 'Purchase Order not found' });
      }

      po.status = status;
      await po.save();

      res.status(200).json({
         success: true,
         message: 'PO status updated',
         data: po
      });
   } catch (error) {
      console.error('updatePOStatus error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};
