// MAHATHIR
// Staff management dashboard: employee profiles, RBAC roles (ADMIN, SALES, WAREHOUSE),
// daily attendance clock-in / clock-out tracking, and shift scheduling.

import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, Calendar, Plus, RefreshCw, X, Shield, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminStaff() {
   const { user } = useAuth();
   const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'attendance' | 'shifts'
   const [staff, setStaff] = useState([]);
   const [attendance, setAttendance] = useState([]);
   const [shifts, setShifts] = useState([]);
   const [loading, setLoading] = useState(false);

   // Modals
   const [showStaffModal, setShowStaffModal] = useState(false);
   const [showShiftModal, setShowShiftModal] = useState(false);

   // Staff Form
   const [staffForm, setStaffForm] = useState({
      name: '',
      email: '',
      password: '',
      role: 'sales',
      employeeId: '',
      phone: '',
      address: ''
   });

   // Shift Form
   const [shiftForm, setShiftForm] = useState({
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      role: 'SALES',
      notes: ''
   });

   const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
      fetchStaffData();
   }, [activeTab]);

   const fetchStaffData = async () => {
      setLoading(true);
      try {
         if (activeTab === 'directory') {
            const res = await api.get('/staff');
            setStaff(res.data.data || []);
         } else if (activeTab === 'attendance') {
            const res = await api.get('/staff/attendance');
            setAttendance(res.data.data || []);
         } else if (activeTab === 'shifts') {
            const res = await api.get('/staff/shifts');
            setShifts(res.data.data || []);
         }
      } catch (err) {
         console.error('Fetch staff data error:', err);
      } finally {
         setLoading(false);
      }
   };

   // Attendance Actions
   const handleClockIn = async () => {
      try {
         await api.post('/staff/attendance/clock-in', {});
         alert('Clock In Successful!');
         fetchStaffData();
      } catch (err) {
         alert(err.response?.data?.message || 'Clock In failed');
      }
   };

   const handleClockOut = async () => {
      try {
         await api.post('/staff/attendance/clock-out', {});
         alert('Clock Out Successful!');
         fetchStaffData();
      } catch (err) {
         alert(err.response?.data?.message || 'Clock Out failed');
      }
   };

   // Form Submissions
   const handleStaffSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
         await api.post('/staff', staffForm);
         setShowStaffModal(false);
         setStaffForm({ name: '', email: '', password: '', role: 'sales', employeeId: '', phone: '', address: '' });
         fetchStaffData();
      } catch (err) {
         alert(err.response?.data?.message || 'Failed to create staff member');
      } finally {
         setSubmitting(false);
      }
   };

   const handleShiftSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
         await api.post('/staff/shifts', shiftForm);
         setShowShiftModal(false);
         fetchStaffData();
      } catch (err) {
         alert(err.response?.data?.message || 'Failed to schedule shift');
      } finally {
         setSubmitting(false);
      }
   };

   return (
      <div className="space-y-8">
         {/* Page Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black text-white p-8">
            <div>
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Human Resources & Operations</span>
               <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Staff Management & Shifts</h1>
            </div>
            
            {/* Quick Attendance Control for logged-in cashier */}
            <div className="flex items-center gap-3 bg-gray-900 p-3 border border-gray-800">
               <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Attendance:</span>
               <Button onClick={handleClockIn} className="bg-green-600 text-white text-[9px] font-black uppercase px-3 py-1.5 hover:bg-green-700">
                  Clock In
               </Button>
               <Button onClick={handleClockOut} className="bg-red-600 text-white text-[9px] font-black uppercase px-3 py-1.5 hover:bg-red-700">
                  Clock Out
               </Button>
            </div>
         </div>

         {/* Navigation Tabs */}
         <div className="flex border-b border-black gap-4">
            <button
               onClick={() => setActiveTab('directory')}
               className={`pb-3 text-xs font-black uppercase tracking-wider ${activeTab === 'directory' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-black'}`}
            >
               <UserCheck size={14} className="mr-2 inline" /> Staff Directory
            </button>
            <button
               onClick={() => setActiveTab('attendance')}
               className={`pb-3 text-xs font-black uppercase tracking-wider ${activeTab === 'attendance' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-black'}`}
            >
               <Clock size={14} className="mr-2 inline" /> Attendance Logs
            </button>
            <button
               onClick={() => setActiveTab('shifts')}
               className={`pb-3 text-xs font-black uppercase tracking-wider ${activeTab === 'shifts' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-black'}`}
            >
               <Calendar size={14} className="mr-2 inline" /> Shift Schedules
            </button>
         </div>

         {/* Tab 1: Staff Directory */}
         {activeTab === 'directory' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest">Active Employee Roster</h3>
                  <Button onClick={() => setShowStaffModal(true)} className="bg-black text-white text-xs font-black uppercase px-6 py-2.5">
                     <Plus size={14} className="mr-2 inline" /> Register Staff Member
                  </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                     <div className="col-span-full py-20 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                        Loading Staff Directory...
                     </div>
                  ) : staff.length === 0 ? (
                     <div className="col-span-full py-20 text-center text-gray-400 text-xs font-black uppercase tracking-widest border border-dashed border-black">
                        No Staff Accounts Found
                     </div>
                  ) : (
                     staff.map((s) => (
                        <div key={s._id} className="bg-white border border-black p-6 space-y-4 hover:shadow-lg transition-all">
                           <div className="flex justify-between items-start border-b border-black pb-3">
                              <div>
                                 <h4 className="text-sm font-black uppercase">{s.name}</h4>
                                 <p className="text-[9px] font-mono text-gray-500">ID: {s.employeeId || 'N/A'}</p>
                              </div>
                              <span className={`px-2.5 py-1 text-[8px] font-black uppercase border ${
                                 s.role === 'admin'
                                    ? 'bg-black text-white border-black'
                                    : s.role === 'sales'
                                    ? 'bg-blue-100 border-blue-600 text-blue-700'
                                    : 'bg-purple-100 border-purple-600 text-purple-700'
                              }`}>
                                 {s.role}
                              </span>
                           </div>

                           <div className="space-y-1 text-xs font-mono text-gray-600">
                              <p>Email: {s.email}</p>
                              {s.phone && <p>Phone: {s.phone}</p>}
                              {s.joinedDate && <p className="text-[10px] text-gray-400">Joined: {new Date(s.joinedDate).toLocaleDateString()}</p>}
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>
         )}

         {/* Tab 2: Attendance Logs */}
         {activeTab === 'attendance' && (
            <div className="bg-white border border-black overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-black bg-brand-grey text-[9px] font-black uppercase tracking-[0.2em]">
                        <th className="p-4">Employee</th>
                        <th className="p-4">Clock In</th>
                        <th className="p-4">Clock Out</th>
                        <th className="p-4">Duration</th>
                        <th className="p-4">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs font-mono">
                     {loading ? (
                        <tr>
                           <td colSpan="5" className="p-12 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                              Loading Attendance Logs...
                           </td>
                        </tr>
                     ) : attendance.length === 0 ? (
                        <tr>
                           <td colSpan="5" className="p-12 text-center text-gray-400 font-black uppercase tracking-widest">
                              No Attendance Logs Found
                           </td>
                        </tr>
                     ) : (
                        attendance.map((a) => (
                           <tr key={a._id} className="hover:bg-gray-50">
                              <td className="p-4 font-sans font-black uppercase">
                                 {a.employee?.name || 'Staff Member'}
                                 <span className="block text-[9px] font-mono text-gray-400">{a.employee?.role}</span>
                              </td>
                              <td className="p-4">{new Date(a.clockIn).toLocaleString()}</td>
                              <td className="p-4">{a.clockOut ? new Date(a.clockOut).toLocaleString() : 'In Progress...'}</td>
                              <td className="p-4 font-bold">{a.workHours ? `${a.workHours} hrs` : 'Active'}</td>
                              <td className="p-4">
                                 <span className="px-2 py-0.5 text-[8px] font-black uppercase border border-green-600 bg-green-100 text-green-700">
                                    {a.status}
                                 </span>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         )}

         {/* Tab 3: Shift Schedules */}
         {activeTab === 'shifts' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest">Staff Shift Schedule</h3>
                  <Button onClick={() => setShowShiftModal(true)} className="bg-black text-white text-xs font-black uppercase px-6 py-2.5">
                     <Plus size={14} className="mr-2 inline" /> Schedule Shift
                  </Button>
               </div>

               <div className="bg-white border border-black overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="border-b border-black bg-brand-grey text-[9px] font-black uppercase tracking-[0.2em]">
                           <th className="p-4">Date</th>
                           <th className="p-4">Employee</th>
                           <th className="p-4">Shift Hours</th>
                           <th className="p-4">Role</th>
                           <th className="p-4">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200 text-xs font-mono">
                        {loading ? (
                           <tr>
                              <td colSpan="5" className="p-12 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                                 Loading Shift Schedules...
                              </td>
                           </tr>
                        ) : shifts.length === 0 ? (
                           <tr>
                              <td colSpan="5" className="p-12 text-center text-gray-400 font-black uppercase tracking-widest">
                                 No Shifts Scheduled
                              </td>
                           </tr>
                        ) : (
                           shifts.map((sh) => (
                              <tr key={sh._id} className="hover:bg-gray-50">
                                 <td className="p-4 font-bold">{new Date(sh.date).toLocaleDateString()}</td>
                                 <td className="p-4 font-sans font-black uppercase">{sh.employee?.name || 'Employee'}</td>
                                 <td className="p-4 font-mono font-bold">{sh.startTime} &mdash; {sh.endTime}</td>
                                 <td className="p-4">{sh.role}</td>
                                 <td className="p-4">
                                    <span className="px-2 py-0.5 text-[8px] font-black uppercase border border-black bg-brand-grey">
                                       {sh.status}
                                    </span>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* Create Staff Modal */}
         {showStaffModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black p-8 max-w-md w-full space-y-6">
                  <div className="flex justify-between items-center border-b border-black pb-4">
                     <h3 className="text-sm font-black uppercase tracking-widest">Register Staff User</h3>
                     <button onClick={() => setShowStaffModal(false)}><X size={18} /></button>
                  </div>

                  <form onSubmit={handleStaffSubmit} className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Full Name *</label>
                        <Input
                           type="text"
                           required
                           value={staffForm.name}
                           onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                        />
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Email Address *</label>
                        <Input
                           type="email"
                           required
                           value={staffForm.email}
                           onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                        />
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Password *</label>
                        <Input
                           type="password"
                           required
                           value={staffForm.password}
                           onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        />
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Role Permission *</label>
                        <select
                           value={staffForm.role}
                           onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                           className="w-full p-2.5 border border-black font-mono text-xs bg-white"
                        >
                           <option value="sales">SALES (POS & Customers Access)</option>
                           <option value="warehouse">WAREHOUSE (Stock & Suppliers Access)</option>
                           <option value="admin">ADMIN (Full Operational Access)</option>
                        </select>
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Phone Number</label>
                        <Input
                           type="tel"
                           value={staffForm.phone}
                           onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                        />
                     </div>

                     <div className="flex gap-4 pt-4 border-t border-black">
                        <Button type="submit" disabled={submitting} className="flex-1 bg-black text-white text-xs font-black uppercase py-3">
                           {submitting ? 'Creating...' : 'Register Staff'}
                        </Button>
                        <Button type="button" onClick={() => setShowStaffModal(false)} className="bg-brand-grey border border-black text-black text-xs font-black uppercase px-6">
                           Cancel
                        </Button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* Create Shift Modal */}
         {showShiftModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black p-8 max-w-md w-full space-y-6">
                  <div className="flex justify-between items-center border-b border-black pb-4">
                     <h3 className="text-sm font-black uppercase tracking-widest">Schedule Employee Shift</h3>
                     <button onClick={() => setShowShiftModal(false)}><X size={18} /></button>
                  </div>

                  <form onSubmit={handleShiftSubmit} className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Select Employee *</label>
                        <select
                           required
                           value={shiftForm.employeeId}
                           onChange={(e) => setShiftForm({ ...shiftForm, employeeId: e.target.value })}
                           className="w-full p-2.5 border border-black font-mono text-xs bg-white"
                        >
                           <option value="">-- Choose Staff Member --</option>
                           {staff.map(s => (
                              <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                           ))}
                        </select>
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Date *</label>
                        <Input
                           type="date"
                           required
                           value={shiftForm.date}
                           onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Start Time *</label>
                           <Input
                              type="time"
                              required
                              value={shiftForm.startTime}
                              onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">End Time *</label>
                           <Input
                              type="time"
                              required
                              value={shiftForm.endTime}
                              onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                           />
                        </div>
                     </div>

                     <div className="flex gap-4 pt-4 border-t border-black">
                        <Button type="submit" disabled={submitting} className="flex-1 bg-black text-white text-xs font-black uppercase py-3">
                           {submitting ? 'Scheduling...' : 'Save Shift'}
                        </Button>
                        <Button type="button" onClick={() => setShowShiftModal(false)} className="bg-brand-grey border border-black text-black text-xs font-black uppercase px-6">
                           Cancel
                        </Button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}
