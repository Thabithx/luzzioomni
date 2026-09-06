const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: false
   },
   email: {
      type: String,
      required: true
   },
   orderItems: [
      {
         name: { type: String, required: true },
         qty: { type: Number, required: true },
         image: { type: String },
         price: { type: Number, required: true },
         product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: true
         },
         size: { type: String },
         color: { type: String, default: 'Noir' },
         trackingNumber: { type: String, default: '' }
      }
   ],
   shippingAddress: {
      firstName: { type: String },
      lastName: { type: String },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String },
      phone: { type: String, required: true },
      phone2: { type: String }
   },
   paymentMethod: {
      type: String,
      required: true,
      default: 'Stripe'
   },
   stripeSessionId: {
      type: String
   },
   paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String }
   },
   itemsPrice: {
      type: Number,
      required: true,
      default: 0.0
   },
   shippingPrice: {
      type: Number,
      required: true,
      default: 0.0
   },
   totalPrice: {
      type: Number,
      required: true,
      default: 0.0
   },
   isPaid: {
      type: Boolean,
      required: true,
      default: false
   },
   paidAt: {
      type: Date
   },
   isDelivered: {
      type: Boolean,
      required: true,
      default: false
   },
   // THABITH SRIHARAN: Omnicommerce channel and order tracking
   channel: {
      type: String,
      enum: ['ONLINE', 'POS'],
      default: 'ONLINE'
   },
   createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
   },
   orderNumber: {
      type: String,
      unique: true,
      sparse: true
   },
   discount: {
      type: Number,
      default: 0.0
   },
   tax: {
      type: Number,
      default: 0.0
   },
   deliveredAt: {
      type: Date
   },
   status: {
      type: String,
      enum: ['draft', 'pending', 'paid', 'confirmed', 'processing', 'packaged', 'out for delivery', 'delivered', 'completed', 'cancelled', 'returned'],
      default: 'draft'
   },
   fadar_order_id: {
      type: String,
      default: ''
   },
   fadar_tracking_number: {
      type: String,
      default: ''
   },
   trackingNumber: {
      type: String,
      default: ''
   }
}, {
   timestamps: true
});

// Optimization: Indexing for common searches & filtered views
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ email: 1 });

// Auto-delete orders after 60 days (60 * 60 * 24 * 60 seconds)
orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 5184000 });

module.exports = mongoose.model('Order', orderSchema);
