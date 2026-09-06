// MAHATHIR: Staff & Shift Management Routes

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
   getStaff,
   createStaffMember,
   updateStaffMember,
   clockIn,
   clockOut,
   getAttendance,
   getShifts,
   createShift,
   updateShift
} = require('../controllers/staffController');

router.get('/', protect, authorize('admin'), getStaff);
router.post('/', protect, authorize('admin'), createStaffMember);
router.put('/:id', protect, authorize('admin'), updateStaffMember);

router.post('/attendance/clock-in', protect, authorize('admin', 'sales', 'warehouse'), clockIn);
router.post('/attendance/clock-out', protect, authorize('admin', 'sales', 'warehouse'), clockOut);
router.get('/attendance', protect, authorize('admin', 'sales', 'warehouse'), getAttendance);

router.get('/shifts', protect, authorize('admin', 'sales', 'warehouse'), getShifts);
router.post('/shifts', protect, authorize('admin'), createShift);
router.put('/shifts/:id', protect, authorize('admin'), updateShift);

module.exports = router;
