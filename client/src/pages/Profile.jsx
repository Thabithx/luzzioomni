import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Package, MapPin, User as UserIcon, Clock, ChevronRight, LogOut } from 'lucide-react';
import Meta from '../components/ui/Meta';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const OrderDetailsModal = ({ isOpen, onClose, order, user }) => {
   if (!isOpen || !order) return null;

   const statuses = ['Pending', 'Processing', 'Packaged', 'Shipped', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled', 'Returned'];
   const currentStatusIndex = statuses.findIndex(s => s.toLowerCase() === order.status.toLowerCase());

   const statusSubtitles = {
      'Pending': 'Awaiting Initial Authorization',
      'Processing': 'Archive Retrieval in Progress',
      'Packaged': 'Awaiting Logistics Pickup',
      'Shipped': 'In Transit via Digital Courier',
      'Out for Delivery': 'Final Logistics Sequence Active',
      'Delivered': 'Protocol Successfully Terminated',
      'Completed': 'Archive Finalized',
      'Cancelled': 'Protocol Aborted',
      'Returned': 'Archive Re-entry Protocol'
   };

   return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
         <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-black shadow-2xl relative">
            {/* Header */}
            <div className="sticky top-0 bg-black text-white p-8 flex justify-between items-center z-10 border-b border-black">
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Sequence Audit</p>
                  <h2 className="text-2xl font-black uppercase tracking-tight">LU-{order._id.slice(-8).toUpperCase()}</h2>
                  <p className="text-[9px] font-bold text-white/30 tracking-widest uppercase">Registry Date: {new Date(order.createdAt).toLocaleDateString()}</p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/10 transition-colors">
                  <LogOut className="rotate-180" size={24} />
               </button>
            </div>

            <div className="p-10 space-y-12 pb-20">
               {/* Status Timeline */}
               <div className="space-y-10">
                  <div className="space-y-1">
                     <p className="text-small-brand text-gray-400 font-bold uppercase tracking-[0.2em]">Protocol Status</p>
                     <p className="text-[11px] font-black uppercase tracking-widest text-black">
                        {statusSubtitles[order.status] || order.status}
                     </p>
                  </div>
                  <div className="flex justify-between items-center relative gap-2">
                     <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-100 -z-10" />
                     {statuses.map((status, i) => {
                        const isCancelled = order.status.toLowerCase() === 'cancelled' && status.toLowerCase() === 'cancelled';
                        const isReturned = order.status.toLowerCase() === 'returned' && status.toLowerCase() === 'returned';
                        const isActive = i <= currentStatusIndex;

                        return (
                           <div key={status} className="flex flex-col items-center space-y-3 bg-white px-1 md:px-2">
                              <div className={`w-3 h-3 border border-black rotate-45 transition-all duration-1000
                                 ${isCancelled ? 'bg-red-600 border-red-600' :
                                    isReturned ? 'bg-blue-600 border-blue-600' :
                                       isActive ? 'bg-black' : 'bg-white'}`} />
                              <p className={`hidden md:block text-[8px] lg:text-[9px] font-black uppercase tracking-widest 
                                 ${isCancelled ? 'text-red-600' :
                                    isReturned ? 'text-blue-600' :
                                       isActive ? 'text-black' : 'text-gray-300'}`}>
                                 {status}
                              </p>
                           </div>
                        );
                     })}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Shipping Info */}
                  <div className="space-y-6">
                     <p className="text-small-brand text-gray-400 font-bold uppercase tracking-[0.2em]">Logistics Destination</p>
                     <div className="p-6 bg-brand-grey border border-black space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-tighter">{user.name}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed tracking-wider">
                           {order.shippingAddress.address}<br />
                           {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
                        </p>
                     </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-6">
                     <p className="text-small-brand text-gray-400 font-bold uppercase tracking-[0.2em]">Financial Audit</p>
                     <div className="space-y-3">
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400">
                           <span>Base Value</span>
                           <span>${order.totalPrice}.00</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400">
                           <span>Logistics Fee</span>
                           <span>Complimentary</span>
                        </div>
                        <div className="pt-3 border-t border-black flex justify-between text-xl font-black uppercase">
                           <span>Total Settlement</span>
                           <span>${order.totalPrice}.00</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Items */}
               <div className="space-y-6">
                  <p className="text-small-brand text-gray-400 font-bold uppercase tracking-[0.2em]">Archive Components</p>
                  <div className="border border-black divide-y divide-black">
                     {order.orderItems.map((item, i) => (
                        <div key={i} className="flex p-6 gap-6 items-center">
                           <div className="w-20 aspect-[3/4] bg-brand-grey border border-black overflow-hidden shrink-0">
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-black uppercase tracking-tight truncate">{item.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">VOL: {item.size} <span className="mx-2 text-gray-200">|</span> QTY: {item.qty} UNITS</p>
                           </div>
                           <p className="text-sm font-black text-black">${item.price * item.qty}.00</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export function Profile() {
   const [orders, setOrders] = useState([]);
   const [loading, setLoading] = useState(true);
   const [selectedOrder, setSelectedOrder] = useState(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [activeTab, setActiveTab] = useState('orders');
   const [searchParams] = useSearchParams();
   const { user, token, guestEmail, setGuestProfile, logout, updateUser, clearGuestProfile } = useAuth();

   // Profile Edit States
   const [editData, setEditData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      shippingAddress: {
         address: user?.shippingAddress?.address || '',
         city: user?.shippingAddress?.city || '',
         postalCode: user?.shippingAddress?.postalCode || '',
         phone: user?.shippingAddress?.phone || ''
      }
   });
   const [updating, setUpdating] = useState(false);
   const [manualEmail, setManualEmail] = useState('');

   const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

   const fetchOrders = async (page = 1) => {
      setLoading(true);
      try {
         if (token) {
            // 1. Check if we need to sync guest orders first
            if (guestEmail) {
               try {
                  const syncRes = await api.put('/orders/sync', { email: guestEmail });
                  if (syncRes.data.success && syncRes.data.count > 0) {
                     console.log(`[SYNC] Automatically linked ${syncRes.data.count} guest orders.`);
                  }
                  // Clear guest identification once sync is attempted/confirmed
                  clearGuestProfile();
               } catch (syncErr) {
                  console.error('[SYNC ERROR] Automatic order sync failed:', syncErr);
               }
            }

            const res = await api.get(`/orders/myorders?page=${page}&limit=10`);
            setOrders(res.data.data);
            setPagination({
               page: res.data.page,
               pages: res.data.pages,
               total: res.data.count
            });
         } else if (guestEmail) {
            const res = await api.get(`/orders/guest/${guestEmail}`);
            setOrders(res.data.data);
         }
      } catch (err) {
         console.error('Error fetching orders:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchOrders();
   }, [token, guestEmail]);

   // Deep Linking: Auto-open specific order if passed via URL
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

   const handleManualIdentity = (e) => {
      e.preventDefault();
      if (manualEmail.trim()) {
         setGuestProfile(manualEmail.trim());
      }
   };

   const handleUpdateProfile = async (e) => {
      e.preventDefault();
      setUpdating(true);
      try {
         const res = await api.put('/auth/profile', editData);
         if (res.data.success) {
            updateUser(res.data);
            alert('Security Registry Updated.');
         }
      } catch (err) {
         alert(err.response?.data?.message || 'Update Protocol Failed.');
      } finally {
         setUpdating(false);
      }
   };

   const profileUser = user || { name: 'GUEST CLIENT', email: guestEmail };
   const isGuest = !user;
   const isAnonymous = !user && !guestEmail;

   return (
      <div className="min-h-screen bg-white pt-24 pb-40 px-10">
         <Meta title={`Profile | ${profileUser.name} | Luzzio`} />

         <div className="max-w-[1920px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-20 text-black">

               {/* SIDEBAR: NAV & CREDENTIALS */}
               <div className="lg:w-80 space-y-16">
                  <div className="space-y-6 pb-10 border-b border-black">
                     <p className="text-small-brand text-gray-400">{user ? 'Digital Credentials' : 'Guest Identification'}</p>
                     <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-black text-white flex items-center justify-center text-3xl font-black">
                           {profileUser.name ? profileUser.name[0] : 'U'}
                        </div>
                        <div className="space-y-1">
                           <h1 className="text-2xl font-black uppercase tracking-tight leading-none truncate max-w-[150px]">{profileUser.name}</h1>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[150px]">{profileUser.email}</p>
                        </div>
                     </div>
                  </div>

                  <nav className="flex flex-col space-y-2">
                     <p className="text-small-brand text-gray-400 mb-4 px-1">Navigation Protocols</p>
                     {[
                        { id: 'orders', icon: Package, label: 'Order Archive' },
                        ...(user ? [{ id: 'settings', icon: UserIcon, label: 'Account Configuration' }] : []),
                     ].map((item) => (
                        <button
                           key={item.id}
                           onClick={() => setActiveTab(item.id)}
                           className={`flex items-center justify-between p-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-transparent
                              ${activeTab === item.id ? 'bg-brand-grey text-black border-black' : 'text-gray-400 hover:text-black hover:bg-brand-grey/50 hover:border-black'}`}
                        >
                           <span className="flex items-center gap-3">
                              <item.icon size={14} /> {item.label}
                           </span>
                           {activeTab === item.id && <div className="w-1 h-1 bg-black" />}
                        </button>
                     ))}
                     {user ? (
                        <button
                           onClick={logout}
                           className="flex items-center gap-3 p-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 border border-transparent hover:bg-red-50 hover:border-black transition-all mt-10"
                        >
                           <LogOut size={14} /> Terminate Session
                        </button>
                     ) : isAnonymous ? (
                        <div className="mt-10 p-8 bg-brand-grey border border-black space-y-6">
                           <div className="space-y-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Guest Access</p>
                              <p className="text-[9px] text-gray-500 leading-relaxed tracking-widest uppercase">
                                 Enter your email to retrieve your guest acquisition history.
                              </p>
                           </div>
                           <form onSubmit={handleManualIdentity} className="space-y-4">
                              <input
                                 type="email"
                                 value={manualEmail}
                                 onChange={(e) => setManualEmail(e.target.value)}
                                 placeholder="Email..."
                                 className="w-full bg-white border border-black p-4 text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-black"
                                 required
                              />
                              <button type="submit" className="btn-brand w-full">Identify</button>
                           </form>
                           <div className="pt-4 border-t border-black/10">
                              <Link to="/login" className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Or Sign In to Registry</Link>
                           </div>
                        </div>
                     ) : (
                        <div className="mt-10 p-8 bg-brand-grey border border-black space-y-6">
                           <div className="space-y-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Protocol Sync Available</p>
                              <p className="text-[9px] text-gray-500 leading-relaxed tracking-widest uppercase">
                                 Synchronize this anonymous order history with your permanent registry to prevent data loss.
                              </p>
                           </div>
                           <Link to="/login" className="btn-brand w-full block text-center">Sign In & Sync</Link>
                           <button
                              onClick={clearGuestProfile}
                              className="text-[8px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors w-full text-center"
                           >
                              Clear Identification
                           </button>
                        </div>
                     )}
                  </nav>
               </div>

               {/* MAIN CONTENT Area */}
               <div className="flex-1 space-y-12">
                  {activeTab === 'orders' ? (
                     <>
                        <div className="flex justify-between items-end border-b border-black pb-4">
                           <h2 className="text-4xl font-black uppercase tracking-tighter">Order Archive</h2>
                           <span className="text-small-brand text-gray-400">{pagination.total || orders.length} Sequences Recorded</span>
                        </div>

                        {loading ? (
                           <div className="py-20 text-center text-small-brand animate-pulse">Syncing Archive Data...</div>
                        ) : orders.length === 0 ? (
                           <div className="bg-brand-grey p-20 text-center space-y-6 border border-black">
                              <p className="text-small-brand text-gray-400">No acquisition sequences found.</p>
                              <Link to="/products" className="inline-block text-small-brand border-b border-black pb-1">Start New Selection</Link>
                           </div>
                        ) : (
                           <div className="space-y-8">
                              <div className="grid grid-cols-1 gap-1">
                                 {orders.map((order) => (
                                    <div
                                       key={order._id}
                                       onClick={() => {
                                          setSelectedOrder(order);
                                          setIsModalOpen(true);
                                       }}
                                       className="group border border-black p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-10 hover:bg-brand-grey transition-all cursor-pointer"
                                    >
                                       <div className="flex gap-8 items-center">
                                          <div className="flex -space-x-8">
                                             {order.orderItems.slice(0, 3).map((item, i) => (
                                                <div key={i} className="w-16 aspect-[3/4] bg-white border border-black relative z-[i] overflow-hidden transition-colors shadow-sm">
                                                   <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                             ))}
                                          </div>
                                          <div className="space-y-2">
                                             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">ID: LU-{order._id.slice(-8).toUpperCase()}</p>
                                             <p className="text-lg font-black uppercase tracking-tight text-black">
                                                {order.orderItems.length} Products <span className="text-gray-300 mx-2">/</span> ${order.totalPrice}.00
                                             </p>
                                          </div>
                                       </div>

                                       <div className="flex items-center gap-10 w-full md:w-auto justify-between md:justify-end">
                                          <div className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-none border
                                             ${order.status.toLowerCase() === 'delivered' ? 'bg-black text-white border-black' : 'bg-white text-black border-black'}`}>
                                             {order.status}
                                          </div>
                                          <ChevronRight size={18} className="text-gray-300 group-hover:text-black transition-colors translate-x-0 group-hover:translate-x-1 duration-300" />
                                       </div>
                                    </div>
                                 ))}
                              </div>

                              {/* PAGINATION CONTROLS */}
                              <div className="flex justify-between items-center pt-8 border-t border-black">
                                 <button
                                    onClick={() => fetchOrders(Math.max(1, pagination.page - 1))}
                                    disabled={pagination.page === 1}
                                    className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black"
                                 >
                                    Previous
                                 </button>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    Page {pagination.page} of {pagination.pages}
                                 </span>
                                 <button
                                    onClick={() => fetchOrders(Math.min(pagination.pages, pagination.page + 1))}
                                    disabled={pagination.page === pagination.pages}
                                    className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black"
                                 >
                                    Next
                                 </button>
                              </div>
                           </div>
                        )}
                     </>
                  ) : (
                     <div className="space-y-12">
                        <div className="border-b border-black pb-4">
                           <h2 className="text-4xl font-black uppercase tracking-tighter">Configuration</h2>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="max-w-md space-y-8">
                           <div className="space-y-6">
                              <div className="space-y-2">
                                 <p className="text-small-brand text-gray-400">Registry Name</p>
                                 <input
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    className="w-full bg-transparent border-b border-black py-4 text-[13px] tracking-wider font-black focus:outline-none"
                                    required
                                 />
                              </div>
                              <div className="space-y-2">
                                 <p className="text-small-brand text-gray-400">Digital Address (Email)</p>
                                 <input
                                    type="email"
                                    value={editData.email}
                                    readOnly
                                    className="w-full bg-transparent border-b border-black py-4 text-small-brand font-black focus:outline-none opacity-50 cursor-not-allowed"
                                    placeholder="Email address (immutable)"
                                 />
                              </div>

                              <div className="space-y-6 pt-10 border-t border-black">
                                 <p className="text-small-brand text-gray-400">Logistics Registry (Manual Override)</p>
                                 <div className="space-y-6">
                                    <div className="space-y-2">
                                       <p className="text-[9px] font-black uppercase text-gray-400">Physical Location</p>
                                       <input
                                          type="text"
                                          value={editData.shippingAddress.address}
                                          onChange={(e) => setEditData({ ...editData, shippingAddress: { ...editData.shippingAddress, address: e.target.value } })}
                                          className="w-full bg-transparent border-b border-black py-4 text-[13px] tracking-wider font-black focus:outline-none"
                                          placeholder="Street address..."
                                       />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                       <div className="space-y-2">
                                          <p className="text-[9px] font-black uppercase text-gray-400">City Hub</p>
                                          <input
                                             type="text"
                                             value={editData.shippingAddress.city}
                                             onChange={(e) => setEditData({ ...editData, shippingAddress: { ...editData.shippingAddress, city: e.target.value } })}
                                             className="w-full bg-transparent border-b border-black py-4 text-[13px] tracking-wider font-black focus:outline-none"
                                             placeholder="City code..."
                                          />
                                       </div>
                                       <div className="space-y-2">
                                          <p className="text-[9px] font-black uppercase text-gray-400">Logistics Code</p>
                                          <input
                                             type="text"
                                             value={editData.shippingAddress.postalCode}
                                             onChange={(e) => setEditData({ ...editData, shippingAddress: { ...editData.shippingAddress, postalCode: e.target.value } })}
                                             className="w-full bg-transparent border-b border-black py-4 text-[13px] tracking-wider font-black focus:outline-none"
                                             placeholder="Zip code..."
                                          />
                                       </div>
                                    </div>
                                    <div className="space-y-2">
                                       <p className="text-[9px] font-black uppercase text-gray-400">Comm Protocol (Phone)</p>
                                       <input
                                          type="text"
                                          value={editData.shippingAddress.phone}
                                          onChange={(e) => setEditData({ ...editData, shippingAddress: { ...editData.shippingAddress, phone: e.target.value } })}
                                          className="w-full bg-transparent border-b border-black py-4 text-[13px] tracking-wider font-black focus:outline-none"
                                          placeholder="Mobile sequence..."
                                       />
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="p-6 bg-brand-grey border border-black space-y-4">
                              <p className="text-[10px] font-black uppercase tracking-widest">Protocol Warning</p>
                              <p className="text-[10px] text-gray-500 leading-relaxed tracking-widest uppercase">
                                 Updating these credentials will synchronize across all Luzzio access points immediately.
                              </p>
                           </div>

                           <button
                              type="submit"
                              disabled={updating}
                              className="w-full bg-black text-white py-6 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black border border-black transition-all"
                           >
                              {updating ? 'Synchronizing...' : 'Save Configuration'}
                           </button>
                        </form>
                     </div>
                  )}
               </div>

            </div>
         </div>

         <OrderDetailsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            order={selectedOrder}
            user={profileUser}
         />
      </div>
   );
}
