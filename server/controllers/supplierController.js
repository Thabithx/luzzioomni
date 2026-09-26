
const Supplier = require('../models/Supplier');

// Sri Lankan phone: 10 digits starting with 0 (e.g. 0771234567)
const SL_PHONE_REGEX = /^0[0-9]{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private (Admin / Warehouse)
exports.getSuppliers = async (req, res) => {
   try {
      const { search, status } = req.query;
      const query = {};

      if (search) {
         query.$or = [
            { supplierName: { $regex: search, $options: 'i' } },
            { contactPerson: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
         ];
      }

      if (status) query.status = status;

      const suppliers = await Supplier.find(query).sort({ supplierName: 1 });

      res.status(200).json({
         success: true,
         count: suppliers.length,
         data: suppliers
      });
   } catch (error) {
      console.error('getSuppliers error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private (Admin / Warehouse)
exports.createSupplier = async (req, res) => {
   try {
      const { supplierName, contactPerson, phone, email, address, notes, status } = req.body;

      if (!supplierName || supplierName.trim().length < 3) {
         return res.status(400).json({ success: false, message: 'Supplier name must be at least 3 characters' });
      }

      if (phone && !SL_PHONE_REGEX.test(phone.trim())) {
         return res.status(400).json({ success: false, message: 'Phone must be a valid Sri Lankan number (e.g. 0771234567)' });
      }

      if (email && !EMAIL_REGEX.test(email.trim())) {
         return res.status(400).json({ success: false, message: 'Invalid email address format' });
      }

      const supplier = await Supplier.create({
         supplierName: supplierName.trim(),
         contactPerson,
         phone: phone ? phone.trim() : '',
         email: email ? email.trim().toLowerCase() : '',
         address,
         notes,
         status: status || 'active'
      });

      res.status(201).json({
         success: true,
         message: 'Supplier created successfully',
         data: supplier
      });
   } catch (error) {
      console.error('createSupplier error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Update supplier details
// @route   PUT /api/suppliers/:id
// @access  Private (Admin / Warehouse)
exports.updateSupplier = async (req, res) => {
   try {
      const supplier = await Supplier.findById(req.params.id);
      if (!supplier) {
         return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      const { supplierName, phone, email } = req.body;

      if (supplierName !== undefined && supplierName.trim().length < 3) {
         return res.status(400).json({ success: false, message: 'Supplier name must be at least 3 characters' });
      }

      if (phone && !SL_PHONE_REGEX.test(phone.trim())) {
         return res.status(400).json({ success: false, message: 'Phone must be a valid Sri Lankan number (e.g. 0771234567)' });
      }

      if (email && !EMAIL_REGEX.test(email.trim())) {
         return res.status(400).json({ success: false, message: 'Invalid email address format' });
      }

      const fieldsToUpdate = ['supplierName', 'contactPerson', 'phone', 'email', 'address', 'notes', 'status'];
      fieldsToUpdate.forEach(field => {
         if (req.body[field] !== undefined) {
            supplier[field] = req.body[field];
         }
      });

      await supplier.save();

      res.status(200).json({
         success: true,
         message: 'Supplier updated successfully',
         data: supplier
      });
   } catch (error) {
      console.error('updateSupplier error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Delete / deactivate supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin / Warehouse)
exports.deleteSupplier = async (req, res) => {
   try {
      const supplier = await Supplier.findById(req.params.id);
      if (!supplier) {
         return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      await supplier.deleteOne();

      res.status(200).json({
         success: true,
         message: 'Supplier removed successfully'
      });
   } catch (error) {
      console.error('deleteSupplier error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};
