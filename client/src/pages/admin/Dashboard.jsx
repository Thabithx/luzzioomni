import React, { useState, useEffect } from 'react';
import {
   TrendingUp, ShoppingBag, Users, DollarSign, ArrowRight, Loader2, X,
   Monitor, Boxes, RotateCcw, FileText, AlertTriangle, UserCheck, TrendingDown
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, trend, accent }) => (
   <div className={cn('p-8 border border-black group transition-all duration-500', accent ? 'bg-black' : 'bg-white hover:bg-black')}>
      <div className='flex justify-between items-start mb-6'>
         <div className={cn('transition-colors', accent ? 'text-white' : 'text-black group-hover:text-white')}><Icon size={20} strokeWidth={1.5} /></div>
         <span className={cn('text-[9px] font-black uppercase tracking-[0.2em] transition-colors', accent ? 'text-white/40' : 'text-gray-400 group-hover:text-white/40')}>{trend}</span>
      </div>
      <p className={cn('text-[10px] uppercase tracking-widest font-black mb-2 transition-colors', accent ? 'text-white/40' : 'text-gray-400 group-hover:text-white/40')}>{label}</p>
      <h3 className={cn('text-3xl font-black tracking-tighter transition-colors', accent ? 'text-white' : 'text-black group-hover:text-white')}>{value}</h3>
   </div>
);

const QuickNavTile = ({ to, icon: Icon, label, count, color }) => (
   <Link to={to} className='group bg-white border border-black p-6 hover:bg-black hover:text-white transition-all flex justify-between items-center'>
      <div className='flex items-center gap-4'>
         <div className={cn('p-2.5 border transition-colors', color === 'red' ? 'bg-red-100 border-red-600 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-brand-grey border-black text-black group-hover:bg-white/10 group-hover:border-white group-hover:text-white')}>
            <Icon size={16} />
         </div>
         <span className='text-xs font-black uppercase tracking-wider'>{label}</span>
      </div>
      <div className='flex items-center gap-3'>
         {count !== undefined && (
            <span className={cn('px-3 py-1 text-xs font-black border transition-colors', color === 'red' ? 'bg-red-600 text-white border-red-600' : 'bg-black text-white border-black group-hover:bg-white group-hover:text-black')}>{count}</span>
         )}
         <ArrowRight size={16} className='group-hover:translate-x-1 transition-transform' />
      </div>
   </Link>
);

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
   if (!isOpen || !order) return null;
   return (
      <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm'>
         <div className='bg-white w-full max-w-3xl max-h-[95vh] overflow-y-auto border border-black shadow-2xl relative'>
            <div className='p-8 bg-black flex justify-between items-center sticky top-0 z-10'>
               <div className='space-y-1'>
                  <p className='text-[9px] text-white/40 font-black uppercase tracking-[0.2em]'>Acquisition Sequence Audit</p>
                  <h2 className='text-xl font-black uppercase tracking-tight text-white'>Sequence Audit</h2>
                  <p className='text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1'>UUID: {order._id.toUpperCase()}</p>
               </div>
               <button onClick={onClose} className='p-2 text-white/50 hover:text-white transition-colors'><X /></button>
            </div>
            <div className='p-10 space-y-12'>
               <div className='grid grid-cols-1 md:grid-cols-2 gap-10 text-black'>
                  <div className='space-y-3'>
                     <p className='text-small-brand text-gray-400'>Current Status</p>
                     <p className='text-sm font-black uppercase tracking-widest bg-brand-grey inline-block px-3 py-1 border border-black'>{order.status}</p>
                  </div>
                  <div className='space-y-3'>
                     <p className='text-small-brand text-gray-400'>Client Entry</p>
                     <p className='text-sm font-black uppercase'>{order.shippingAddress?.firstName && order.shippingAddress?.lastName ? order.shippingAddress.firstName + ' ' + order.shippingAddress.lastName : 'Guest'}</p>
                     <p className='text-[10px] text-gray-400 font-bold uppercase'>{order.email}</p>
                  </div>
               </div>
               <div>
                  <p className='text-small-brand text-gray-400 mb-6 font-black uppercase'>Archive Components</p>
                  <div className='border border-black divide-y divide-black text-black'>
                     {order.orderItems.map((item, i) => (
                        <div key={i} className='flex p-6 gap-6 items-center'>
                           <div className='w-16 aspect-[3/4] bg-white border border-black overflow-hidden shrink-0'><img src={item.image} alt='' className='w-full h-full object-cover' /></div>
                           <div className='flex-1 min-w-0'>
                              <p className='text-sm font-black uppercase tracking-tight truncate'>{item.name}</p>
                              <p className='text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1'>VOL: {item.size} | QTY: {item.qty}</p>
                           </div>
                           <p className='text-sm font-black'>LKR {(item.price * item.qty).toLocaleString()}.00</p>
                        </div>
                     ))}
                  </div>
               </div>
               <div className='border-t border-black pt-10 flex justify-between items-end text-black'>
                  <p className='text-small-brand text-gray-400 font-black uppercase'>Total Settlement Value</p>
                  <p className='text-2xl font-black'>LKR {order.totalPrice.toLocaleString()}.00</p>
               </div>
            </div>
         </div>
      </div>
   );
};

