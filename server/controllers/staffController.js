// MAHATHIR
// Staff user management, employee profiles, attendance (Clock In/Out), and shift scheduling.

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Shift = require('../models/Shift');

// @desc    Get all staff users (ADMIN, SALES, WAREHOUSE)
// @route   GET /api/staff
// @access  Private (Admin)
exports.getStaff = async (req, res) => {
   try {
      const staff = await User.find({ role: { $in: ['admin', 'sales', 'warehouse'] } })
         .select('-password')
         .sort({ name: 1 });

      res.status(200).json({
         success: true,
         count: staff.length,
         data: staff
      });
   } catch (error) {
      console.error('getStaff error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Create staff member profile & account
// @route   POST /api/staff
// @access  Private (Admin)
exports.createStaffMember = async (req, res) => {
   try {
      const { name, email, password, role, employeeId, phone, address, joinedDate } = req.body;

      if (!name || !email || !password || !role) {
         return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
      }

      const existing = await User.findOne({ email: email.trim().toLowerCase() });
      if (existing) {
         return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      const autoEmployeeId = employeeId || `EMP-${Date.now().toString().slice(-4)}`;

      const staff = await User.create({
         name: name.trim(),
         email: email.trim().toLowerCase(),
         password,
         role: ['admin', 'sales', 'warehouse'].includes(role) ? role : 'sales',
         employeeId: autoEmployeeId,
         phone: phone || '',
         address: address || '',
         joinedDate: joinedDate || Date.now(),
         status: 'active'
      });

      res.status(201).json({
         success: true,
         message: 'Staff member created successfully',
         data: {
            _id: staff._id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            employeeId: staff.employeeId
         }
      });
   } catch (error) {
      console.error('createStaffMember error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Update staff profile or role
// @route   PUT /api/staff/:id
// @access  Private (Admin)
exports.updateStaffMember = async (req, res) => {
   try {
      const staff = await User.findById(req.params.id);
      if (!staff) {
         return res.status(404).json({ success: false, message: 'Staff member not found' });
      }

      const fields = ['name', 'role', 'phone', 'address', 'status', 'employeeId', 'profileImage'];
      fields.forEach(f => {
         if (req.body[f] !== undefined) staff[f] = req.body[f];
      });

      if (req.body.password) {
         staff.password = req.body.password;
      }

      await staff.save();

      res.status(200).json({
         success: true,
         message: 'Staff profile updated',
         data: staff
      });
   } catch (error) {
      console.error('updateStaffMember error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Clock in employee attendance
// @route   POST /api/staff/attendance/clock-in
// @access  Private (Admin / Sales / Warehouse)
exports.clockIn = async (req, res) => {
   try {
      const employeeId = req.body.employeeId || req.user._id;

      // Check if already clocked in today without clock out
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const existing = await Attendance.findOne({
         employee: employeeId,
         clockIn: { $gte: startOfDay },
         clockOut: { $exists: false }
      });

      if (existing) {
         return res.status(400).json({ success: false, message: 'Employee is already clocked in today' });
      }

      const attendance = await Attendance.create({
         employee: employeeId,
         clockIn: Date.now(),
         status: 'PRESENT'
      });

      res.status(201).json({
         success: true,
         message: 'Clock-in recorded successfully',
         data: attendance
      });
   } catch (error) {
      console.error('clockIn error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Clock out employee attendance
// @route   POST /api/staff/attendance/clock-out
// @access  Private (Admin / Sales / Warehouse)
exports.clockOut = async (req, res) => {
   try {
      const employeeId = req.body.employeeId || req.user._id;

      const activeAttendance = await Attendance.findOne({
         employee: employeeId,
         clockOut: { $exists: false }
      }).sort({ clockIn: -1 });

      if (!activeAttendance) {
         return res.status(404).json({ success: false, message: 'No active clock-in session found for employee' });
      }

      const clockOutTime = new Date();
      const durationHours = (clockOutTime - new Date(activeAttendance.clockIn)) / (1000 * 60 * 60);

      activeAttendance.clockOut = clockOutTime;
      activeAttendance.workHours = parseFloat(durationHours.toFixed(2));
      await activeAttendance.save();

      res.status(200).json({
         success: true,
         message: 'Clock-out recorded successfully',
         data: activeAttendance
      });
   } catch (error) {
      console.error('clockOut error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Get attendance records
// @route   GET /api/staff/attendance
// @access  Private (Admin / Sales / Warehouse)
exports.getAttendance = async (req, res) => {
   try {
      const { employeeId } = req.query;
      const query = {};

      if (employeeId) query.employee = employeeId;

      const records = await Attendance.find(query)
         .populate('employee', 'name email role employeeId')
         .sort({ clockIn: -1 })
         .limit(50);

      res.status(200).json({
         success: true,
         count: records.length,
         data: records
      });
   } catch (error) {
      console.error('getAttendance error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Get employee shift schedules
// @route   GET /api/staff/shifts
// @access  Private (Admin / Sales / Warehouse)
exports.getShifts = async (req, res) => {
   try {
      const { employeeId, status } = req.query;
      const query = {};

      if (employeeId) query.employee = employeeId;
      if (status) query.status = status;

      const shifts = await Shift.find(query)
         .populate('employee', 'name email role employeeId')
         .populate('createdBy', 'name')
         .sort({ date: 1, startTime: 1 });

      res.status(200).json({
         success: true,
         count: shifts.length,
         data: shifts
      });
   } catch (error) {
      console.error('getShifts error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Schedule employee shift
// @route   POST /api/staff/shifts
// @access  Private (Admin)
exports.createShift = async (req, res) => {
   try {
      const { employeeId, date, startTime, endTime, role, notes } = req.body;

      if (!employeeId || !date || !startTime || !endTime) {
         return res.status(400).json({ success: false, message: 'Employee, date, start time, and end time are required' });
      }

      const employee = await User.findById(employeeId);
      if (!employee) {
         return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const shift = await Shift.create({
         employee: employee._id,
         date,
         startTime,
         endTime,
         role: role || employee.role.toUpperCase(),
         createdBy: req.user ? req.user._id : null,
         notes: notes || ''
      });

      res.status(201).json({
         success: true,
         message: 'Shift scheduled successfully',
         data: shift
      });
   } catch (error) {
      console.error('createShift error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Update shift schedule
// @route   PUT /api/staff/shifts/:id
// @access  Private (Admin)
exports.updateShift = async (req, res) => {
   try {
      const shift = await Shift.findById(req.params.id);
      if (!shift) {
         return res.status(404).json({ success: false, message: 'Shift not found' });
      }

      const fields = ['date', 'startTime', 'endTime', 'role', 'status', 'notes'];
      fields.forEach(f => {
         if (req.body[f] !== undefined) shift[f] = req.body[f];
      });

      await shift.save();

      res.status(200).json({
         success: true,
         message: 'Shift schedule updated',
         data: shift
      });
   } catch (error) {
      console.error('updateShift error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};
