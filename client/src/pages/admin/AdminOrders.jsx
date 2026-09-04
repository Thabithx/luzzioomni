import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Eye, Search, X, Package, MapPin, CreditCard, Clock, Printer, CheckSquare, Square } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SRI_LANKA_LOCATIONS } from '../../constants/sl-locations';

const STATUS_COLORS = {
   'draft': 'bg-gray-100 text-gray-800 border-gray-200',
   'pending': 'bg-amber-100 text-amber-800 border-amber-200',
   'paid': 'bg-emerald-100 text-emerald-800 border-emerald-200',
   'processing': 'bg-blue-100 text-blue-800 border-blue-200',
   'packaged': 'bg-purple-100 text-purple-800 border-purple-200',
   'out for delivery': 'bg-cyan-100 text-cyan-800 border-cyan-200',
   'delivered': 'bg-green-100 text-green-800 border-green-200',
   'completed': 'bg-black text-white border-black',
   'cancelled': 'bg-red-100 text-red-800 border-red-200',
   'returned': 'bg-rose-100 text-rose-800 border-rose-200'
};

const OrderDetailsModal = ({ isOpen, onClose, order, onTrackingUpdate, onAddressUpdate }) => {
   const [trackingNum, setTrackingNum] = useState('');
   const [editingAddress, setEditingAddress] = useState(false);
   const [addressData, setAddressData] = useState({});

   useEffect(() => {
      if (order) {
         setTrackingNum(order.trackingNumber || '');
         setAddressData({
            firstName: order.shippingAddress.firstName || '',
            lastName: order.shippingAddress.lastName || '',
            address: order.shippingAddress.address || '',
            city: order.shippingAddress.city || '',
            phone: order.shippingAddress.phone || '',
            phone2: order.shippingAddress.phone2 || ''
         });
      }
   }, [order]);

   if (!isOpen || !order) return null;

   const handleSaveAddress = () => {
      onAddressUpdate(order._id, addressData);
      setEditingAddress(false);
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
         <div className="bg-white w-full max-w-3xl max-h-[95vh] overflow-y-auto border border-black shadow-2xl">
            <div className="p-8 bg-black flex justify-between items-center sticky top-0 z-10">
               <div className="space-y-1">
                  <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em]">Acquisition Sequence Audit</p>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">Sequence Audit</h2>
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">UUID: {order._id.toUpperCase()}</p>
               </div>
               <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors">
                  <X size={20} />
               </button>
            </div>

            <div className="p-10 space-y-12">
               {/* Order Status & Info */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-3">
                     <p className="text-small-brand text-gray-400 flex items-center gap-2">
                        <Clock size={12} strokeWidth={2.5} /> Current Status
                     </p>
                     <p className="text-sm font-black uppercase tracking-widest bg-brand-grey inline-block px-3 py-1 border border-black">{order.status}</p>
                  </div>
                  <div className="space-y-3">
                     <p className="text-small-brand text-gray-400 flex items-center gap-2">
                        <CreditCard size={12} strokeWidth={2.5} /> Settlement Method
                     </p>
                     <p className="text-sm font-black uppercase tracking-widest">{order.paymentMethod}</p>
                  </div>
                  <div className="space-y-3">
                     <p className="text-small-brand text-gray-400 flex items-center gap-2">
                        <MapPin size={12} strokeWidth={2.5} /> Destination Logic
                     </p>
                     <p className="text-sm font-black uppercase leading-tight">
                        {order.shippingAddress.city}
                     </p>
                  </div>
                  <div className="space-y-3">
                     <p className="text-small-brand text-gray-400 flex items-center gap-2">
                        <Clock size={12} strokeWidth={2.5} /> Creation Timestamp
                     </p>
                     <p className="text-sm font-black uppercase tracking-widest text-brand-accent">
                        {new Date(order.createdAt).toLocaleDateString('en-GB')} {new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                     </p>
                  </div>
               </div>

               {/* TRACKING MANAGEMENT (ORDER LEVEL) */}
               <div className="p-6 bg-brand-grey border border-black space-y-4">
                  <p className="text-small-brand text-gray-400">Logistics Tracking Protocol</p>
                  <div className="flex gap-2">
                     <input
                        type="text"
                        placeholder="ENTER MASTER TRACKING SEQUENCE..."
                        value={trackingNum}
                        onChange={(e) => setTrackingNum(e.target.value)}
                        className="flex-1 text-[11px] font-black tracking-widest bg-white border border-black px-4 py-3 focus:outline-none uppercase"
                     />
                     <button
                        onClick={() => onTrackingUpdate(order._id, trackingNum)}
                        className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest border border-black hover:bg-white hover:text-black transition-all"
                     >
                        Register Sequence
                     </button>
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">
                     * Assigning a tracking sequence will dispatch a notification protocol to the client.
                  </p>
               </div>

               {order.fadar_order_id && (
                  <div className="p-6 bg-green-50 border border-green-600">
                     <p className="text-[9px] text-green-600 font-black uppercase tracking-[0.2em] mb-2">Fadar Integration Status: ACTIVE</p>
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-small-brand text-gray-500">Fadar Sequence ID</p>
                           <p className="text-lg font-black uppercase tracking-tighter text-black">{order.fadar_order_id}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-green-700 font-bold uppercase tracking-widest">Courier Dispatch Logic Synchronized</p>
                        </div>
                     </div>
                  </div>
               )}



               {/* Client Registry Info (EDITABLE) */}
               <div className="p-8 bg-brand-grey border border-black relative">
                  <div className="flex justify-between items-center mb-4">
                     <p className="text-small-brand text-gray-400">Client Registry Reference</p>
                     <button
                        onClick={() => setEditingAddress(!editingAddress)}
                        className="text-[9px] font-black uppercase tracking-widest text-black underline hover:text-gray-600"
                     >
                        {editingAddress ? 'Cancel Protocol' : 'Edit Protocol'}
                     </button>
                  </div>

                  {editingAddress ? (
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <Input
                              placeholder="First Name"
                              value={addressData.firstName}
                              onChange={(e) => setAddressData({ ...addressData, firstName: e.target.value })}
                              className="rounded-none border-black focus:border-black bg-white"
                           />
                           <Input
                              placeholder="Last Name"
                              value={addressData.lastName}
                              onChange={(e) => setAddressData({ ...addressData, lastName: e.target.value })}
                              className="rounded-none border-black focus:border-black bg-white"
                           />
                        </div>
                        <Input
                           placeholder="Address Line"
                           value={addressData.address}
                           onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                           className="rounded-none border-black focus:border-black bg-white"
                        />

                        {/* REPLACEMENT: City Dropdown */}
                        <div className="relative">
                           <select
                              value={addressData.city}
                              onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                              className="w-full text-sm p-3 border border-black bg-white focus:outline-none appearance-none rounded-none font-medium"
                           >
                              <option value="">Select City (Required for Courier)</option>
                              {SRI_LANKA_LOCATIONS.sort().map((city) => (
                                 <option key={city} value={city}>{city}</option>
                              ))}
                           </select>
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <MapPin size={14} className="text-gray-400" />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <Input
                              placeholder="Primary Phone"
                              value={addressData.phone}
                              onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                              className="rounded-none border-black focus:border-black bg-white"
                           />
                           <Input
                              placeholder="Secondary Phone"
                              value={addressData.phone2}
                              onChange={(e) => setAddressData({ ...addressData, phone2: e.target.value })}
                              className="rounded-none border-black focus:border-black bg-white"
                           />
                        </div>
                        <div className="flex justify-end pt-2">
                           <button
                              onClick={handleSaveAddress}
                              className="px-6 py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black border border-black transition-all"
                           >
                              Update Registry
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="flex flex-col md:flex-row md:items-center gap-10 transition-all">
                        <div>
                           <p className="text-sm font-black uppercase tracking-tighter">
                              {order.shippingAddress?.firstName && order.shippingAddress?.lastName
                                 ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
                                 : 'GUEST CLIENT'}
                           </p>
                           <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                              {order.email || 'UNIDENTIFIED'}
                           </p>
                        </div>
                        <div className="md:border-l border-black md:pl-10">
                           <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest leading-relaxed">
                              {order.shippingAddress.address} <br />
                              <span className="text-black font-bold">{order.shippingAddress.city}</span>
                           </p>
                           <div className="flex flex-col gap-1 mt-2">
                              <p className="text-[10px] text-black font-black uppercase tracking-widest">
                                 Phone: {order.shippingAddress.phone}
                              </p>
                              {order.shippingAddress.phone2 && (
                                 <p className="text-[10px] text-black font-black uppercase tracking-widest bg-yellow-400 inline-block px-1 w-fit">
                                    Alt: {order.shippingAddress.phone2}
                                 </p>
                              )}
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Archive Items */}
               <div>
                  <p className="text-small-brand text-gray-400 mb-6">Archive Components</p>
                  <div className="border border-black divide-y divide-black">
                     {order.orderItems.map((item, i) => (
                        <div key={i} className="flex p-6 gap-6 items-center hover:bg-brand-grey transition-colors">
                           <div className="w-16 aspect-[3/4] bg-white border border-black overflow-hidden shrink-0 shadow-sm">
                              <img src={item.image} alt="" className="w-full h-full object-cover" style={{ filter: 'none' }} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-black uppercase tracking-tight truncate">{item.name}</p>
                              <div className="flex items-center gap-4 mt-1">
                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">VOL: {item.size}</p>
                                 <span className="text-gray-300">|</span>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">QTY: {item.qty} UNITS</p>
                              </div>
                           </div>
                           <p className="text-sm font-black text-black">LKR {(item.price * item.qty).toLocaleString()}.00</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Financial Settlement */}
               <div className="border-t border-black pt-10 flex justify-between items-end">
                  <div className="space-y-1">
                     <p className="text-small-brand text-gray-400">Total Settlement Value</p>
                     <p className="text-[10px] text-gray-300 font-bold uppercase">Incl. Digital VAT & Logistics</p>
                  </div>
                  <div className="text-4xl font-black tracking-tighter text-black">LKR {order.totalPrice.toLocaleString()}.00</div>
               </div>
            </div>
         </div>
      </div >
   );
};

// THABITH SRIHARAN: Customer order management - supports both ONLINE and POS channels.
const AdminOrders = () => {
   const [orders, setOrders] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [channelFilter, setChannelFilter] = useState(''); // '' | 'ONLINE' | 'POS'
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedOrder, setSelectedOrder] = useState(null);
   const [selectedIds, setSelectedIds] = useState([]);
   const [parcelWeights, setParcelWeights] = useState({});
   const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
   const [searchParams] = useSearchParams();
   const { token } = useAuth();

   const fetchOrders = async (page = 1) => {
      try {
         setLoading(true);
         const channelParam = channelFilter ? `&channel=${channelFilter}` : '';
         const res = await api.get(`/orders?page=${page}&limit=20&excludeStatus=draft${channelParam}`);
         setOrders(res.data.data);
         setPagination({
            page: res.data.page,
            pages: res.data.pages,
            total: res.data.count
         });
      } catch (err) {
         console.error('Error fetching orders:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (token) fetchOrders();
   }, [token, channelFilter]);

   // Deep Linking: Auto-open specific order modal if passed via URL
   useEffect(() => {
      const orderId = searchParams.get('order');
      if (orderId && orders.length > 0) {
         const order = orders.find(o => o._id === orderId);
         if (order) {
            setSelectedOrder(order);
            setIsModalOpen(true);
         }
      }
   }, [searchParams, orders]);

   const handleTrackingUpdate = async (orderId, trackingNumber) => {
      try {
         await api.put(`/orders/${orderId}/tracking`, { trackingNumber });
         fetchOrders(pagination.page);
         // Optionally update the selected order state to reflect changes without closing modal if needed
         const res = await api.get(`/orders?page=${pagination.page}&limit=20&excludeStatus=draft`);
         const updatedOrder = res.data.data.find(o => o._id === orderId);
         setSelectedOrder(updatedOrder);
      } catch (err) {
         console.error('Error updating tracking number:', err);
         alert('FAILED TO REGISTER TRACKING SEQUENCE.');
      }
   };

   const handleAddressUpdate = async (orderId, addressData) => {
      try {
         await api.put(`/orders/${orderId}/address`, addressData);
         fetchOrders(pagination.page);

         // Update local selectedOrder to reflect changes immediately
         const res = await api.get(`/orders?page=${pagination.page}&limit=20&excludeStatus=draft`);
         const updatedOrder = res.data.data.find(o => o._id === orderId);
         setSelectedOrder(updatedOrder);

         alert('Address protocol updated successfully.');
      } catch (err) {
         console.error('Error updating address:', err);
         alert('FAILED TO UPDATE REGISTRY: ' + (err.response?.data?.message || err.message));
      }
   };

   const handleStatusUpdate = async (id, status, oldStatus) => {
      try {
         const weight = parcelWeights[id] || 1;

         if (oldStatus !== 'processing' && status === 'processing') {
            // Call Fadar API
            try {
               const res = await api.post('/fadar/create-parcel', {
                  orderId: id,
                  parcel_weight: weight,
                  newStatus: status,
                  oldStatus: oldStatus
               });
               alert(`Fadar Parcel Created: ${res.data.data.fadar_order_id || 'Success'}`);
            } catch (fadarErr) {
               const errorMsg = fadarErr.response?.data?.message || 'Fadar API Connection Failed.';
               const apiDetail = fadarErr.response?.data?.error?.message || '';
               // If error object is passed, try to stringify it if it's an object
               const detailStr = typeof apiDetail === 'object' ? JSON.stringify(apiDetail) : apiDetail;

               const debugInfo = fadarErr.response?.data?.debugParams
                  ? `\n\n[DEBUG INFO]\nOID: ${fadarErr.response.data.debugParams.order_id}\nCITY: "${fadarErr.response.data.debugParams.recipient_city}"\nAMT: ${fadarErr.response.data.debugParams.amount}\nTEL: ${fadarErr.response.data.debugParams.recipient_contact_1}\nNAME: ${fadarErr.response.data.debugParams.recipient_name}`
                  : '';

               alert(`COURIER SYNC FAILED: ${errorMsg} ${detailStr ? `(${detailStr})` : ''}${debugInfo}`);
               return; // Halt status update if courier sync fails
            }
         } else {
            // Normal status update
            await api.put(`/orders/${id}/status`, { status });
         }
         fetchOrders(pagination.page);
      } catch (err) {
         console.error('Error updating order status:', err);
         alert(err.response?.data?.message || 'Error updating status');
      }
   };

   const filteredOrders = orders.filter(order =>
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const toggleSelectAll = () => {
      if (selectedIds.length === filteredOrders.length) {
         setSelectedIds([]);
      } else {
         setSelectedIds(filteredOrders.map(o => o._id));
      }
   };

   const toggleSelectOne = (id) => {
      setSelectedIds(prev =>
         prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
   };

   const handlePrint = () => {
      window.print();
   };

   const handleBulkStatusUpdate = async (status) => {
      if (selectedIds.length === 0) return;

      const confirmMsg = `Update ${selectedIds.length} orders to ${status.toUpperCase()}?`;
      if (!window.confirm(confirmMsg)) return;

      try {
         setLoading(true);
         const res = await api.put('/orders/batch-status', {
            ids: selectedIds,
            status: status,
            weights: parcelWeights
         });

         alert(res.data.message || `Successfully updated ${selectedIds.length} orders.`);
         setSelectedIds([]);
         fetchOrders(pagination.page);
      } catch (err) {
         console.error('Error in bulk status update:', err);
         alert(err.response?.data?.message || 'Failed to update orders in bulk.');
      } finally {
         setLoading(false);
      }
   };

   if (loading) return (
      <div className="flex items-center justify-center min-h-[400px]">
         <p className="text-small-brand text-gray-400 animate-pulse tracking-[0.5em] font-black uppercase">Syncing Order Archive...</p>
      </div>
   );
   return (
      <div className="space-y-12 pb-40 print:space-y-0 print:pb-0">
         <div className="print:hidden space-y-12">
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-black pb-8 gap-8">
               <div className="space-y-4">
                  <p className="text-small-brand text-gray-400">Digital Logistics</p>
                  <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">Order Fulfillment</h1>
                  <Link
                     to="/admin/orders/drafts"
                     className="mt-4 px-6 py-2 bg-brand-grey border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all w-fit block"
                  >
                     View Draft Orders
                  </Link>
               </div>
               <div className="flex items-center justify-between md:justify-end gap-4">
                  {selectedIds.length > 0 && (
                     <div className="flex items-center gap-3">
                        <select
                           onChange={(e) => {
                              if (e.target.value) {
                                 handleBulkStatusUpdate(e.target.value);
                                 e.target.value = ''; // Reset select
                              }
                           }}
                           className="bg-white text-black px-4 py-4 text-[10px] font-black uppercase tracking-widest border border-black focus:outline-none cursor-pointer appearance-none min-w-[180px]"
                        >
                           <option value="">BATCH ACTION</option>
                           <option value="draft">DRAFT</option>
                           <option value="pending">PENDING</option>
                           <option value="paid">PAID</option>
                           <option value="processing">PROCESSING</option>
                           <option value="packaged">PACKAGED</option>
                           <option value="out for delivery">OUT FOR DELIVERY</option>
                           <option value="delivered">DELIVERED</option>
                           <option value="completed">COMPLETED</option>
                           <option value="cancelled">CANCELLED</option>
                           <option value="returned">RETURNED</option>
                        </select>
                        <button
                           onClick={handlePrint}
                           className="bg-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest border border-black hover:bg-white hover:text-black transition-all flex items-center gap-3"
                        >
                           <Printer size={14} />
                           Print ({selectedIds.length})
                        </button>
                     </div>
                  )}
                  <div className="text-right space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-black">{pagination.total} Sequences</p>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Page {pagination.page} of {pagination.pages}</p>
                  </div>
               </div>
            </div>

            {/* Search bar */}
            <div className="w-full max-w-xl relative">
               <Input
                  placeholder="Identify sequence (ID, Client, Email)..."
                  className="pl-14 py-6 border-black focus:border-black rounded-none text-small-brand bg-brand-grey/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" size={18} />
            </div>

            {/* Omnicommerce Channel Filter */}
            <div className="flex items-center gap-2 mt-4">
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mr-2">Channel:</span>
               {['', 'ONLINE', 'POS'].map((ch) => (
                  <button
                     key={ch}
                     onClick={() => setChannelFilter(ch)}
                     className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-all ${
                        channelFilter === ch
                           ? 'bg-black text-white border-black'
                           : 'bg-white text-black border-black hover:bg-brand-grey'
                     }`}
                  >
                     {ch === '' ? 'All Orders' : ch}
                  </button>
               ))}
            </div>

            {/* Table Section */}
            <div className="bg-white border border-black">
               <div className="overflow-x-auto w-full max-w-full">
                  <table className="w-full text-left min-w-[1000px]">
                     <thead>
                        <tr className="bg-brand-grey border-b border-black">
                           <th className="px-8 py-5 w-10">
                              <button onClick={toggleSelectAll} className="text-black">
                                 {selectedIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                                    <CheckSquare size={16} strokeWidth={2.5} />
                                 ) : (
                                    <Square size={16} strokeWidth={2.5} />
                                 )}
                              </button>
                           </th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Sequence ID</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Client Entry</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Protocol Status</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Components</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Settlement</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Sequence Time</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black text-right">Audit</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-black">
                        {filteredOrders.map((order) => (
                           <tr key={order._id} className={cn("hover:bg-brand-grey transition-all group", selectedIds.includes(order._id) && "bg-brand-grey")}>
                              <td className="px-8 py-8">
                                 <button onClick={() => toggleSelectOne(order._id)} className="text-black/20 group-hover:text-black">
                                    {selectedIds.includes(order._id) ? (
                                       <CheckSquare size={16} strokeWidth={2.5} className="text-black" />
                                    ) : (
                                       <Square size={16} strokeWidth={2.5} />
                                    )}
                                 </button>
                              </td>
                              <td className="px-8 py-8">
                                 <div className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                                    {order.orderNumber || `LU-${order._id.slice(-8).toUpperCase()}`}
                                 </div>
                                 <span className={`inline-block mt-1 px-2 py-0.5 text-[8px] font-black uppercase border ${
                                    order.channel === 'POS'
                                       ? 'bg-black text-white border-black'
                                       : 'bg-brand-grey text-black border-gray-400'
                                 }`}>
                                    {order.channel || 'ONLINE'}
                                 </span>
                              </td>
                              <td className="px-8 py-8">
                                 <div className="text-[11px] font-black uppercase tracking-tight">{order.shippingAddress?.firstName && order.shippingAddress?.lastName ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` : 'GUEST CLIENT'}</div>
                                 <div className="text-[9px] text-gray-400 uppercase tracking-widest mt-1 font-bold">{order.email || 'N/A'}</div>
                              </td>
                              <td className="px-8 py-8">
                                 <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                       <div className={cn(
                                          "px-3 py-1 text-[9px] font-black uppercase tracking-widest border",
                                          STATUS_COLORS[order.status] || 'bg-gray-100'
                                       )}>
                                          {order.status}
                                       </div>
                                       <select
                                          value={order.status}
                                          onChange={(e) => handleStatusUpdate(order._id, e.target.value, order.status)}
                                          className="text-[9px] font-black uppercase tracking-widest bg-white border border-black px-3 py-1.5 focus:border-black focus:ring-0 appearance-none rounded-none w-24 h-[26px]"
                                       >
                                          <option value="draft">DRAFT</option>
                                          <option value="pending">PENDING</option>
                                          <option value="paid">PAID</option>
                                          <option value="processing">PROCESSING</option>
                                          <option value="packaged">PACKAGED</option>
                                          <option value="out for delivery">OUT FOR DELIVERY</option>
                                          <option value="delivered">DELIVERED</option>
                                          <option value="completed">COMPLETED</option>
                                          <option value="cancelled">CANCELLED</option>
                                          <option value="returned">RETURNED</option>
                                       </select>
                                    </div>
                                    {order.status !== 'processing' && !order.fadar_order_id && (
                                       <div className="flex items-center gap-2">
                                          <span className="text-[9px] font-black text-gray-400 w-12">WT (KG):</span>
                                          <input
                                             type="number"
                                             step="0.1"
                                             min="0.1"
                                             value={parcelWeights[order._id] || 1}
                                             onChange={(e) => setParcelWeights({ ...parcelWeights, [order._id]: e.target.value })}
                                             className="text-[9px] font-black bg-white border border-black px-3 py-1.5 focus:outline-none w-24"
                                             placeholder="1.0"
                                          />
                                       </div>
                                    )}
                                    {order.fadar_order_id && (
                                       <div className="text-[8px] font-black text-green-600 uppercase tracking-tighter">
                                          Fadar ID: {order.fadar_order_id}
                                       </div>
                                    )}
                                 </div>
                              </td>
                              <td className="px-8 py-8 text-[11px] font-black uppercase tracking-widest text-gray-400">
                                 {order.orderItems?.length} Products
                              </td>
                              <td className="px-8 py-8 text-[11px] font-black text-black">LKR {order.totalPrice.toLocaleString()}.00</td>
                              <td className="px-8 py-8">
                                 <div className="text-[11px] font-black uppercase tracking-tight text-brand-accent">
                                    {new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                 </div>
                                 <div className="text-[9px] text-gray-400 uppercase tracking-widest mt-1 font-bold">
                                    {new Date(order.createdAt).toLocaleDateString('en-GB')}
                                 </div>
                              </td>
                              <td className="px-8 py-8 text-right">
                                 <div className="flex justify-end gap-1">
                                    <button
                                       className="p-3 text-black/30 hover:text-black hover:bg-white border border-transparent hover:border-black transition-all"
                                       onClick={() => {
                                          setSelectedOrder(order);
                                          setIsModalOpen(true);
                                       }}
                                    >
                                       <Eye size={16} strokeWidth={1.5} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               {/* PAGINATION CONTROLS */}
               <div className="flex justify-between items-center p-6 border-t border-black bg-white">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                     Showing {orders.length} of {pagination.total} Sequences
                  </div>
                  <div className="flex gap-4">
                     <button
                        onClick={() => fetchOrders(Math.max(1, pagination.page - 1))}
                        disabled={pagination.page === 1}
                        className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
                     >
                        Previous
                     </button>
                     <div className="flex items-center px-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-black">Page {pagination.page}</span>
                     </div>
                     <button
                        onClick={() => fetchOrders(Math.min(pagination.pages, pagination.page + 1))}
                        disabled={pagination.page === pagination.pages}
                        className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
                     >
                        Next
                     </button>
                  </div>
               </div>
            </div>
         </div>

         <OrderDetailsModal
            isOpen={isModalOpen}
            onClose={() => {
               setIsModalOpen(false);
               setSelectedOrder(null);
            }}
            order={selectedOrder}
            onTrackingUpdate={handleTrackingUpdate}
            onAddressUpdate={handleAddressUpdate}
         />
         {/* PRINTABLE AREA - SHOPIFY STYLE */}
         <div className="hidden print:block">
            <style>
               {`
               @media print {
                  @page {
                     size: A4;
                     margin: 0; /* Suppress browser headers/footers */
                  }
                  html, body {
                     margin: 0 !important;
                     padding: 0 !important;
                     height: auto !important;
                     overflow: visible !important;
                     background: white !important;
                  }
                  #printable-registry {
                     width: 100% !important;
                     padding: 1.5cm !important; /* Move margin into padding */
                     background: white !important;
                     color: #000;
                     font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
                  }
                  .label-body {
                     width: 100%;
                     page-break-inside: avoid;
                     page-break-after: always;
                     margin-bottom: 2cm;
                     text-align: left;
                  }
                  .label-body:last-child {
                     page-break-after: avoid !important;
                     margin-bottom: 0 !important;
                  }
                  
                  /* HEADER */
                  .print-header {
                     margin-bottom: 30px;
                  }
                  .print-order-id {
                     font-size: 16pt;
                     font-weight: 700;
                     margin-bottom: 5px;
                     color: #000;
                  }
                  .print-date {
                     font-size: 11pt;
                     font-weight: 500;
                     color: #000;
                  }

                  /* ADDRESS COLUMNS */
                  .columns {
                     display: flex;
                     width: 100%;
                     margin-bottom: 30px;
                     border-bottom: 1px solid #ccc;
                     padding-bottom: 30px;
                  }
                  .address-column {
                     width: 50%;
                  }
                  .address-column h3 {
                     font-size: 10pt;
                     font-weight: 700;
                     text-transform: capitalize;
                     margin: 0 0 10px 0;
                  }
                  .address-lines {
                     font-size: 10pt;
                     line-height: 1.4;
                  }
                  .store-name {
                     font-weight: 900;
                     text-transform: uppercase;
                  }

                  /* ORDER TABLE */
                  .label-h2 {
                     font-size: 11pt;
                     font-weight: 700;
                     text-transform: capitalize;
                     margin: 0 0 15px 0;
                  }
                  table {
                     width: 100%;
                     border-collapse: collapse;
                     margin-bottom: 30px;
                     border: 1px solid #ccc;
                  }
                  th {
                     text-align: left;
                     font-size: 9pt;
                     font-weight: 600;
                     border-bottom: 1px solid #ccc;
                     padding: 10px 12px;
                     background: #fafafa;
                  }
                  td {
                     padding: 12px;
                     border-bottom: 1px solid #eee;
                     vertical-align: top;
                     font-size: 10pt;
                  }
                  .qty-col { width: 10%; }
                  .item-col { width: 90%; }
                  
                  /* FOOTER */
                  .footer-note {
                     text-align: center;
                     font-size: 8pt;
                     margin-top: 50px;
                     line-height: 1.5;
                  }
               }
               `}
            </style>
            <div id="printable-registry">
               {orders.filter(o => selectedIds.includes(o._id)).map((order, idx) => (
                  <div key={order._id} className={cn("label-body", idx < selectedIds.length - 1 && "print-page-break")}>
                     {/* Header: Only Order ID and Date on Right */}
                     <div className="print-header">
                        <div className="order-meta">
                           <div className="print-order-id">Order #{order._id.slice(-6).toUpperCase()}</div>
                           <div className="print-date">
                              {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                           </div>
                        </div>
                     </div>

                     {/* Addresses: From (Left) - Ship To (Right) */}
                     <div className="columns">
                        <div className="address-column">
                           <h3>From</h3>
                           <div className="address-lines">
                              <div className="store-name">LUZZIO</div>
                              Anuradhapura<br />
                              NEW BUS STAND LATEST<br />
                              SMART NEAR TO BOC BANK<br />
                              Anuradhapura, 50000<br />
                              Sri Lanka<br />
                              Phone: 0764800541
                           </div>
                        </div>
                        <div className="address-column">
                           <h3>Ship to</h3>
                           <div className="address-lines">
                              <div className="store-name">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</div>
                              {order.shippingAddress.address}<br />
                              {order.shippingAddress.city}<br />
                              {order.shippingAddress.country || 'Sri Lanka'}<br />
                              {order.shippingAddress.phone && `Phone: ${order.shippingAddress.phone}`}
                              {order.shippingAddress.phone2 && <><br />Secondary Phone: {order.shippingAddress.phone2}</>}
                              {!order.shippingAddress.phone && (
                                 (order.user && order.user.phone) ? `Phone: ${order.user.phone}` : `Email: ${order.email}`
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Order Details */}
                     <h2 className="label-h2">Order Details</h2>
                     <table>
                        <thead>
                           <tr>
                              <th className="qty-col">Qty</th>
                              <th className="item-col">Item</th>
                           </tr>
                        </thead>
                        <tbody>
                           {order.orderItems.map((item, i) => (
                              <tr key={i}>
                                 <td className="qty-col">{item.qty}</td>
                                 <td className="item-col">
                                    <div style={{ fontWeight: '600' }}>{item.name} {item.size && `- ${item.size}`}</div>
                                    <div style={{ fontSize: '9pt', marginTop: '2px', color: '#555' }}>
                                       {/* Optional: Add SKU if available */}
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>

                     {/* Footer */}
                     <div className="footer-note">
                        www.luzzioclothing.com<br />
                        For exchanges kindly contact our WhatsApp – 0781423168<br />
                        DM us at @luzziopremium
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
};

export default AdminOrders;
