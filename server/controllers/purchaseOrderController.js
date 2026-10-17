// THABITH SRIHARAN
// Purchase order & procurement controller.
// Manages creation, item addition, purchase pricing, status tracking,
// and automatic centralized stock intake upon receiving inventory.

const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const { updateCentralInventory } = require('./inventoryController');
const { fail, blank, nonNeg, int } = require('../utils/validate');

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

         const qty = Number(item.quantity);
         const cost = Number(item.purchasePrice);

         if (!Number.isInteger(qty) || qty < 1) {
            return fail(res, `Quantity for "${product.name}" must be a whole number of at least 1`);
         }
         if (isNaN(cost) || cost < 0) {
            return fail(res, `Purchase price for "${product.name}" cannot be negative`);
         }

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

      const previousStatus = po.status;
      po.status = status;

      // Automatically link PO status change to central stock intake when marked RECEIVED
      if (status === 'RECEIVED' && previousStatus !== 'RECEIVED') {
         po.receivedDate = Date.now();
         for (const item of po.items) {
            const qtyNeeded = item.quantity - (item.receivedQuantity || 0);
            if (qtyNeeded > 0) {
               item.receivedQuantity = item.quantity;
               await updateCentralInventory({
                  productId: item.product,
                  variantSize: item.size,
                  quantityChange: qtyNeeded,
                  transactionType: 'PURCHASE_ORDER_RECEIVED',
                  source: 'WAREHOUSE',
                  referenceId: po._id.toString(),
                  userId: req.user ? req.user._id : null,
                  notes: `PO Received Intake #${po.poNumber}`
               });
            }
         }

         // Log supplier procurement expense
         try {
            await Expense.create({
               category: 'Supplier Payments',
               description: `Procurement Payment for PO #${po.poNumber}`,
               amount: po.totalCost,
               supplier: po.supplier,
               reference: po.poNumber,
               status: 'PAID',
               createdBy: req.user ? req.user._id : null
            });
         } catch (expErr) {
            console.error('Expense log failed for PO:', expErr.message);
         }
      }

      await po.save();

      res.status(200).json({
         success: true,
         message: `PO #${po.poNumber} status updated to ${status}${status === 'RECEIVED' ? ' & stock intake completed' : ''}`,
         data: po
      });
   } catch (error) {
      console.error('updatePOStatus error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// THABITH: 1-Click Smart Restock PO Builder
// @desc    Get low-stock products suitable for a supplier and calculate replenishment suggestions
// @route   GET /api/purchase-orders/smart-restock/:supplierId
// @access  Private (Admin / Warehouse)
exports.getSmartRestockSuggestions = async (req, res) => {
   try {
      const supplier = await Supplier.findById(req.params.supplierId);
      if (!supplier) {
         return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      const pastPOs = await PurchaseOrder.find({ supplier: supplier._id });
      const associatedProductIds = new Set();
      pastPOs.forEach(po => {
         po.items.forEach(it => {
            if (it.product) associatedProductIds.add(it.product.toString());
         });
      });

      let lowStockProducts = [];
      if (associatedProductIds.size > 0) {
         lowStockProducts = await Product.find({
            _id: { $in: Array.from(associatedProductIds) },
            $or: [
               { stock: { $lte: 10 } },
               { $expr: { $lte: ['$stock', '$lowStockThreshold'] } }
            ]
         }).select('name sku price stock lowStockThreshold images variants');
      }

      if (!lowStockProducts || lowStockProducts.length === 0) {
         lowStockProducts = await Product.find({
            $or: [
               { stock: { $lte: 8 } },
               { $expr: { $lte: ['$stock', '$lowStockThreshold'] } }
            ]
         }).limit(8).select('name sku price stock lowStockThreshold images variants');
      }

      if (!lowStockProducts || lowStockProducts.length === 0) {
         lowStockProducts = await Product.find().sort({ stock: 1 }).limit(5).select('name sku price stock lowStockThreshold images variants');
      }

      const suggestions = (lowStockProducts || []).map(p => {
         const threshold = p.lowStockThreshold || 5;
         const currentStock = p.stock || 0;
         const targetStock = Math.max(20, threshold * 3);
         const suggestedQty = Math.max(10, targetStock - currentStock);
         const estimatedCost = Math.round((p.price || 3000) * 0.5);

         return {
            productId: p._id,
            name: p.name,
            sku: p.sku || 'N/A',
            image: p.images?.[0] || '',
            currentStock,
            threshold,
            suggestedQuantity: suggestedQty,
            purchasePrice: estimatedCost,
            subtotal: suggestedQty * estimatedCost
         };
      });

      const totalEstimatedCost = suggestions.reduce((acc, curr) => acc + curr.subtotal, 0);

      res.status(200).json({
         success: true,
         data: {
            supplier: {
               id: supplier._id,
               name: supplier.supplierName,
               contactPerson: supplier.contactPerson,
               email: supplier.email
            },
            suggestions,
            totalItems: suggestions.length,
            totalEstimatedCost
         }
      });
   } catch (error) {
      console.error('getSmartRestockSuggestions error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Generate 1-Click Smart Restock PO pre-populated with low stock items
// @route   POST /api/purchase-orders/smart-restock/:supplierId
// @access  Private (Admin / Warehouse)
exports.generateSmartRestockPO = async (req, res) => {
   try {
      const supplier = await Supplier.findById(req.params.supplierId);
      if (!supplier) {
         return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      const { customItems, notes } = req.body;
      let itemsToOrder = customItems;

      if (!itemsToOrder || itemsToOrder.length === 0) {
         const pastPOs = await PurchaseOrder.find({ supplier: supplier._id });
         const productIds = new Set();
         pastPOs.forEach(po => po.items.forEach(it => { if (it.product) productIds.add(it.product.toString()); }));

         let lowProducts = [];
         if (productIds.size > 0) {
            lowProducts = await Product.find({ _id: { $in: Array.from(productIds) }, stock: { $lte: 12 } });
         }
         if (lowProducts.length === 0) {
            lowProducts = await Product.find().sort({ stock: 1 }).limit(5);
         }

         itemsToOrder = lowProducts.map(p => ({
            productId: p._id,
            quantity: Math.max(10, ((p.lowStockThreshold || 5) * 3) - (p.stock || 0)),
            purchasePrice: Math.round((p.price || 3000) * 0.5),
            size: p.variants?.[0]?.size || 'M'
         }));
      }

      if (itemsToOrder.length === 0) {
         return res.status(400).json({ success: false, message: 'No low-stock items detected to restock.' });
      }

      const poItems = [];
      let totalCost = 0;

      for (const item of itemsToOrder) {
         const product = await Product.findById(item.productId);
         if (!product) continue;

         const qty = Number(item.quantity) || 10;
         const cost = Number(item.purchasePrice) || Math.round(product.price * 0.5);

         totalCost += qty * cost;
         poItems.push({
            product: product._id,
            size: item.size || (product.variants?.[0]?.size || ''),
            quantity: qty,
            receivedQuantity: 0,
            purchasePrice: cost
         });
      }

      const poNumber = `PO-RESTOCK-${Date.now().toString().slice(-5)}`;

      const purchaseOrder = await PurchaseOrder.create({
         poNumber,
         supplier: supplier._id,
         items: poItems,
         totalCost,
         status: 'DRAFT',
         expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
         createdBy: req.user ? req.user._id : null,
         notes: notes || `Auto-generated 1-Click Smart Restock for ${supplier.supplierName}`
      });

      const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
         .populate('supplier', 'supplierName contactPerson phone email')
         .populate('items.product', 'name sku images price');

      res.status(201).json({
         success: true,
         message: `Smart Restock Purchase Order #${poNumber} created successfully!`,
         data: populatedPO
      });
   } catch (error) {
      console.error('generateSmartRestockPO error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};
