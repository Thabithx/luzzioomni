const axios = require('axios');
const Order = require('../models/Order');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { trackingUpdateTemplate } = require('../utils/emailTemplates');

// @desc    Create a new parcel booking with Fadar
// @route   POST /api/fadar/create-parcel
// @access  Private/Admin
exports.createFadarParcel = async (req, res) => {
   try {
      const { orderId, parcel_weight, newStatus, oldStatus } = req.body;

      // Status Guard Logic
      // Call Fadar API ONLY when: oldStatus !== "processing" AND newStatus === "processing"
      if (oldStatus === 'processing' || newStatus !== 'processing') {
         return res.status(400).json({
            success: false,
            message: 'Status change does not trigger Fadar booking.'
         });
      }

      const order = await Order.findById(orderId);
      if (!order) {
         return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Prevent duplicate courier creation
      if (order.fadar_order_id) {
         return res.status(400).json({
            success: false,
            message: 'A parcel has already been booked with Fadar for this order.',
            fadar_order_id: order.fadar_order_id
         });
      }

      const apiKey = process.env.FADAR_API_KEY;
      const clientId = process.env.FADAR_CLIENT_ID;

      if (!apiKey || !clientId) {
         return res.status(500).json({
            success: false,
            message: 'Fadar API configuration missing in .env'
         });
      }

      // Prepare Fadar API Request Body
      // Use application/x-www-form-urlencoded
      const FormData = require('form-data');
      const form = new FormData();

      form.append('api_key', apiKey);
      form.append('client_id', clientId);

      // Truncate Order ID logic:
      // Fadar likely expects a NUMERIC ID (e.g. 124578 from sample)
      // We take the last 7 hex chars of the ObjectId and convert to decimal integer to ensure it's numeric and safe
      const hexId = order._id.toString().slice(-7);
      const numericOrderId = parseInt(hexId, 16).toString();
      form.append('order_id', numericOrderId);

      const weightVal = parcel_weight && parcel_weight > 0 ? parcel_weight.toString() : '1';
      form.append('parcel_weight', weightVal);

      // Detailed format requested: Name [Size] (Qty: [quantity])
      const itemDetails = order.orderItems.map(item => `${item.name} ${item.size ? '[' + item.size + '] ' : ''}(Qty: ${item.qty})`).join(', ');
      const parcelDescription = `${itemDetails}`;

      form.append('parcel_description', parcelDescription.substring(0, 100)); // Safety truncate for API limits
      form.append('recipient_name', `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim());

      // Sending Phone Number AS IS (expecting 10 digits with leading 0, e.g., 077...)
      // User confirmed "we need the 0"
      // SANITIZATION: Remove spaces/dashes, ensure it starts with 0
      let rawPhone = order.shippingAddress.phone || '';
      rawPhone = rawPhone.replace(/\D/g, ''); // Remove non-digits
      if (rawPhone.length === 9) rawPhone = '0' + rawPhone; // Add leading 0 if missing

      form.append('recipient_contact_1', rawPhone);
      form.append('recipient_contact_2', order.shippingAddress.phone2 || '');
      form.append('recipient_address', order.shippingAddress.address || '');
      form.append('recipient_city', order.shippingAddress.city || '');

      const isCod = order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery';
      const codAmount = isCod ? order.totalPrice.toString() : '0';

      form.append('amount', codAmount);
      form.append('exchange', '0'); // CHANGED: 'no' -> '0' to match working PHP sample

      // Construct Debug Object (Safe for Client)
      const debugParamsObj = {
         order_id: numericOrderId,
         recipient_city: order.shippingAddress.city || '',
         parcel_weight: weightVal,
         parcel_description: parcelDescription,
         amount: codAmount,
         recipient_name: `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim(),
         recipient_contact_1: rawPhone,
         recipient_address: order.shippingAddress.address || '',
         exchange: '0'
      };

      // Log the payload for debugging (Redact API Key)
      // Note: FormData check requires iterating headers/getBuffer usually, simplifying log for now
      console.log(`[FADAR PARAMETERS] Form Data Created for Order ${numericOrderId}`, debugParamsObj);

      const response = await axios.post('https://www.fdedomestic.com/api/parcel/new_api_v1.php', form, {
         headers: {
            ...form.getHeaders()
         }
      });

      console.log(`[FADAR] API RAW RESPONSE:`, response.data);

      if (response.data) {
         // The Fadar API response structure can vary; we check for known ID fields
         // Update: Include waybill_no as per successful response logs
         const fadarId = response.data.waybill_no || response.data.fadar_order_id || response.data.order_id || response.data.id;
         const isStatusOk = response.data.status === '200' || response.data.status === 200;

         if (!fadarId && !isStatusOk) {
            console.error(`[FADAR FAILURE] No Order ID in response for Order ${order._id}:`, response.data);

            if (response.data.status === '212' || response.data.status === 212) {
               console.warn('[FADAR HINT] Status 212 usually indicates an Invalid City. Please verify the city name against the Fadar approved list.');
            }

            // Extract specific error reason from upstream API
            // Fadar might return error in various fields depending on the failure type
            let upstreamError = 'Courier API accepted the request but did not return a tracking ID.';

            if (response.data) {
               if (typeof response.data === 'string') {
                  upstreamError = response.data;
               } else {
                  upstreamError = response.data.msg ||
                     response.data.message ||
                     response.data.error ||
                     response.data.description ||
                     JSON.stringify(response.data);
               }
            }

            return res.status(400).json({
               success: false,
               message: `FADAR REJECTED: ${upstreamError}`,
               error: response.data,
               debugParams: debugParamsObj // Include debug info for frontend
            });
         }

         order.fadar_order_id = fadarId;
         order.fadar_tracking_number = fadarId;
         order.trackingNumber = fadarId;
         order.status = 'processing';
         const updatedOrder = await order.save();

         console.log(`[FADAR SUCCESS] Order ${order._id} synchronized with Fadar ID: ${order.fadar_order_id}`);

         // Dispatch Logistics Email Protocol (Background)
         setImmediate(async () => {
            try {
               const user = order.user ? await User.findById(order.user) : null;
               const recipientEmail = order.email || (user ? user.email : null);
               const recipientName = user ? user.name : `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim();

               if (recipientEmail) {
                  console.log(`[FADAR EMAIL] Dispatching tracking update to: ${recipientEmail}`);
                  await sendEmail({
                     email: recipientEmail,
                     subject: `LUZZIO LOGISTICS: SHIPMENT DISPATCHED #${order._id.toString().slice(-6).toUpperCase()}`,
                     html: trackingUpdateTemplate(order, fadarId, { name: recipientName || 'Valued Client' })
                  });
               }
            } catch (emailErr) {
               console.error('[FADAR EMAIL FAILURE] Logistics Email Protocol Deferred:', emailErr.message);
            }
         });

         return res.status(200).json({
            success: true,
            data: response.data,
            order: updatedOrder
         });
      }

      console.warn(`[FADAR] API returned empty payload for Order ${order._id}`);
      return res.status(500).json({
         success: false,
         message: 'Courier API returned an empty response. Connection might be unstable.'
      });

   } catch (err) {
      console.error('[FADAR PROTOCOL ERROR]:', err.response?.data || err.message);
      res.status(err.response?.status || 500).json({
         success: false,
         message: 'Critical failure during Fadar synchronization.',
         error: err.response?.data || err.message
      });
   }
};


