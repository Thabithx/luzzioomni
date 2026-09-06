const FAQ = require('../models/FAQ');

// @desc    Get all published FAQs
// @route   GET /api/faq
// @access  Public
exports.getFAQs = async (req, res) => {
   try {
      const { category } = req.query;

      const filter = { isPublished: true };
      if (category) {
         filter.category = category;
      }

      const faqs = await FAQ.find(filter).sort({ order: 1, createdAt: -1 });

      res.status(200).json({
         success: true,
         count: faqs.length,
         data: faqs
      });
   } catch (error) {
      console.error('Get FAQs error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch FAQs',
         error: error.message
      });
   }
};

// @desc    Get all FAQs including unpublished (admin)
// @route   GET /api/faq/admin
// @access  Private/Admin
exports.getAllFAQs = async (req, res) => {
   try {
      const faqs = await FAQ.find()
         .populate('createdBy', 'name')
         .sort({ order: 1, createdAt: -1 });

      res.status(200).json({
         success: true,
         count: faqs.length,
         data: faqs
      });
   } catch (error) {
      console.error('Get all FAQs error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch FAQs',
         error: error.message
      });
   }
};

// @desc    Create new FAQ (admin)
// @route   POST /api/faq
// @access  Private/Admin
exports.createFAQ = async (req, res) => {
   try {
      const { question, answer, category, order, isPublished } = req.body;

      if (!question || !answer) {
         return res.status(400).json({
            success: false,
            message: 'Question and answer are required'
         });
      }

      const faq = new FAQ({
         question,
         answer,
         category: category || 'General',
         order: order || 0,
         isPublished: isPublished !== undefined ? isPublished : true,
         createdBy: req.user._id
      });

      await faq.save();

      res.status(201).json({
         success: true,
         message: 'FAQ created successfully',
         data: faq
      });
   } catch (error) {
      console.error('Create FAQ error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to create FAQ',
         error: error.message
      });
   }
};

// @desc    Update FAQ (admin)
// @route   PUT /api/faq/:id
// @access  Private/Admin
exports.updateFAQ = async (req, res) => {
   try {
      const { question, answer, category, order, isPublished } = req.body;

      const faq = await FAQ.findById(req.params.id);

      if (!faq) {
         return res.status(404).json({
            success: false,
            message: 'FAQ not found'
         });
      }

      faq.question = question || faq.question;
      faq.answer = answer || faq.answer;
      faq.category = category || faq.category;
      faq.order = order !== undefined ? order : faq.order;
      faq.isPublished = isPublished !== undefined ? isPublished : faq.isPublished;

      await faq.save();

      res.status(200).json({
         success: true,
         message: 'FAQ updated successfully',
         data: faq
      });
   } catch (error) {
      console.error('Update FAQ error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update FAQ',
         error: error.message
      });
   }
};

// @desc    Delete FAQ (admin)
// @route   DELETE /api/faq/:id
// @access  Private/Admin
exports.deleteFAQ = async (req, res) => {
   try {
      const faq = await FAQ.findById(req.params.id);

      if (!faq) {
         return res.status(404).json({
            success: false,
            message: 'FAQ not found'
         });
      }

      await faq.deleteOne();

      res.status(200).json({
         success: true,
         message: 'FAQ deleted successfully'
      });
   } catch (error) {
      console.error('Delete FAQ error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete FAQ',
         error: error.message
      });
   }
};
