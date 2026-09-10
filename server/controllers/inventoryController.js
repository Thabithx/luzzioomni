// DULARA
// Centralized inventory management logic.
// Ensures a single source of truth for stock quantities across Online and POS channels.
// Every stock change creates an auditable InventoryTransaction record.

const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');

/**
 * Helper function to safely adjust stock in the centralized inventory
 */
const updateCentralInventory = async ({
   productId,
   variantSize = '',
   quantityChange,
   transactionType,
   source = 'POS',
   referenceId = '',
   userId = null,
   notes = ''
}) => {
   const product = await Product.findById(productId);
   if (!product) {
      throw new Error(`Product not found (ID: ${productId})`);
   }

   let previousQuantity = 0;
   let newQuantity = 0;

   if (variantSize && product.variants && product.variants.length > 0) {
      const vIndex = product.variants.findIndex(v => v.size.toLowerCase() === variantSize.toLowerCase());
      if (vIndex === -1) {
         throw new Error(`Variant size '${variantSize}' not found for product '${product.name}'`);
      }

      previousQuantity = product.variants[vIndex].stock || 0;
      newQuantity = previousQuantity + quantityChange;

      if (newQuantity < 0) {
         throw new Error(`Insufficient stock for '${product.name}' (${variantSize}). Available: ${previousQuantity}, Requested: ${Math.abs(quantityChange)}`);
      }

      product.variants[vIndex].stock = newQuantity;
      product.stock = product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
   } else {
      previousQuantity = product.stock || 0;
      newQuantity = previousQuantity + quantityChange;

      if (newQuantity < 0) {
         throw new Error(`Insufficient stock for '${product.name}'. Available: ${previousQuantity}, Requested: ${Math.abs(quantityChange)}`);
      }

      product.stock = newQuantity;
   }

   await product.save();

   // Write to audit ledger
   const transaction = await InventoryTransaction.create({
      product: productId,
      variantSize,
      quantityChange,
      previousQuantity,
      newQuantity,
      transactionType,
      source,
      referenceId,
      performedBy: userId,
      notes
   });

   return { product, transaction };
};

// @desc    Get centralized stock overview & low-stock products
// @route   GET /api/inventory
// @access  Private (Admin / Warehouse / Sales)
exports.getInventory = async (req, res) => {
   try {
      const { search, lowStock, category, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const query = {};

      if (search) {
         query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
            { barcode: { $regex: search, $options: 'i' } }
         ];
      }

      if (category) {
         query.categories = category;
      }

      if (lowStock === 'true') {
         query.stock = { $lte: 10 };
      }

      const total = await Product.countDocuments(query);
      const products = await Product.find(query)
         .populate('categories', 'name')
         .sort({ stock: 1, name: 1 })
         .skip(skip)
         .limit(parseInt(limit));

      res.status(200).json({
         success: true,
         count: total,
         pages: Math.ceil(total / parseInt(limit)),
         page: parseInt(page),
         data: products
      });
   } catch (error) {
      console.error('getInventory error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Manually adjust inventory quantity (restock, loss, damage, manual correction)
// @route   POST /api/inventory/adjust
// @access  Private (Admin / Warehouse)
exports.adjustStock = async (req, res) => {
   try {
      const { productId, variantSize, quantityChange, transactionType, notes } = req.body;

      if (!productId || quantityChange === undefined || !transactionType) {
         return res.status(400).json({
            success: false,
            message: 'productId, quantityChange, and transactionType are required'
         });
      }

      const result = await updateCentralInventory({
         productId,
         variantSize: variantSize || '',
         quantityChange: Number(quantityChange),
         transactionType,
         source: 'ADMIN',
         performedBy: req.user ? req.user._id : null,
         notes: notes || 'Manual inventory adjustment'
      });

      res.status(200).json({
         success: true,
         message: 'Inventory successfully updated',
         data: result
      });
   } catch (error) {
      console.error('adjustStock error:', error);
      res.status(400).json({ success: false, message: error.message });
   }
};

// @desc    Get inventory audit transactions ledger history
// @route   GET /api/inventory/history
// @access  Private (Admin / Warehouse)
exports.getInventoryHistory = async (req, res) => {
   try {
      const { productId, transactionType, page = 1, limit = 30 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const query = {};

      if (productId) query.product = productId;
      if (transactionType) query.transactionType = transactionType;

      const total = await InventoryTransaction.countDocuments(query);
      const history = await InventoryTransaction.find(query)
         .populate('product', 'name sku images')
         .populate('performedBy', 'name email role')
         .sort({ timestamp: -1 })
         .skip(skip)
         .limit(parseInt(limit));

      res.status(200).json({
         success: true,
         count: total,
         pages: Math.ceil(total / parseInt(limit)),
         page: parseInt(page),
         data: history
      });
   } catch (error) {
      console.error('getInventoryHistory error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.updateCentralInventory = updateCentralInventory;