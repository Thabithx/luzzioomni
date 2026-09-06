// THABITH SRIHARAN
// Purchase order generation, procurement tracking, and stock intake receiving interface.
// Receiving stock automatically increases central inventory and updates accounting ledgers.

import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, CheckCircle, Truck, PackageCheck, RefreshCw, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';

export default function AdminPurchaseOrders() {
   const [pos, setPos] = useState([]);
   const [suppliers, setSuppliers] = useState([]);
   const [products, setProducts] = useState([]);
   const [loading, setLoading] = useState(false);

   // Modal State
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [showReceiveModal, setShowReceiveModal] = useState(false);
   const [selectedPO, setSelectedPO] = useState(null);

   // New PO Form Data
   const [poForm, setPoForm] = useState({
      supplierId: '',
      expectedDate: '',
      notes: '',
      items: [{ productId: '', size: '', quantity: 1, purchasePrice: 0 }]
   });

   // Receive Stock Form Data
   const [receiveItems, setReceiveItems] = useState([]);
   const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
      fetchPOs();
      fetchSuppliersAndProducts();
   }, []);

   const fetchPOs = async () => {
      setLoading(true);
      try {
         const res = await api.get('/purchase-orders');
         setPos(res.data.data || []);
      } catch (err) {
         console.error('Fetch POs error:', err);
      } finally {
         setLoading(false);
      }
   };

   const fetchSuppliersAndProducts = async () => {
      try {
         const [supRes, prodRes] = await Promise.all([
            api.get('/suppliers?status=active'),
            api.get('/products?limit=200')
         ]);
         setSuppliers(supRes.data.data || []);
         setProducts(prodRes.data.data || []);
      } catch (err) {
         console.error('Fetch metadata error:', err);
      }
   };

   const addPOItem = () => {
      setPoForm({
         ...poForm,
         items: [...poForm.items, { productId: '', size: '', quantity: 1, purchasePrice: 0 }]
      });
   };

   const removePOItem = (index) => {
      const updated = poForm.items.filter((_, i) => i !== index);
      setPoForm({ ...poForm, items: updated });
   };

   const updatePOItem = (index, field, value) => {
      const updated = [...poForm.items];
      updated[index][field] = value;
      setPoForm({ ...poForm, items: updated });
   };

   const handleCreateSubmit = async (e) => {
      e.preventDefault();
      if (!poForm.supplierId || poForm.items.length === 0) {
         alert('Please select a supplier and add at least one item');
         return;
      }

      setSubmitting(true);
      try {
         await api.post('/purchase-orders', poForm);
         setShowCreateModal(false);
         setPoForm({
            supplierId: '',
            expectedDate: '',
            notes: '',
            items: [{ productId: '', size: '', quantity: 1, purchasePrice: 0 }]
         });
         fetchPOs();
      } catch (err) {
         alert(err.response?.data?.message || 'Failed to create purchase order');
      } finally {
         setSubmitting(false);
      }
   };

   const openReceiveModal = (po) => {
      setSelectedPO(po);
      setReceiveItems(
         po.items.map(item => ({
            productId: item.product._id || item.product,
            size: item.size,
            name: item.product.name || 'Product',
            orderedQty: item.quantity,
            alreadyReceived: item.receivedQuantity,
            quantityReceived: item.quantity - item.receivedQuantity
         }))
      );
      setShowReceiveModal(true);
   };

   const handleReceiveSubmit = async (e) => {
      e.preventDefault();
      if (!selectedPO) return;

      setSubmitting(true);
      try {
         await api.post(`/purchase-orders/${selectedPO._id}/receive`, {
            itemsReceived: receiveItems.map(item => ({
               productId: item.productId,
               size: item.size,
               quantityReceived: Number(item.quantityReceived)
            }))
         });

         setShowReceiveModal(false);
         fetchPOs();
      } catch (err) {
         alert(err.response?.data?.message || 'Stock intake receiving failed');
      } finally {
         setSubmitting(false);
      }
   };

   return (
      <div className="space-y-8">
         {/* Page Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black text-white p-8">
            <div>
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Stock Procurement</span>
               <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Purchase Orders & Intake</h1>
            </div>
            <Button
               onClick={() => setShowCreateModal(true)}
               className="bg-white text-black text-xs font-black uppercase tracking-wider px-6 py-3 hover:bg-gray-200"
            >
               <Plus size={16} className="mr-2 inline" /> Create Purchase Order
            </Button>
         </div>

         {/* PO List Table */}
         <div className="bg-white border border-black overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-black bg-brand-grey text-[9px] font-black uppercase tracking-[0.2em]">
                     <th className="p-4">PO Number</th>
                     <th className="p-4">Supplier</th>
                     <th className="p-4">Total Cost</th>
                     <th className="p-4">Items / Quantities</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 text-xs font-mono">
                  {loading ? (
                     <tr>
                        <td colSpan="6" className="p-12 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                           Loading Purchase Orders...
                        </td>
                     </tr>
                  ) : pos.length === 0 ? (
                     <tr>
                        <td colSpan="6" className="p-12 text-center text-gray-400 font-black uppercase tracking-widest">
                           No Purchase Orders Issued
                        </td>
                     </tr>
                  ) : (
                     pos.map((po) => (
                        <tr key={po._id} className="hover:bg-gray-50">
                           <td className="p-4 font-black">
                              <p className="font-sans text-xs">{po.poNumber}</p>
                              <p className="text-[9px] text-gray-400 font-mono">{new Date(po.createdAt).toLocaleDateString()}</p>
                           </td>
                           <td className="p-4 font-sans font-bold">
                              {po.supplier ? po.supplier.supplierName : 'Unknown Supplier'}
                           </td>
                           <td className="p-4 font-bold">
                              Rs. {po.totalCost.toLocaleString()}
                           </td>
                           <td className="p-4">
                              <div className="space-y-1">
                                 {po.items.map((item, i) => (
                                    <div key={i} className="text-[10px] flex items-center justify-between gap-2">
                                       <span>{item.product?.name || 'Product'} {item.size ? `[${item.size}]` : ''}</span>
                                       <span className="font-bold">
                                          {item.receivedQuantity} / {item.quantity} Rec'd
                                       </span>
                                    </div>
                                 ))}
                              </div>
                           </td>
                           <td className="p-4">
                              <span className={`px-2.5 py-1 text-[9px] font-black uppercase border ${
                                 po.status === 'RECEIVED'
                                    ? 'bg-green-100 border-green-600 text-green-700'
                                    : po.status === 'PARTIALLY_RECEIVED'
                                    ? 'bg-amber-100 border-amber-600 text-amber-700'
                                    : 'bg-gray-100 border-black text-black'
                              }`}>
                                 {po.status}
                              </span>
                           </td>
                           <td className="p-4 text-right">
                              {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                                 <Button
                                    onClick={() => openReceiveModal(po)}
                                    className="bg-black text-white text-[9px] font-black uppercase px-3 py-1.5"
                                 >
                                    <PackageCheck size={12} className="mr-1 inline" /> Receive Stock
                                 </Button>
                              )}
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>

         {/* Create PO Modal */}
         {showCreateModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black p-8 max-w-2xl w-full space-y-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-black pb-4">
                     <h3 className="text-sm font-black uppercase tracking-widest">Issue New Purchase Order</h3>
                     <button onClick={() => setShowCreateModal(false)}><X size={18} /></button>
                  </div>

                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Select Supplier *</label>
                        <select
                           required
                           value={poForm.supplierId}
                           onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                           className="w-full p-2.5 border border-black font-mono text-xs bg-white"
                        >
                           <option value="">-- Choose Supplier --</option>
                           {suppliers.map(s => (
                              <option key={s._id} value={s._id}>{s.supplierName} ({s.contactPerson || 'N/A'})</option>
                           ))}
                        </select>
                     </div>

                     {/* PO Items */}
                     <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                           <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Order Items *</label>
                           <button type="button" onClick={addPOItem} className="text-xs font-black text-blue-600 hover:underline">+ Add Item</button>
                        </div>

                        {poForm.items.map((item, idx) => (
                           <div key={idx} className="p-3 border border-black bg-brand-grey space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                 <select
                                    required
                                    value={item.productId}
                                    onChange={(e) => updatePOItem(idx, 'productId', e.target.value)}
                                    className="w-full p-2 border border-black font-mono text-xs bg-white"
                                 >
                                    <option value="">-- Select Product --</option>
                                    {products.map(p => (
                                       <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                 </select>

                                 <Input
                                    type="text"
                                    placeholder="Size (e.g. S, M, L)"
                                    value={item.size}
                                    onChange={(e) => updatePOItem(idx, 'size', e.target.value)}
                                 />
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                 <div>
                                    <label className="text-[8px] font-black uppercase text-gray-500">Quantity</label>
                                    <Input
                                       type="number"
                                       min="1"
                                       value={item.quantity}
                                       onChange={(e) => updatePOItem(idx, 'quantity', e.target.value)}
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[8px] font-black uppercase text-gray-500">Unit Cost (Rs.)</label>
                                    <Input
                                       type="number"
                                       min="0"
                                       value={item.purchasePrice}
                                       onChange={(e) => updatePOItem(idx, 'purchasePrice', e.target.value)}
                                    />
                                 </div>
                                 <div className="flex items-end">
                                    {poForm.items.length > 1 && (
                                       <button
                                          type="button"
                                          onClick={() => removePOItem(idx)}
                                          className="w-full py-2 text-[10px] font-black uppercase bg-red-100 text-red-600 border border-red-600"
                                       >
                                          Remove
                                       </button>
                                    )}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className="flex gap-4 pt-4 border-t border-black">
                        <Button type="submit" disabled={submitting} className="flex-1 bg-black text-white text-xs font-black uppercase py-3">
                           {submitting ? 'Issuing PO...' : 'Issue Purchase Order'}
                        </Button>
                        <Button type="button" onClick={() => setShowCreateModal(false)} className="bg-brand-grey border border-black text-black text-xs font-black uppercase px-6">
                           Cancel
                        </Button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* Receive Stock Modal */}
         {showReceiveModal && selectedPO && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black p-8 max-w-lg w-full space-y-6">
                  <div className="border-b border-black pb-4">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Stock Intake Protocol</span>
                     <h3 className="text-base font-black uppercase tracking-tight mt-1">Receive PO #{selectedPO.poNumber}</h3>
                  </div>

                  <form onSubmit={handleReceiveSubmit} className="space-y-4">
                     <div className="space-y-3">
                        {receiveItems.map((item, idx) => (
                           <div key={idx} className="p-3 border border-black bg-brand-grey flex justify-between items-center">
                              <div>
                                 <p className="text-xs font-black uppercase">{item.name} {item.size ? `[${item.size}]` : ''}</p>
                                 <p className="text-[9px] text-gray-500 font-mono">Ordered: {item.orderedQty} | Prev Rec'd: {item.alreadyReceived}</p>
                              </div>
                              <div className="w-24">
                                 <label className="text-[8px] font-black uppercase block text-gray-500">Rec'd Now</label>
                                 <input
                                    type="number"
                                    min="0"
                                    max={item.orderedQty - item.alreadyReceived}
                                    value={item.quantityReceived}
                                    onChange={(e) => {
                                       const updated = [...receiveItems];
                                       updated[idx].quantityReceived = e.target.value;
                                       setReceiveItems(updated);
                                    }}
                                    className="w-full p-1.5 border border-black font-mono text-xs text-right bg-white"
                                 />
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className="flex gap-4 pt-4 border-t border-black">
                        <Button type="submit" disabled={submitting} className="flex-1 bg-black text-white text-xs font-black uppercase py-3">
                           {submitting ? 'Updating Stock...' : 'Confirm Stock Intake'}
                        </Button>
                        <Button type="button" onClick={() => setShowReceiveModal(false)} className="bg-brand-grey border border-black text-black text-xs font-black uppercase px-6">
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
