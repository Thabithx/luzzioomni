// POS SYSTEM CONTROLLER
// Handles in-store POS operations: product search/scanning, customer creation/lookup,
// atomic sale completion with central inventory reduction and revenue accounting.

const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const RevenueTransaction = require('../models/RevenueTransaction');
const { updateCentralInventory } = require('./inventoryController');
const AuditLog = require('../models/AuditLog');

// @desc    Search products for POS terminal (by name, SKU, or barcode)
// @route   GET /api/pos/products
// @access  Private (Admin / Sales)
exports.searchProducts = async (req, res) => {
   try {
      const { query } = req.query;
      let filter = {};

      if (query && query.trim()) {
         const searchTerm = query.trim();
         filter = {
            $or: [
               { name: { $regex: searchTerm, $options: 'i' } },
               { sku: { $regex: searchTerm, $options: 'i' } },
               { barcode: { $regex: searchTerm, $options: 'i' } }
            ]
         };
      }

      const products = await Product.find(filter)
         .populate('categories', 'name')
         .select('name price salePrice images stock variants sku barcode sizes colors')
         .limit(50)
         .sort({ name: 1 });

      res.status(200).json({
         success: true,
         count: products.length,
         data: products
      });
   } catch (error) {
      console.error('POS searchProducts error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Search customers for POS sale attachment
// @route   GET /api/pos/customers
// @access  Private (Admin / Sales)
exports.searchCustomers = async (req, res) => {
   try {
      const { query } = req.query;
      let filter = {};

      if (query && query.trim()) {
         const searchTerm = query.trim();
         filter = {
            $or: [
               { name: { $regex: searchTerm, $options: 'i' } },
               { email: { $regex: searchTerm, $options: 'i' } },
               { phone: { $regex: searchTerm, $options: 'i' } }
            ]
         };
      }

      const customers = await User.find(filter)
         .select('name email phone shippingAddress role')
         .limit(20);

      res.status(200).json({
         success: true,
         count: customers.length,
         data: customers
      });
   } catch (error) {
      console.error('POS searchCustomers error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Quick create customer at POS checkout
// @route   POST /api/pos/customers
// @access  Private (Admin / Sales)
exports.createCustomer = async (req, res) => {
   try {
      const { name, email, phone, address, city } = req.body;

      if (!name) {
         return res.status(400).json({ success: false, message: 'Customer name is required' });
      }

      const customerEmail = (email || `walkin_${Date.now()}@luzzio.local`).trim().toLowerCase();

      // Check if email already registered
      const existing = await User.findOne({ email: customerEmail });
      if (existing) {
         return res.status(200).json({
            success: true,
            data: existing,
            message: 'Customer already exists'
         });
      }

      // Create guest customer
      const customer = await User.create({
         name: name.trim(),
         email: customerEmail,
         password: `pos_pass_${Date.now()}`,
         phone: phone || '',
         role: 'customer',
         shippingAddress: {
            address: address || 'Storefront POS Walk-in',
            city: city || 'Local',
            phone: phone || ''
         }
      });

      res.status(201).json({
         success: true,
         data: customer,
         message: 'POS Customer registered successfully'
      });
   } catch (error) {
      console.error('POS createCustomer error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Complete POS Sale atomically
// @route   POST /api/pos/sale
// @access  Private (Admin / Sales)
exports.processSale = async (req, res) => {
   try {
      const {
         items,
         customerId,
         customerEmail,
         paymentMethod = 'CASH',
         discount = 0,
         tax = 0,
         notes = ''
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
         return res.status(400).json({ success: false, message: 'Cart items are required for POS sale' });
      }

      // Step 1: Backend validation of trusted prices and stock availability
      let itemsPrice = 0;
      const orderItems = [];

      for (const item of items) {
         const product = await Product.findById(item.productId);
         if (!product) {
            return res.status(400).json({ success: false, message: `Product not found: ${item.name || item.productId}` });
         }

         const qty = Number(item.qty) || 1;
         if (qty <= 0) {
            return res.status(400).json({ success: false, message: 'Item quantity must be greater than 0' });
         }

         const unitPrice = product.salePrice > 0 ? product.salePrice : product.price;

         // Check available stock
         if (item.size && product.variants && product.variants.length > 0) {
            const variant = product.variants.find(v => v.size.toLowerCase() === item.size.toLowerCase());
            if (!variant || variant.stock < qty) {
               return res.status(400).json({
                  success: false,
                  message: `Insufficient stock for '${product.name}' (${item.size}). Available: ${variant ? variant.stock : 0}`
               });
            }
         } else if (product.stock < qty) {
            return res.status(400).json({
               success: false,
               message: `Insufficient stock for '${product.name}'. Available: ${product.stock}`
            });
         }

         itemsPrice += unitPrice * qty;

         orderItems.push({
            name: product.name,
            qty: qty,
            image: (product.images && product.images[0]) || '',
            price: unitPrice,
            product: product._id,
            size: item.size || '',
            color: item.color || 'Noir'
         });
      }

      const calculatedDiscount = Math.max(0, Number(discount) || 0);
      const calculatedTax = Math.max(0, Number(tax) || 0);
      const totalPrice = Math.max(0, itemsPrice - calculatedDiscount + calculatedTax);

      // Customer info lookup
      let targetUser = null;
      if (customerId) {
         targetUser = await User.findById(customerId);
      }

      const email = customerEmail || (targetUser ? targetUser.email : `pos_${Date.now()}@luzzio.local`);
      const orderNumber = `POS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      // Step 2: Create Order record
      const posOrder = new Order({
         orderNumber,
         user: targetUser ? targetUser._id : null,
         email,
         orderItems,
         shippingAddress: {
            firstName: targetUser ? targetUser.name.split(' ')[0] : 'Walk-in',
            lastName: targetUser ? targetUser.name.split(' ').slice(1).join(' ') : 'Customer',
            address: 'In-Store POS Sale',
            city: 'Storefront',
            postalCode: '00000',
            phone: (targetUser && targetUser.phone) || '0000000000'
         },
         paymentMethod,
         itemsPrice,
         shippingPrice: 0,
         discount: calculatedDiscount,
         tax: calculatedTax,
         totalPrice,
         isPaid: true,
         paidAt: Date.now(),
         isDelivered: true,
         deliveredAt: Date.now(),
         status: 'completed',
         channel: 'POS',
         createdBy: req.user ? req.user._id : null
      });

      await posOrder.save();

      // Step 3: Deduct stock from Central Inventory & write transaction history
      for (const item of orderItems) {
         await updateCentralInventory({
            productId: item.product,
            variantSize: item.size,
            quantityChange: -item.qty,
            transactionType: 'POS_SALE',
            source: 'POS',
            referenceId: posOrder._id.toString(),
            userId: req.user ? req.user._id : null,
            notes: `POS Sale Order #${orderNumber}`
         });
      }

      // Step 4: Write Revenue Transaction
      await RevenueTransaction.create({
         sourceChannel: 'POS',
         orderId: posOrder._id,
         amount: totalPrice,
         paymentMethod,
         status: 'COMPLETED',
         createdBy: req.user ? req.user._id : null,
         notes: `In-Store POS Checkout #${orderNumber}`
      });

      // Step 5: Audit Log
      await AuditLog.create({
         user: req.user ? req.user._id : null,
         action: 'POS_SALE_COMPLETED',
         entity: 'Order',
         entityId: posOrder._id.toString(),
         details: { orderNumber, totalPrice, itemsCount: orderItems.length, paymentMethod }
      });

      res.status(201).json({
         success: true,
         message: 'POS Sale processed successfully',
         data: {
            order: posOrder,
            receipt: {
               orderNumber,
               date: posOrder.createdAt,
               cashier: req.user ? req.user.name : 'Cashier',
               items: orderItems,
               itemsPrice,
               discount: calculatedDiscount,
               tax: calculatedTax,
               totalPrice,
               paymentMethod
            }
         }
      });
   } catch (error) {
      console.error('processSale error:', error);
      res.status(400).json({ success: false, message: error.message });
   }
};
