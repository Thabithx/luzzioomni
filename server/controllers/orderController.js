const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const RevenueTransaction = require('../models/RevenueTransaction');
const { createNotification } = require('./notificationController');
const { updateCentralInventory } = require('./inventoryController');
const sendEmail = require('../utils/sendEmail');
const { orderConfirmationTemplate, trackingUpdateTemplate, adminOrderNotificationTemplate } = require('../utils/emailTemplates');
const crypto = require('crypto');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
   const start = Date.now();
   console.log(`[ORDER PROTOCOL START] User: ${req.user ? req.user.id : 'Guest'}`);

   try {
      const {
         orderItems,
         shippingAddress,
         paymentMethod,
         itemsPrice,
         shippingPrice,
         totalPrice,
         email
      } = req.body;

      if (orderItems && orderItems.length === 0) {
         return res.status(400).json({ success: false, message: 'No order items' });
      }

      // 1. Efficient Email & Name selection (No redundant DB trips)
      const orderEmail = (req.user ? req.user.email : (email || '')).trim().toLowerCase();

      const firstName = shippingAddress?.firstName || '';
      const lastName = shippingAddress?.lastName || '';
      const recipientName = req.user ? req.user.name : `${firstName} ${lastName}`.trim();

      const order = new Order({
         orderItems,
         user: req.user ? req.user.id : null,
         shippingAddress,
         paymentMethod,
         itemsPrice,
         shippingPrice,
         totalPrice,
         email: orderEmail
      });

      console.time('DB_OPERATIONS');
      // 2. Parallelize DB Save and Cart Clear for maximum throughput
      const saveTasks = [order.save()];
      if (req.user) {
         saveTasks.push(Cart.findOneAndUpdate({ user: req.user.id }, { items: [] }));
      }

      const [createdOrder] = await Promise.all(saveTasks);
      console.timeEnd('DB_OPERATIONS');



      // 4. Prepare PayHere or Koko parameters if needed (Calculated locally, near-instant)
      let payhereParams = null;
      let kokoParams = null;

      if (paymentMethod === 'PayHere') {
         const merchantId = (process.env.PAYHERE_MERCHANT_ID || '').trim();
         const merchantSecret = (process.env.PAYHERE_SECRET || '').trim();
         const amount = createdOrder.totalPrice.toFixed(2);
         const currency = 'LKR';

         const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
         const hashSource = merchantId + createdOrder._id + amount + currency + hashedSecret;
         const hash = crypto.createHash('md5').update(hashSource).digest('hex').toUpperCase();

         const isSandbox = process.env.PAYHERE_MODE === 'sandbox' || (process.env.NODE_ENV !== 'production' && process.env.PAYHERE_MODE !== 'live');

         payhereParams = {
            sandbox: isSandbox,
            merchant_id: merchantId,
            return_url: `${process.env.CLIENT_URL}/payment-success`,
            cancel_url: `${process.env.CLIENT_URL}/cart`,
            notify_url: `${process.env.SERVER_URL || 'https://luzzio-production.up.railway.app'}/api/payments/payhere/notify`,
            order_id: createdOrder._id,
            items: `Order ${createdOrder._id}`,
            amount: amount,
            currency: currency,
            hash: hash,
            first_name: shippingAddress.firstName,
            last_name: shippingAddress.lastName,
            email: createdOrder.email,
            phone: shippingAddress.phone || '0771234567',
            address: shippingAddress.address,
            city: shippingAddress.city,
            country: 'Sri Lanka',
         };
      } else if (paymentMethod === 'Koko') {
         try {
            const mId = process.env.KOKO_MERCHANT_ID;
            const apiKey = process.env.KOKO_API_KEY;
            const privateKey = process.env.KOKO_PRIVATE_KEY?.replace(/\\n/g, '\n');

            if (!mId || !apiKey || !privateKey) {
               throw new Error('Koko Credentials Missing');
            }

            const amount = createdOrder.totalPrice.toFixed(2);
            const currency = 'LKR';
            const pluginName = 'customapi';
            const pluginVersion = '1.0.1';
            const isProduction = process.env.NODE_ENV === 'production';
            const clientUrl = (isProduction ? 'https://luzziopremium.com' : (process.env.CLIENT_URL || 'http://localhost:5173')).replace(/\/$/, '');
            const serverUrl = (isProduction ? 'https://luzzio-production.up.railway.app' : (process.env.SERVER_URL || 'http://localhost:5001')).replace(/\/$/, '');

            const returnUrl = `${clientUrl}/payment-success?orderId=${createdOrder._id}&method=koko`;
            const cancelUrl = `${clientUrl}/cart`;
            const responseUrl = `${serverUrl}/api/payments/koko/notify`;
            const orderId = createdOrder._id.toString();
            const reference = `REF-${orderId.slice(-6).toUpperCase()}`;
            const firstName = shippingAddress.firstName || '';
            const lastName = shippingAddress.lastName || '';
            const email = createdOrder.email || '';
            const productName = createdOrder.orderItems.map(item => item.name).join(', ').substring(0, 100);

            // dataString order is critical!
            const dataString = mId + amount + currency + pluginName + pluginVersion +
               returnUrl + cancelUrl + orderId + reference +
               firstName + lastName + email + productName +
               apiKey + responseUrl;

            const sign = crypto.createSign('SHA256');
            sign.update(dataString);
            const signature = sign.sign(privateKey, 'base64');

            // Phone Sanitization: Ensure it starts with 0 and has 10 digits
            let kokoPhone = (shippingAddress.phone || '').replace(/\D/g, '');
            if (kokoPhone.length === 9) kokoPhone = '0' + kokoPhone;
            if (!kokoPhone) kokoPhone = shippingAddress.phone || '';

            kokoParams = {
               _mId: mId,
               api_key: apiKey,
               _returnUrl: returnUrl,
               _cancelUrl: cancelUrl,
               _responseUrl: responseUrl,
               _amount: amount,
               _currency: currency,
               _reference: reference,
               _orderId: orderId,
               _pluginName: pluginName,
               _pluginVersion: pluginVersion,
               _description: productName,
               _firstName: firstName,
               _lastName: lastName,
               _email: email,
               _mobileNumber: kokoPhone,
               dataString: dataString,
               signature: signature,
               kokoUrl: process.env.KOKO_MODE === 'qa' ? 'https://qaapi.paykoko.com/api/merchants/orderCreate' : 'https://prodapi.paykoko.com/api/merchants/orderCreate'
            };
         } catch (kokoErr) {
            console.error('[KOKO PARAM GEN FAILURE]', kokoErr.message);
         }
      }

      // 4. IMMEDIATE RESPONSE DISPATCH (Background everything else)
      res.status(201).json({
         success: true,
         data: createdOrder,
         payhereParams,
         kokoParams
      });

      console.log(`[ORDER PROTOCOL DISPATCHED] Order ${createdOrder._id} created with draft status. Awaiting payment.`);

      // 5. If COD, process centralized inventory deduction and revenue logging (THABITH SRIHARAN)
      if (paymentMethod === 'COD' || paymentMethod === 'Cash on Delivery') {
         try {
            // Deduct stock via centralized inventory ledger (creates InventoryTransaction records)
            for (const item of createdOrder.orderItems) {
               await updateCentralInventory({
                  productId: item.product,
                  variantSize: item.size,
                  quantityChange: -(item.qty || 1),
                  transactionType: 'ONLINE_SALE',
                  source: 'ONLINE',
                  referenceId: createdOrder._id,
                  notes: `COD order ${createdOrder._id.toString().slice(-6).toUpperCase()}`
               });
            }

            // Log revenue transaction
            await RevenueTransaction.create({
               order: createdOrder._id,
               amount: createdOrder.totalPrice,
               sourceChannel: 'ONLINE',
               paymentMethod: 'COD',
               note: `COD order #${createdOrder._id.toString().slice(-6).toUpperCase()}`
            });

            createdOrder.status = 'pending';
            await createdOrder.save();

            const { paymentSuccessTemplate } = require('../utils/emailTemplates');
            const adminEmail = process.env.ADMIN_EMAIL || 'luzzioclothing.com@gmail.com';

            setImmediate(() => {
               sendEmail({
                  email: createdOrder.email,
                  subject: `Order Confirmation #${createdOrder._id.toString().slice(-6).toUpperCase()}`,
                  html: paymentSuccessTemplate(createdOrder, false)
               }).catch(e => console.error('[COD EMAIL FAILURE] Client Notify Deferred:', e.message));

               sendEmail({
                  email: adminEmail,
                  subject: `New Order Received #${createdOrder._id.toString().slice(-6).toUpperCase()}`,
                  html: paymentSuccessTemplate(createdOrder, true)
               }).catch(e => console.error('[COD EMAIL FAILURE] Admin Alert Deferred:', e.message));
            });
            console.log(`[COD PROTOCOL] Order ${createdOrder._id} processed — inventory & revenue logged.`);
         } catch (codErr) {
            console.error(`[COD PROTOCOL FAILURE] Order ${createdOrder._id}:`, codErr.message);
         }
      }

   } catch (err) {
      console.error(`[ORDER PROTOCOL FAILURE] Time elapsed: ${Date.now() - start}ms - Error: ${err.message}`);
      res.status(400).json({ success: false, message: err.message });
   }
};

