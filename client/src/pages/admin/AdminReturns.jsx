// BIHANDU
// Returns & Exchanges management system replacing legacy Excel workflow.
// Fully integrated with central order records and automated inventory restocking vs damaged item tracking.

import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, CheckCircle, XCircle, RefreshCw, Eye, X, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';

export default function AdminReturns() {
   const [returns, setReturns] = useState([]);
   const [loading, setLoading] = useState(false);
   const [statusFilter, setStatusFilter] = useState('');

   // Modal State
   const [showModal, setShowModal] = useState(false);
   const [selectedReturn, setSelectedReturn] = useState(null);
   const [statusUpdate, setStatusUpdate] = useState({
      status: 'APPROVED',
      refundAmount: 0,
      notes: '',
      itemConditions: []
   });
   const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
      fetchReturns();
   }, [statusFilter]);

   const fetchReturns = async () => {
      setLoading(true);
      try {
         const res = await api.get(`/returns?status=${statusFilter}`);
         setReturns(res.data.data || []);
      } catch (err) {
         console.error('Fetch returns error:', err);
      } finally {
         setLoading(false);
      }
   };

   const openInspectModal = (ret) => {
      setSelectedReturn(ret);
      setStatusUpdate({
         status: ret.status,
         refundAmount: ret.refundAmount || 0,
         notes: '',
         itemConditions: ret.items.map(i => ({
            productId: i.product?._id || i.product,
            size: i.size,
            condition: i.condition || 'RESELLABLE'
         }))
      });
      setShowModal(true);
   };

   const handleStatusSubmit = async (e) => {
      e.preventDefault();
      if (!selectedReturn) return;

      setSubmitting(true);
      try {
         await api.put(`/returns/${selectedReturn._id}/status`, statusUpdate);
         setShowModal(false);
         fetchReturns();
      } catch (err) {
         alert(err.response?.data?.message || 'Failed to update return status');
      } finally {
         setSubmitting(false);
      }
   };

   return (
      <div className="space-y-8">
         {/* Page Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black text-white p-8">
            <div>
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Order Reverse Logistics</span>
               <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Returns & Exchanges Engine</h1>
            </div>
            <div className="flex items-center gap-4">
               <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-2.5 bg-white text-black font-mono text-xs border border-white"
               >
                  <option value="">-- All Statuses --</option>
                  <option value="REQUESTED">REQUESTED</option>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="INSPECTED">INSPECTED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="EXCHANGED">EXCHANGED</option>
                  <option value="REJECTED">REJECTED</option>
               </select>
               <Button onClick={fetchReturns} className="bg-brand-grey border border-white text-black">
                  <RefreshCw size={16} />
               </Button>
            </div>
         </div>

         {/* Returns Table */}
         <div className="bg-white border border-black overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-black bg-brand-grey text-[9px] font-black uppercase tracking-[0.2em]">
                     <th className="p-4">Return #</th>
                     <th className="p-4">Original Order</th>
                     <th className="p-4">Customer</th>
                     <th className="p-4">Returned Items</th>
                     <th className="p-4">Type</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 text-xs font-mono">
                  {loading ? (
                     <tr>
                        <td colSpan="7" className="p-12 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                           Loading Return Requests...
                        </td>
                     </tr>
                  ) : returns.length === 0 ? (
                     <tr>
                        <td colSpan="7" className="p-12 text-center text-gray-400 font-black uppercase tracking-widest">
                           No Returns or Exchange Requests Logged
                        </td>
                     </tr>
                  ) : (
                     returns.map((r) => (
                        <tr key={r._id} className="hover:bg-gray-50">
                           <td className="p-4 font-black">
                              <p className="font-sans text-xs">{r.returnNumber}</p>
                              <p className="text-[9px] text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                           </td>
                           <td className="p-4 font-bold text-blue-600">
                              Order #{r.originalOrder?.orderNumber || (r.originalOrder?._id ? r.originalOrder._id.slice(-6).toUpperCase() : 'N/A')}
                           </td>
                           <td className="p-4 font-sans">
                              <p className="font-bold">{r.customer?.name || 'Customer'}</p>
                              <p className="text-[10px] text-gray-500 font-mono">{r.customer?.email}</p>
                           </td>
                           <td className="p-4">
                              <div className="space-y-1">
                                 {r.items.map((item, i) => (
                                    <div key={i} className="text-[10px]">
                                       <span className="font-black">{item.product?.name || 'Product'} {item.size ? `[${item.size}]` : ''} x{item.quantity}</span>
                                       <span className="text-gray-500 block font-sans italic">Reason: {item.reason}</span>
                                    </div>
                                 ))}
                              </div>
                           </td>
                           <td className="p-4">
                              <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${r.requestType === 'EXCHANGE' ? 'bg-purple-100 border-purple-600 text-purple-700' : 'bg-blue-100 border-blue-600 text-blue-700'}`}>
                                 {r.requestType}
                              </span>
                           </td>
                           <td className="p-4">
                              <span className={`px-2.5 py-1 text-[9px] font-black uppercase border ${
                                 r.status === 'APPROVED' || r.status === 'REFUNDED'
                                    ? 'bg-green-100 border-green-600 text-green-700'
                                    : r.status === 'REJECTED'
                                    ? 'bg-red-100 border-red-600 text-red-700'
                                    : 'bg-amber-100 border-amber-600 text-amber-700'
                              }`}>
                                 {r.status}
                              </span>
                           </td>
                           <td className="p-4 text-right">
                              <Button
                                 onClick={() => openInspectModal(r)}
                                 className="bg-black text-white text-[9px] font-black uppercase px-3 py-1.5"
                              >
                                 <Eye size={12} className="mr-1 inline" /> Inspect & Process
                              </Button>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>

         {/* Inspection & Processing Modal */}
         {showModal && selectedReturn && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black p-8 max-w-lg w-full space-y-6">
                  <div className="border-b border-black pb-4">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Reverse Logistics Inspection</span>
                     <h3 className="text-base font-black uppercase tracking-tight mt-1">Process Return #{selectedReturn.returnNumber}</h3>
                  </div>

                  <form onSubmit={handleStatusSubmit} className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Update Status</label>
                        <select
                           value={statusUpdate.status}
                           onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                           className="w-full p-2.5 border border-black font-mono text-xs bg-white"
                        >
                           <option value="RECEIVED">RECEIVED</option>
                           <option value="INSPECTED">INSPECTED</option>
                           <option value="APPROVED">APPROVED (Trigger Stock Restock)</option>
                           <option value="REFUNDED">REFUNDED (Issue Financial Refund)</option>
                           <option value="EXCHANGED">EXCHANGED</option>
                           <option value="REJECTED">REJECTED</option>
                        </select>
                     </div>

                     {/* Item Inspection & Stock Condition */}
                     <div className="space-y-2 pt-2 border-t border-black">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Item Condition & Restock Rule</label>
                        {selectedReturn.items.map((item, idx) => (
                           <div key={idx} className="p-3 border border-black bg-brand-grey flex justify-between items-center">
                              <div>
                                 <p className="text-xs font-black uppercase">{item.product?.name || 'Product'} {item.size ? `[${item.size}]` : ''}</p>
                                 <p className="text-[9px] text-gray-500 font-mono">Qty: {item.quantity}</p>
                              </div>
                              <select
                                 value={statusUpdate.itemConditions[idx]?.condition || 'RESELLABLE'}
                                 onChange={(e) => {
                                    const updated = [...statusUpdate.itemConditions];
                                    updated[idx].condition = e.target.value;
                                    setStatusUpdate({ ...statusUpdate, itemConditions: updated });
                                 }}
                                 className="p-1 border border-black text-xs font-mono bg-white"
                              >
                                 <option value="RESELLABLE">RESELLABLE (+1 Stock)</option>
                                 <option value="DAMAGED">DAMAGED (Log Loss)</option>
                              </select>
                           </div>
                        ))}
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Refund Amount (Rs.)</label>
                        <Input
                           type="number"
                           value={statusUpdate.refundAmount}
                           onChange={(e) => setStatusUpdate({ ...statusUpdate, refundAmount: e.target.value })}
                        />
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Inspection Notes</label>
                        <textarea
                           rows="3"
                           value={statusUpdate.notes}
                           onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                           className="w-full p-2.5 border border-black text-xs font-sans"
                        />
                     </div>

                     <div className="flex gap-4 pt-4 border-t border-black">
                        <Button type="submit" disabled={submitting} className="flex-1 bg-black text-white text-xs font-black uppercase py-3">
                           {submitting ? 'Updating...' : 'Confirm Status Update'}
                        </Button>
                        <Button type="button" onClick={() => setShowModal(false)} className="bg-brand-grey border border-black text-black text-xs font-black uppercase px-6">
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
