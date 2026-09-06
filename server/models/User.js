const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please add a name']
   },
   email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
         /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
         'Please add a valid email'
      ]
   },
   password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false
   },
   role: {
      type: String,
      enum: ['user', 'admin', 'sales', 'warehouse', 'customer'],
      default: 'user'
   },
   // BIHANDU / MAHATHIR: Staff Profile & RBAC extensions
   employeeId: {
      type: String,
      unique: true,
      sparse: true
   },
   phone: {
      type: String,
      default: ''
   },
   address: {
      type: String,
      default: ''
   },
   status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
   },
   joinedDate: {
      type: Date,
      default: Date.now
   },
   profileImage: {
      type: String,
      default: ''
   },
   createdAt: {
      type: Date,
      default: Date.now
   },
   resetPasswordToken: String,
   resetPasswordExpire: Date,
   shippingAddress: {
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      phone: { type: String, default: '' }
   }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
   if (this.email) {
      this.email = this.email.trim().toLowerCase();
   }

   if (!this.isModified('password')) {
      return next();
   }

   const salt = await bcrypt.genSalt(10);
   this.password = await bcrypt.hash(this.password, salt);
   next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
   return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
   // Generate a 6-digit code
   const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

   // Set token and expiry
   this.resetPasswordToken = resetToken;
   this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

   return resetToken;
};

module.exports = mongoose.model('User', userSchema);