const Dashboard = () => {
   const [stats, setStats] = useState(null);
   const [omniStats, setOmniStats] = useState(null);
   const [loading, setLoading] = useState(true);
   const [selectedOrder, setSelectedOrder] = useState(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [range, setRange] = useState('all');
   const { token } = useAuth();

   const fetchStats = async () => {
      setLoading(true);
      try {
         const [mainRes, financeRes, returnsRes, poRes, inventoryRes] = await Promise.allSettled([
            api.get('/admin/stats?range=' + range),
            api.get('/finance/overview'),
            api.get('/returns?status=REQUESTED'),
            api.get('/purchase-orders?status=ORDERED'),
            api.get('/inventory?lowStock=true&limit=1')
         ]);
         if (mainRes.status === 'fulfilled') setStats(mainRes.value.data.data);
         const omni = {};
         if (financeRes.status === 'fulfilled') {
            const d = financeRes.value.data.data;
            omni.onlineRevenue = d.onlineRevenue || 0;
            omni.posRevenue = d.posRevenue || 0;
            omni.netProfit = d.netProfit || 0;
            omni.totalExpenses = d.totalExpenses || 0;
         }
         if (returnsRes.status === 'fulfilled') omni.pendingReturns = returnsRes.value.data.count || 0;
         if (poRes.status === 'fulfilled') omni.pendingPOs = poRes.value.data.count || 0;
         if (inventoryRes.status === 'fulfilled') omni.lowStockCount = inventoryRes.value.data.count || 0;
         setOmniStats(omni);
      } catch (err) {
         console.error('Dashboard fetch error:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => { if (token) fetchStats(); }, [token, range]);

   if (loading) return (
      <div className='min-h-[60vh] flex flex-col items-center justify-center space-y-4'>
         <Loader2 className='animate-spin text-black' size={32} />
         <p className='text-[10px] font-black uppercase tracking-[0.4em]'>Synchronizing Omnicommerce Data...</p>
      </div>
   );

   const rangeLabels = { today:'Today', week:'7 Days', month:'30 Days', '6month':'180 Days', year:'365 Days', all:'All Time' };
   const ranges = [
      { id:'today', label:'Day' }, { id:'week', label:'Week' }, { id:'month', label:'Month' },
      { id:'6month', label:'6 Months' }, { id:'year', label:'Year' }, { id:'all', label:'All Time' }
   ];

   return (
      <div className='space-y-12'>
         <div className='flex flex-col md:flex-row md:justify-between md:items-end border-b border-black pb-8 gap-8'>
            <div className='space-y-2'>
               <p className='text-small-brand text-gray-400'>Omnicommerce Management System</p>
               <h1 className='text-5xl font-black uppercase tracking-tighter leading-none'>Command Center</h1>
            </div>
            <div className='flex flex-col items-start md:items-end gap-4'>
               <div className='flex items-center bg-brand-grey border border-black p-1'>
                  {ranges.map((r) => (
                     <button key={r.id} onClick={() => setRange(r.id)} className={cn('px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all', range === r.id ? 'bg-black text-white' : 'text-black hover:bg-black/5')}>
                        {r.label}
                     </button>
                  ))}
               </div>
               <p className='text-[10px] font-bold uppercase tracking-widest text-gray-400'>Session: 0x{token?.slice(-4).toUpperCase() || 'SYS'}</p>
            </div>
         </div>

         <div>
            <p className='text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4'>{rangeLabels[range]} — Storefront Performance</p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1'>
               <StatCard accent label='Gross Revenue' value={'LKR ' + (stats?.grossRevenue?.toLocaleString() || '0')} icon={DollarSign} trend='Storefront' />
               <StatCard label='Visitor Traffic' value={stats?.visitorCount?.toLocaleString() || '0'} icon={TrendingUp} trend='Traffic' />
               <StatCard label='Order Volume' value={stats?.inventoryOutflow?.toLocaleString() || '0'} icon={ShoppingBag} trend='Fulfillment' />
               <StatCard label='Client Registry' value={stats?.clientRegistry?.toLocaleString() || '0'} icon={Users} trend='Accounts' />
            </div>
         </div>

         {omniStats && (
            <div>
               <p className='text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4'>All-Time — Omnicommerce Financial Engine</p>
               <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1'>
                  <StatCard label='Online Revenue' value={'LKR ' + (omniStats.onlineRevenue ?? 0).toLocaleString()} icon={TrendingUp} trend='E-Commerce' />
                  <StatCard label='POS Revenue' value={'LKR ' + (omniStats.posRevenue ?? 0).toLocaleString()} icon={Monitor} trend='In-Store' />
                  <StatCard label='Total Expenses' value={'LKR ' + (omniStats.totalExpenses ?? 0).toLocaleString()} icon={TrendingDown} trend='Operating' />
                  <StatCard accent label='Net Revenue' value={'LKR ' + (omniStats.netProfit ?? 0).toLocaleString()} icon={DollarSign} trend='Est. Profit' />
               </div>
            </div>
         )}

         <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-3'>
               <p className='text-[9px] font-black uppercase tracking-[0.3em] text-gray-400'>Operational Alerts</p>
               <QuickNavTile to='/admin/inventory' icon={AlertTriangle} label='Low Stock Products' count={omniStats?.lowStockCount ?? 0} color='red' />
               <QuickNavTile to='/admin/returns' icon={RotateCcw} label='Pending Return Requests' count={omniStats?.pendingReturns ?? 0} color='red' />
               <QuickNavTile to='/admin/purchase-orders' icon={FileText} label='Active Purchase Orders' count={omniStats?.pendingPOs ?? 0} />
            </div>
            <div className='space-y-3'>
               <p className='text-[9px] font-black uppercase tracking-[0.3em] text-gray-400'>Quick Access</p>
               <QuickNavTile to='/admin/pos' icon={Monitor} label='Open POS Terminal' />
               <QuickNavTile to='/admin/inventory' icon={Boxes} label='Central Stock Registry' />
               <QuickNavTile to='/admin/staff' icon={UserCheck} label='Staff and Shift Management' />
               <QuickNavTile to='/admin/finance' icon={DollarSign} label='Financial Engine' />
            </div>
         </div>

         <div>
            <div className='py-6 border-b border-black flex justify-between items-center mb-6'>
               <div className='flex items-center gap-4'>
                  <h2 className='text-xl font-black uppercase tracking-tight'>Recent Orders</h2>
                  <span className='px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase'>Live</span>
               </div>
               <Link to='/admin/orders' className='text-small-brand border-b border-black pb-1 hover:opacity-50 transition-opacity'>View Full Registry</Link>
            </div>
            <div className='overflow-x-auto border border-black'>
               <table className='w-full text-left min-w-[700px]'>
                  <thead>
                     <tr className='bg-brand-grey border-b border-black'>
                        <th className='px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black'>Order ID</th>
                        <th className='px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black'>Channel</th>
                        <th className='px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black'>Client</th>
                        <th className='px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black'>Timestamp</th>
                        <th className='px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black'>Value</th>
                        <th className='px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black text-right'>Audit</th>
                     </tr>
                  </thead>
                  <tbody className='divide-y divide-black'>
                     {stats?.recentOrders?.map((order) => (
                        <tr key={order._id} className='hover:bg-brand-grey transition-all group'>
                           <td className='px-8 py-6 font-mono text-[11px] font-bold text-gray-400 group-hover:text-black'>
                              {order.orderNumber || ('LU-' + order._id.slice(-8).toUpperCase())}
                           </td>
                           <td className='px-8 py-6'>
                              <span className={cn('px-2 py-0.5 text-[8px] font-black uppercase border', order.channel === 'POS' ? 'bg-black text-white border-black' : 'bg-brand-grey text-black border-gray-400')}>
                                 {order.channel || 'ONLINE'}
                              </span>
                           </td>
                           <td className='px-8 py-6 text-[11px] font-black uppercase tracking-tight'>
                              {order.shippingAddress?.firstName && order.shippingAddress?.lastName ? order.shippingAddress.firstName + ' ' + order.shippingAddress.lastName : 'Inconnu'}
                           </td>
                           <td className='px-8 py-6 text-[11px] font-bold text-gray-400 uppercase'>{new Date(order.createdAt).toLocaleDateString()}</td>
                           <td className='px-8 py-6 text-[11px] font-black'>LKR {order.totalPrice.toLocaleString()}.00</td>
                           <td className='px-8 py-6 text-right'>
                              <button onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }} className='p-2 border border-transparent hover:border-black hover:bg-white transition-all'>
                                 <ArrowRight size={14} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <OrderDetailsModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedOrder(null); }} order={selectedOrder} />
      </div>
   );
};

export default Dashboard;
