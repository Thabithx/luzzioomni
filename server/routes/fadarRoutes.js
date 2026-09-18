const express = require('express');
const { createFadarParcel } = require('../controllers/fadarController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-parcel', protect, admin, createFadarParcel);

module.exports = router;