// @desc    Update order tracking number (Order Level)
// @route   PUT /api/orders/:id/tracking
// @access  Private/Admin
exports.updateOrderTracking = async (req, res) => {
   try {
      const { trackingNumber } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
         return res.status(404).json({ success: false, message: 'Order not found' });
      }

      order.trackingNumber = trackingNumber;
      await order.save();

      // Notify User
      if (order.user) {
         try {
            await createNotification(
               order.user,
               'order_status',
               'SHIPMENT DISPATCHED',
               `Tracking number (${trackingNumber}) has been assigned to your order.`,
               order._id,
               'Order'
            );
         } catch (notifErr) {
            console.error('Notification failed:', notifErr.message);
         }
      }

      // Dispatch Email Update Protocol
      setImmediate(async () => {
         try {
            const user = order.user ? await User.findById(order.user) : null;
            const recipientEmail = order.email || (user ? user.email : null);
            const recipientName = user ? user.name : `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim();

            if (recipientEmail) {
               await sendEmail({
                  email: recipientEmail,
                  subject: `LUZZIO LOGISTICS: SHIPMENT DISPATCHED #${order._id.toString().slice(-6).toUpperCase()}`,
                  html: trackingUpdateTemplate(order, trackingNumber, { name: recipientName || 'Valued Client' })
               });
            }
         } catch (emailErr) {
            console.error('Logistics Email Protocol Deferred:', emailErr.message);
         }
      });

      res.status(200).json({
         success: true,
         data: order
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Update order shipping address
// @route   PUT /api/orders/:id/address
// @access  Private/Admin
exports.updateOrderAddress = async (req, res) => {
   try {
      const { address, city, phone, phone2, firstName, lastName } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
         return res.status(404).json({ success: false, message: 'Order not found' });
      }

      order.shippingAddress = {
         ...order.shippingAddress,
         address: (address || order.shippingAddress.address).trim(),
         city: (city || order.shippingAddress.city).trim(),
         phone: (phone || order.shippingAddress.phone).trim(),
         phone2: (phone2 || order.shippingAddress.phone2 || '').trim(),
         firstName: (firstName || order.shippingAddress.firstName).trim(),
         lastName: (lastName || order.shippingAddress.lastName).trim()
      };

      const updatedOrder = await order.save();

      res.status(200).json({
         success: true,
         data: updatedOrder,
         message: 'Address protocol updated successfully.'
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Get orders by email (Guest access)
// @route   GET /api/orders/guest/:email
// @access  Public
exports.getGuestOrders = async (req, res) => {
   try {
      const email = (req.params.email || '').trim().toLowerCase();
      const orders = await Order.find({ email: email, user: null }).sort('-createdAt');
      res.status(200).json({
         success: true,
         data: orders
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Get my orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
   try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const total = await Order.countDocuments({ user: req.user.id });
      const orders = await Order.find({ user: req.user.id })
         .sort('-createdAt')
         .limit(limit)
         .skip(skip);

      const pages = Math.ceil(total / limit);

      res.status(200).json({
         success: true,
         count: total,
         pages: pages,
         page: page,
         data: orders
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

exports.linkGuestOrders = async (email, userId) => {
   try {
      if (!email) return 0;
      const normalizedEmail = email.trim().toLowerCase();
      const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const result = await Order.updateMany(
         {
            email: { $regex: new RegExp(`^\\s*${escapedEmail}\\s*$`, 'i') },
            user: null
         },
         { user: userId }
      );

      if (result.modifiedCount > 0) {
         console.log(`[SYNC SUCCESS] Linked ${result.modifiedCount} orders for ${normalizedEmail}`);
      }
      return result.modifiedCount;
   } catch (err) {
      console.error('Error linking guest orders:', err);
      return 0;
   }
};

// @desc    Manually sync guest orders to current user
// @route   PUT /api/orders/sync
// @access  Private
exports.syncMyOrders = async (req, res) => {
   try {
      const { email } = req.body;
      let count = await exports.linkGuestOrders(req.user.email, req.user.id);

      // If a specific guest email was provided and it's different, sync that too
      if (email && email.toLowerCase() !== req.user.email.toLowerCase()) {
         count += await exports.linkGuestOrders(email, req.user.id);
      }

      res.status(200).json({
         success: true,
         message: `Synchronization complete. ${count} orders linked.`,
         count
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
// THABITH SRIHARAN: Customer order management logic.
// Handles creation, updates, cancellation and order status transitions.
// Supports both ONLINE and POS order channels.
exports.getOrders = async (req, res) => {
   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const { status, excludeStatus, channel } = req.query;
      const query = {};

      if (channel) {
         query.channel = channel;
      }

      if (status) {
         query.status = status;
      } else if (excludeStatus) {
         query.status = { $ne: excludeStatus };
      }

      const count = await Order.countDocuments(query);
      const orders = await Order.find(query)
         .populate('user', 'id name')
         .populate('createdBy', 'id name email')
         .sort('-createdAt')
         .skip(skip)
         .limit(limit);

      res.status(200).json({
         success: true,
         count,
         pages: Math.ceil(count / limit),
         page,
         data: orders
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};


// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
   try {
      const order = await Order.findById(req.params.id);

      if (order) {
         order.status = req.body.status || order.status;

         if (req.body.status === 'delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
         }

         if (req.body.status === 'completed') {
            order.isDelivered = true;
            if (!order.deliveredAt) order.deliveredAt = Date.now();
         }

         if (req.body.status === 'paid') {
            order.isPaid = true;
            order.paidAt = Date.now();
         }

         const updatedOrder = await order.save();

         // Create notification for user
         const { createNotification } = require('./notificationController');
         const statusMessages = {
            'processing': 'Your order is being processed',
            'shipped': 'Your order has been shipped',
            'delivered': 'Your order has been delivered',
            'completed': 'Your order is complete',
            'cancelled': 'Your order has been cancelled'
         };

         if (order.user) {
            await createNotification(
               order.user,
               'order_status',
               'Order Status Update',
               statusMessages[req.body.status] || `Your order status has been updated to ${req.body.status}`,
               order._id,
               'Order'
            );
         }

         res.status(200).json({
            success: true,
            data: updatedOrder
         });
      } else {
         res.status(404).json({ success: false, message: 'Order not found' });
      }
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Update status for multiple orders
// @route   PUT /api/orders/batch-status
// @access  Private/Admin
exports.batchUpdateOrderStatus = async (req, res) => {
   try {
      const { ids, status, weights } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
         return res.status(400).json({ success: false, message: 'No order IDs provided' });
      }

      const orders = await Order.find({ _id: { $in: ids } });
      const results = [];

      for (const order of orders) {
         const oldStatus = order.status;
         order.status = status;

         if (status === 'delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
         }

         if (status === 'completed') {
            order.isDelivered = true;
            if (!order.deliveredAt) order.deliveredAt = Date.now();
         }

         if (status === 'paid') {
            order.isPaid = true;
            order.paidAt = Date.now();
         }

         // Fadar Integration Logic
         let fadarSuccess = false;
         let fadarMessage = '';

         if (oldStatus !== 'processing' && status === 'processing' && !order.fadar_order_id) {
            try {
               const weight = (weights && weights[order._id]) || 1;
               const { createFadarParcelInternal } = require('./fadarController');

               // We need an internal version or just refactor fadarController to be more reusable
               // For now, let's keep it simple and just update status if Fadar fails or skip complex logic in batch
               // Actually, it's better to support it.
               const fadarResult = await triggerFadarInternal(order, weight);
               if (fadarResult.success) {
                  order.fadar_order_id = fadarResult.fadar_order_id;
                  fadarSuccess = true;
               } else {
                  fadarMessage = fadarResult.message;
               }
            } catch (fadarErr) {
               fadarMessage = fadarErr.message;
            }
         }

         await order.save();

         // Create notification for user
         if (order.user) {
            const statusMessages = {
               'processing': 'Your order is being processed',
               'shipped': 'Your order has been shipped',
               'delivered': 'Your order has been delivered',
               'completed': 'Your order is complete',
               'cancelled': 'Your order has been cancelled'
            };

            await createNotification(
               order.user,
               'order_status',
               'Order Status Update',
               statusMessages[status] || `Your order status has been updated to ${status}`,
               order._id,
               'Order'
            ).catch(err => console.error(`Notification failed for order ${order._id}:`, err.message));
         }

         results.push({
            id: order._id,
            status: 'success',
            fadar: fadarSuccess ? 'created' : (fadarMessage || 'not_triggered')
         });
      }

      res.status(200).json({
         success: true,
         message: `Successfully updated ${results.length} orders`,
         results
      });

   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// Helper to trigger Fadar without a req/res cycle
// Helper to trigger Fadar without a req/res cycle
async function triggerFadarInternal(order, weight) {
   const axios = require('axios');
   const FormData = require('form-data');
   const apiKey = process.env.FADAR_API_KEY;
   const clientId = process.env.FADAR_CLIENT_ID;

   if (!apiKey || !clientId) {
      return { success: false, message: 'Fadar API configuration missing' };
   }

   const form = new FormData();
   form.append('api_key', apiKey);
   form.append('client_id', clientId);

   // Truncate Order ID logic (Match fadarController)
   const hexId = order._id.toString().slice(-7);
   const numericOrderId = parseInt(hexId, 16).toString();
   form.append('order_id', numericOrderId);

   const weightVal = weight && weight > 0 ? weight.toString() : '1';
   form.append('parcel_weight', weightVal);

   // Parcel Description (Match fadarController)
   const itemDetails = (order.orderItems || []).map(item => `${item.name} ${item.size ? '[' + item.size + '] ' : ''}(Qty: ${item.qty})`).join(', ');
   form.append('parcel_description', itemDetails.substring(0, 100));

   const recipientName = `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim();
   form.append('recipient_name', recipientName);

   // Phone Sanitization (Match fadarController)
   let rawPhone = order.shippingAddress.phone || '';
   rawPhone = rawPhone.replace(/\D/g, '');
   if (rawPhone.length === 9) rawPhone = '0' + rawPhone;
   form.append('recipient_contact_1', rawPhone);

   form.append('recipient_contact_2', order.shippingAddress.phone2 || '');
   form.append('recipient_address', order.shippingAddress.address || '');
   form.append('recipient_city', order.shippingAddress.city || '');

   // COD Amount (Match fadarController)
   const isCod = order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery';
   const codAmount = isCod ? order.totalPrice.toString() : '0';
   form.append('amount', codAmount);

   form.append('exchange', '0');

   try {
      console.log(`[FADAR BATCH] Initiating request for Order: ${numericOrderId} (Original: ${order._id})`);
      const response = await axios.post('https://www.fdedomestic.com/api/parcel/new_api_v1.php', form, {
         headers: { ...form.getHeaders() }
      });

      console.log(`[FADAR BATCH] API RESPONSE:`, response.data);

      if (response.data) {
         const fadarId = response.data.waybill_no || response.data.fadar_order_id || response.data.order_id || response.data.id;
         if (fadarId) {
            // Dispatch Logistics Email Protocol (Background)
            setImmediate(async () => {
               try {
                  const User = require('../models/User');
                  const sendEmail = require('../utils/sendEmail');
                  const { trackingUpdateTemplate } = require('../utils/emailTemplates');

                  const user = order.user ? await User.findById(order.user) : null;
                  const recipientEmail = order.email || (user ? user.email : null);
                  const recipientName = user ? user.name : `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim();

                  if (recipientEmail) {
                     console.log(`[FADAR BATCH EMAIL] Dispatching tracking update to: ${recipientEmail}`);
                     await sendEmail({
                        email: recipientEmail,
                        subject: `LUZZIO LOGISTICS: SHIPMENT DISPATCHED #${order._id.toString().slice(-6).toUpperCase()}`,
                        html: trackingUpdateTemplate(order, fadarId, { name: recipientName || 'Valued Client' })
                     });
                  }
               } catch (emailErr) {
                  console.error('[FADAR BATCH EMAIL FAILURE] Logistics Email Protocol Deferred:', emailErr.message);
               }
            });

            return { success: true, fadar_order_id: fadarId };
         }
         return {
            success: false,
            message: response.data.message || 'API accepted request but returned no sequence ID. Check Fadar credentials.'
         };
      }
      return { success: false, message: 'Empty payload received from Courier API.' };
   } catch (err) {
      console.error(`[FADAR BATCH ERROR] Order ${order._id}:`, err.response?.data || err.message);
      return { success: false, message: err.message };
   }
}
