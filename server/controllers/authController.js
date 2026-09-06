const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { linkGuestOrders } = require('./orderController');
const { isDevStore } = require('../config/database');

// Generate JWT
const generateToken = (id) => {
   return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
   });
};

// Helper: Escape regex special characters
const escapeRegex = (string) => {
   return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
   try {
      const { name, email, password, guestEmail } = req.body;
      const normalizedEmail = (email || '').trim().toLowerCase();

      // Check if user exists (Case-insensitive & Escaped)
      const userExists = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') } });

      if (userExists) {
         return res.status(400).json({ success: false, message: 'User already exists' });
      }

      // Create user
      const user = await User.create({
         name,
         email: normalizedEmail,
         password
      });

      if (user) {
         // Link existing guest orders (Primary email)
         await linkGuestOrders(user.email, user._id);

         // Link guest orders from identification (if provided and different)
         if (guestEmail && guestEmail.toLowerCase() !== user.email.toLowerCase()) {
            await linkGuestOrders(guestEmail, user._id);
         }

         res.status(201).json({
            success: true,
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
         });
      } else {
         res.status(400).json({ success: false, message: 'Invalid user data' });
      }
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
   try {
      const { email, password, guestEmail } = req.body;
      const normalizedEmail = (email || '').trim().toLowerCase();

      // Local Dev Catalog Fallback Login Bypass (THABITH SRIHARAN)
      if (isDevStore()) {
         if (normalizedEmail === 'admin@luzzio.com' && password === 'password123') {
            console.log('[DEV LOGIN] Bypassing MongoDB authentication via mock admin user credentials.');
            return res.json({
               success: true,
               _id: '600000000000000000000001',
               name: 'Dev Admin',
               email: 'admin@luzzio.com',
               role: 'admin',
               token: generateToken('600000000000000000000001')
            });
         }
      }

      // Check for user email (Case-insensitive & Escaped)
      const user = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') } }).select('+password');

      if (user && (await user.matchPassword(password))) {
         // Link any guest orders placed with this email
         await linkGuestOrders(user.email, user._id);

         // Link guest orders from identification (if provided and different)
         if (guestEmail && guestEmail.toLowerCase() !== user.email.toLowerCase()) {
            await linkGuestOrders(guestEmail, user._id);
         }

         res.json({
            success: true,
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
         });
      } else {
         res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
   try {
      const user = await User.findById(req.user.id);
      if (user) {
         res.json({
            success: true,
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
         });
      } else {
         res.status(404).json({ success: false, message: 'User not found' });
      }
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
   try {
      const user = await User.findById(req.user.id);

      if (user) {
         user.name = req.body.name || user.name;
         // Email is immutable for security and session integrity

         if (req.body.shippingAddress) {
            user.shippingAddress = {
               address: req.body.shippingAddress.address || user.shippingAddress.address,
               city: req.body.shippingAddress.city || user.shippingAddress.city,
               postalCode: req.body.shippingAddress.postalCode || user.shippingAddress.postalCode,
               phone: req.body.shippingAddress.phone || user.shippingAddress.phone
            };
         }

         const updatedUser = await user.save();

         res.json({
            success: true,
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            shippingAddress: updatedUser.shippingAddress,
            token: generateToken(updatedUser._id)
         });
      } else {
         res.status(404).json({ success: false, message: 'User not found' });
      }
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
   try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
         return res.status(404).json({ success: false, message: 'User not found with that email' });
      }

      // Get reset token
      const resetToken = user.getResetPasswordToken();

      await user.save({ validateBeforeSave: false });

      console.log('-----------------------------------------');
      console.log(`RESET TOKEN FOR ${user.email}: ${resetToken}`);
      console.log('-----------------------------------------');

      res.status(200).json({
         success: true,
         data: 'Password reset code generated. Please check your email or contact support for assistance.',
         resetToken: resetToken
      });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
   try {
      // Get user based on token
      const user = await User.findOne({
         resetPasswordToken: req.params.resettoken,
         resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
         return res.status(400).json({ success: false, message: 'Invalid or expired token' });
      }

      // Set new password
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.status(200).json({ success: true, message: 'Password reset successful' });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
