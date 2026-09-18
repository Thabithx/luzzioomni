const Order = require('../models/Order');
const Product = require('../models/Product');
const RevenueTransaction = require('../models/RevenueTransaction');
const { updateCentralInventory } = require('../controllers/inventoryController');
const sendEmail = require('./sendEmail');
const { paymentSuccessTemplate } = require('./emailTemplates');

/**
 * Finalizes an order after successful payment.
 * Deducts stock, updates status, and sends notifications.
 */
exports.finalizeOrder = async (orderId, paymentId, provider) => {
   try {
      const order = await Order.findById(orderId);

      if (!order) {
         console.error(`[CRITICAL] Finalization failed: Order ${orderId} not found.`);
         return { success: false, message: 'Order not found' };
      }

      if (order.isPaid) {
         console.log(`[FINALIZE] Order ${orderId} is already marked as paid. Skipping.`);
         return { success: true, message: 'Already paid' };
      }

      // 1. Mark as Paid and Update Status
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = 'paid';
      order.paymentResult = {
         id: paymentId,
         status: 'succeeded',
         provider: provider
      };

      // 2. CENTRALIZED STOCK DEDUCTION (DULARA / THABITH SRIHARAN)
      for (const item of order.orderItems) {
         try {
            await updateCentralInventory({
               productId: item.product,
               variantSize: item.size,
               quantityChange: -(item.qty || 1),
               transactionType: 'ONLINE_SALE',
               source: 'ONLINE',
               referenceId: order._id,
               notes: `Paid online order ${order._id.toString().slice(-6).toUpperCase()} via ${provider}`
            });
            console.log(`[STOCK SYNC] Central stock deducted for ${item.name} (${item.size})`);
         } catch (stockErr) {
            console.error(`[STOCK SYNC FAILURE] Failed to deduct stock for ${item.name}: ${stockErr.message}`);
         }
      }

      // 3. LOG REVENUE TRANSACTION (ADHAN)
      try {
         await RevenueTransaction.create({
            order: order._id,
            amount: order.totalPrice,
            sourceChannel: 'ONLINE',
            paymentMethod: provider,
            note: `Online order paid via ${provider} (Payment ID: ${paymentId})`
         });
         console.log(`[FINALIZE REVENUE] Revenue transaction created for Order ${order._id}`);
      } catch (revErr) {
         console.error(`[FINALIZE REVENUE FAILURE] Failed to log revenue: ${revErr.message}`);
      }

      await order.save();
      console.log(`[FINALIZE] Order ${orderId} successfully finalized.`);

      // 3. DISPATCH NOTIFICATIONS (Non-blocking)
      const adminEmail = process.env.ADMIN_EMAIL || 'luzzioclothing.com@gmail.com';

      setImmediate(() => {
         // Notify Client
         sendEmail({
            email: order.email,
            subject: `Order Confirmation #${order._id.toString().slice(-6).toUpperCase()}`,
            html: paymentSuccessTemplate(order, false)
         })
            .then(() => console.log(`[FINALIZE EMAIL] Client notification delivered: ${order.email}`))
            .catch(e => console.error('[FINALIZE EMAIL FAILURE] Client Notify Deferred:', e.message));

         // Notify Admin
         sendEmail({
            email: adminEmail,
            subject: `New Order Received #${order._id.toString().slice(-6).toUpperCase()}`,
            html: paymentSuccessTemplate(order, true)
         })
            .then(() => console.log(`[FINALIZE EMAIL] Admin notification delivered: ${adminEmail}`))
            .catch(e => console.error('[FINALIZE EMAIL FAILURE] Admin Alert Deferred:', e.message));
      });

      return { success: true };
   } catch (err) {
      console.error(`[FINALIZE ERROR] Order ${orderId}:`, err.message);
      return { success: false, message: err.message };
   }
};
