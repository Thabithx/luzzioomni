// THABITH SRIHARAN
// Supplier / Vendor procurement management interface.
// Create, edit, and manage supplier profiles for product procurement and purchase order generation.

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Truck, RefreshCw, X, Phone, Mail, MapPin, Zap, Package, ExternalLink, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import { firstError, isBlank, isEmail, isPhone } from '../../utils/formValidate';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmModal';

export default function AdminSuppliers() {
   const [suppliers, setSuppliers] = useState([]);
   const [loading, setLoading] = useState(false);
   const [search, setSearch] = useState('');
   const { showToast } = useToast();
   const confirm = useConfirm();

   // Modal State
   const [showModal, setShowModal] = useState(false);
   const [editingSupplier, setEditingSupplier] = useState(null);
   const [formData, setFormData] = useState({
      supplierName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      status: 'active'
   });

   const [supplierMetrics, setSupplierMetrics] = useState({});

   // THABITH: 1-Click Smart Restock PO Builder State
   const [showRestockModal, setShowRestockModal] = useState(false);
   const [restockLoading, setRestockLoading] = useState(false);
   const [restockGenerating, setRestockGenerating] = useState(false);
   const [selectedSupplierForRestock, setSelectedSupplierForRestock] = useState(null);
   const [restockData, setRestockData] = useState(null);
   const [createdPO, setCreatedPO] = useState(null);

   useEffect(() => {
      fetchSuppliers();
   }, []);

   const fetchSuppliers = async () => {
      setLoading(true);
      try {
         const [res, repRes] = await Promise.all([
            api.get(`/suppliers?search=${encodeURIComponent(search)}`),
            api.get('/analytics/order-supplier-report')
         ]);
         setSuppliers(res.data.data || []);
         const metricsMap = {};
         (repRes.data.data?.suppliers?.supplierPerformance || []).forEach(sp => {
            metricsMap[sp.supplierId] = sp;
         });
         setSupplierMetrics(metricsMap);
      } catch (err) {
         console.error('Fetch suppliers error:', err);
      } finally {
         setLoading(false);
      }
   };

   const openModal = (supplier = null) => {
      if (supplier) {
         setEditingSupplier(supplier);
         setFormData({
            supplierName: supplier.supplierName || '',
            contactPerson: supplier.contactPerson || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || '',
            notes: supplier.notes || '',
            status: supplier.status || 'active'
         });
      } else {
         setEditingSupplier(null);
         setFormData({
            supplierName: '',
            contactPerson: '',
            phone: '',
            email: '',
            address: '',
            notes: '',
            status: 'active'
         });
      }
      setShowModal(true);
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      const error = firstError([
         { condition: isBlank(formData.supplierName) || formData.supplierName.trim().length < 2,
           message: 'Supplier name is required (at least 2 characters)' },
         { condition: formData.email && !isEmail(formData.email),
           message: 'Please enter a valid email address' },
         { condition: formData.phone && !isPhone(formData.phone),
           message: 'Please enter a valid phone number (7–20 digits)' },
      ]);

      if (error) {
         showToast(error, 'warning');
         return;
      }

      try {
         if (editingSupplier) {
            await api.put(`/suppliers/${editingSupplier._id}`, formData);
            showToast('Supplier updated successfully.', 'success');
         } else {
            await api.post('/suppliers', formData);
            showToast('Supplier added successfully.', 'success');
         }
         setShowModal(false);
         fetchSuppliers();
      } catch (err) {
         showToast(err.response?.data?.message || 'Failed to save supplier.', 'error');
      }
   };

   const handleDelete = async (id) => {
      const yes = await confirm({
         title: 'Remove Supplier',
         message: 'This will permanently remove the supplier profile. Associated purchase orders will remain.',
         confirmLabel: 'Remove Supplier',
         danger: true
      });
      if (!yes) return;
      try {
         await api.delete(`/suppliers/${id}`);
         fetchSuppliers();
         showToast('Supplier removed successfully.', 'success');
      } catch (err) {
         showToast(err.response?.data?.message || 'Failed to delete supplier.', 'error');
      }
   };

   // THABITH: 1-Click Smart Restock Handlers
   const handleOpenSmartRestock = async (supplier) => {
      setSelectedSupplierForRestock(supplier);
      setCreatedPO(null);
      setShowRestockModal(true);
      setRestockLoading(true);
      try {
         const res = await api.get(`/purchase-orders/smart-restock/${supplier._id}`);
         setRestockData(res.data.data);
      } catch (err) {
         console.error('Failed to load restock suggestions:', err);
         showToast(err.response?.data?.message || 'Failed to analyze stock replenishment.', 'error');
         setShowRestockModal(false);
      } finally {
         setRestockLoading(false);
      }
   };

   const handleConfirmSmartRestock = async () => {
      if (!selectedSupplierForRestock || !restockData?.suggestions?.length) return;
      setRestockGenerating(true);
      try {
         const res = await api.post(`/purchase-orders/smart-restock/${selectedSupplierForRestock._id}`, {
            customItems: restockData.suggestions.map(s => ({
               productId: s.productId,
               quantity: s.suggestedQuantity,
               purchasePrice: s.purchasePrice
            }))
         });
         setCreatedPO(res.data.data);
         showToast(res.data.message || 'Smart Restock PO created!', 'success');
      } catch (err) {
         console.error('Failed to generate restock PO:', err);
         showToast(err.response?.data?.message || 'Failed to create restock PO.', 'error');
      } finally {
         setRestockGenerating(false);
      }
   };

   return (
      <div className="space-y-8">
         {/* Page Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black text-white p-8">
            <div>
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Procurement Module</span>
               <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Supplier & Vendor Registry</h1>
            </div>
            <Button
               onClick={() => openModal()}
               className="bg-white text-black text-xs font-black uppercase tracking-wider px-6 py-3 hover:bg-gray-200"
            >
               <Plus size={16} className="mr-2 inline" /> Register New Supplier
            </Button>
         </div>

         {/* Search & Actions Bar */}
         <div className="flex justify-between items-center gap-4">
            <form onSubmit={(e) => { e.preventDefault(); fetchSuppliers(); }} className="flex gap-2 flex-1 max-w-md">
               <Input
                  type="text"
                  placeholder="Search supplier name, contact, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
               <Button type="submit" className="bg-black text-white px-6">
                  <Search size={16} />
               </Button>
            </form>
            <Button onClick={fetchSuppliers} className="bg-brand-grey border border-black text-black">
               <RefreshCw size={16} />
            </Button>
         </div>

         {/* Suppliers Grid */}
         {loading ? (
            <div className="py-20 text-center text-xs font-black uppercase tracking-widest animate-pulse">
               Loading Supplier Directory...
            </div>
         ) : suppliers.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-xs font-black uppercase tracking-widest border border-dashed border-black">
               No Suppliers Found
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {suppliers.map((s) => (
                  <div key={s._id} className="bg-white border border-black p-6 space-y-4 hover:shadow-lg transition-all flex flex-col justify-between">
                     <div className="space-y-3">
                        <div className="flex justify-between items-start border-b border-black pb-3">
                           <div>
                              <h3 className="text-base font-black uppercase tracking-tight">{s.supplierName}</h3>
                              <p className="text-[10px] text-gray-500 font-mono">Contact: {s.contactPerson || 'N/A'}</p>
                           </div>
                           <span className={`px-2 py-0.5 text-[8px] font-black uppercase border ${s.status === 'active' ? 'bg-green-100 border-green-600 text-green-700' : 'bg-gray-100 border-gray-400 text-gray-600'}`}>
                              {s.status}
                           </span>
                        </div>

                        <div className="space-y-1 text-xs font-mono text-gray-600">
                           {s.phone && <p className="flex items-center gap-2"><Phone size={12} /> {s.phone}</p>}
                           {s.email && <p className="flex items-center gap-2"><Mail size={12} /> {s.email}</p>}
                           {s.address && <p className="flex items-center gap-2"><MapPin size={12} /> {s.address}</p>}
                        </div>

                        {s.notes && (
                           <p className="text-[10px] bg-brand-grey p-2 border border-gray-300 italic font-sans text-gray-600">
                              "{s.notes}"
                           </p>
                        )}

                        {/* THABITH: Supplier Reliability Scorecard */}
                        {supplierMetrics[s._id] && (
                           <div className="bg-brand-grey p-3 border border-black space-y-1.5 font-mono text-[9px]">
                              <div className="flex justify-between items-center">
                                 <span className="text-gray-500 font-bold uppercase tracking-wider">Scorecard Grade:</span>
                                 <span className={`px-2 py-0.5 text-[8px] font-black uppercase border ${
                                    supplierMetrics[s._id].grade === 'GRADE_A'
                                       ? 'bg-emerald-100 border-emerald-600 text-emerald-800'
                                       : supplierMetrics[s._id].grade === 'GRADE_B'
                                       ? 'bg-blue-100 border-blue-600 text-blue-800'
                                       : supplierMetrics[s._id].grade === 'GRADE_C'
                                       ? 'bg-amber-100 border-amber-600 text-amber-800'
                                       : 'bg-red-100 border-red-600 text-red-800'
                                 }`}>
                                    {supplierMetrics[s._id].gradeLabel || 'Grade A'}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center text-gray-600">
                                 <span>Fulfillment Velocity:</span>
                                 <span className="font-black text-black">{supplierMetrics[s._id].fulfillmentRate}%</span>
                              </div>
                              <div className="flex justify-between items-center text-gray-600">
                                 <span>Completed POs:</span>
                                 <span className="font-black text-black">{supplierMetrics[s._id].completedPOs} / {supplierMetrics[s._id].totalPOs} Orders</span>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="pt-4 border-t border-black flex gap-2">
                        <Button
                           onClick={() => handleOpenSmartRestock(s)}
                           className="bg-amber-400 hover:bg-amber-500 text-black border border-black text-[9px] font-black uppercase py-2 px-3 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                           title="1-Click Smart Restock PO"
                        >
                           <Zap size={12} className="fill-black text-black" /> Restock PO
                        </Button>
                        <Button
                           onClick={() => openModal(s)}
                           className="flex-1 bg-brand-grey border border-black text-black text-[9px] font-black uppercase py-2"
                        >
                           <Edit2 size={12} className="mr-1 inline" /> Edit
                        </Button>
                        <Button
                           onClick={() => handleDelete(s._id)}
                           className="bg-red-50 text-red-600 border border-red-600 hover:bg-red-600 hover:text-white text-[9px] font-black uppercase px-3 py-2"
                        >
                           <Trash2 size={12} />
                        </Button>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {/* Create / Edit Supplier Modal */}
         {showModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black p-8 max-w-lg w-full space-y-6">
                  <div className="flex justify-between items-center border-b border-black pb-4">
                     <h3 className="text-sm font-black uppercase tracking-widest">
                        {editingSupplier ? 'Edit Supplier Profile' : 'Register New Supplier'}
                     </h3>
                     <button onClick={() => setShowModal(false)}><X size={18} /></button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Company / Supplier Name *</label>
                        <Input
                           type="text"
                           required
                           value={formData.supplierName}
                           onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Contact Person</label>
                           <Input
                              type="text"
                              value={formData.contactPerson}
                              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Phone Number</label>
                           <Input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                           />
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Email Address</label>
                        <Input
                           type="email"
                           value={formData.email}
                           onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Physical Address</label>
                        <Input
                           type="text"
                           value={formData.address}
                           onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Status</label>
                        <select
                           value={formData.status}
                           onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                           className="w-full p-2.5 border border-black font-mono text-xs bg-white"
                        >
                           <option value="active">Active</option>
                           <option value="inactive">Inactive</option>
                        </select>
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Notes</label>
                        <textarea
                           rows="3"
                           value={formData.notes}
                           onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                           className="w-full p-2.5 border border-black text-xs font-sans"
                        />
                     </div>

                     <div className="flex gap-4 pt-4 border-t border-black">
                        <Button type="submit" className="flex-1 bg-black text-white text-xs font-black uppercase py-3">
                           {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                        </Button>
                        <Button type="button" onClick={() => setShowModal(false)} className="bg-brand-grey border border-black text-black text-xs font-black uppercase px-6">
                           Cancel
                        </Button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* THABITH: 1-Click Smart Restock Modal */}
         {showRestockModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black p-8 max-w-2xl w-full space-y-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-black pb-4">
                     <div>
                        <div className="flex items-center gap-2">
                           <span className="p-1 bg-amber-400 text-black border border-black">
                              <Zap size={14} className="fill-black" />
                           </span>
                           <h3 className="text-sm font-black uppercase tracking-widest">
                              1-Click Smart Restock PO Builder
                           </h3>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono mt-1">
                           Target Supplier: <strong className="text-black uppercase">{selectedSupplierForRestock?.supplierName}</strong>
                        </p>
                     </div>
                     <button onClick={() => setShowRestockModal(false)}><X size={18} /></button>
                  </div>

                  {restockLoading ? (
                     <div className="py-16 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                        Analyzing Central Stock & Restock Replenishments...
                     </div>
                  ) : createdPO ? (
                     <div className="space-y-6 py-4 text-center">
                        <div className="w-16 h-16 bg-green-100 border-2 border-green-600 text-green-700 flex items-center justify-center mx-auto">
                           <CheckCircle size={32} />
                        </div>
                        <div>
                           <h4 className="text-base font-black uppercase">Purchase Order Generated Successfully!</h4>
                           <p className="text-xs font-mono text-gray-600 mt-1">
                              PO Number: <span className="font-bold text-black">{createdPO.poNumber}</span>
                           </p>
                           <p className="text-xs font-mono text-gray-500">
                              Valuation: LKR {createdPO.totalCost?.toLocaleString()} &bull; {createdPO.items?.length || 0} line items
                           </p>
                        </div>
                        <div className="flex justify-center gap-4 pt-4 border-t border-black">
                           <Link
                              to="/admin/purchase-orders"
                              className="bg-black text-white text-xs font-black uppercase px-6 py-3 flex items-center gap-2 hover:bg-gray-800"
                           >
                              <ExternalLink size={14} /> View in Purchase Orders
                           </Link>
                           <Button
                              onClick={() => setShowRestockModal(false)}
                              className="bg-brand-grey border border-black text-black text-xs font-black uppercase px-6"
                           >
                              Close
                           </Button>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-6">
                        <div className="p-4 bg-brand-grey border border-black text-xs font-mono flex justify-between items-center">
                           <div>
                              <span className="text-gray-500 text-[10px] uppercase block">Suggested Replenishment</span>
                              <span className="font-black text-base">{restockData?.totalItems || 0} Low-Stock Items Identified</span>
                           </div>
                           <div className="text-right">
                              <span className="text-gray-500 text-[10px] uppercase block">Total Estimated PO Valuation</span>
                              <span className="font-black text-base text-black">
                                 LKR {(restockData?.totalEstimatedCost || 0).toLocaleString()}
                              </span>
                           </div>
                        </div>

                        {/* Items Table */}
                        <div className="border border-black overflow-x-auto">
                           <table className="w-full text-left border-collapse text-xs font-mono">
                              <thead>
                                 <tr className="bg-black text-white text-[9px] font-black uppercase tracking-wider">
                                    <th className="p-3">Product</th>
                                    <th className="p-3 text-center">Current Stock</th>
                                    <th className="p-3 text-center">Threshold</th>
                                    <th className="p-3 text-center">Suggested PO Qty</th>
                                    <th className="p-3 text-right">Est. Unit Cost</th>
                                    <th className="p-3 text-right">Subtotal</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                 {(!restockData?.suggestions || restockData.suggestions.length === 0) ? (
                                    <tr>
                                       <td colSpan="6" className="p-8 text-center text-gray-400 uppercase font-black">
                                          All Products Are Currently at Safe Stock Levels
                                       </td>
                                    </tr>
                                 ) : (
                                    restockData.suggestions.map((item, idx) => (
                                       <tr key={idx} className="hover:bg-gray-50">
                                          <td className="p-3 font-sans font-black uppercase">
                                             {item.name}
                                             <span className="block text-[9px] font-mono text-gray-500">SKU: {item.sku}</span>
                                          </td>
                                          <td className="p-3 text-center font-bold text-red-600 bg-red-50/50">
                                             {item.currentStock} units
                                          </td>
                                          <td className="p-3 text-center text-gray-500">{item.threshold}</td>
                                          <td className="p-3 text-center font-black bg-amber-50">
                                             +{item.suggestedQuantity}
                                          </td>
                                          <td className="p-3 text-right">LKR {item.purchasePrice?.toLocaleString()}</td>
                                          <td className="p-3 text-right font-black">
                                             LKR {item.subtotal?.toLocaleString()}
                                          </td>
                                       </tr>
                                    ))
                                 )}
                              </tbody>
                           </table>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-black">
                           <Button
                              onClick={handleConfirmSmartRestock}
                              disabled={restockGenerating || !restockData?.suggestions?.length}
                              className="flex-1 bg-amber-400 hover:bg-amber-500 text-black border border-black text-xs font-black uppercase py-3 flex items-center justify-center gap-2 shadow-sm"
                           >
                              <Zap size={14} className="fill-black text-black" />
                              {restockGenerating ? 'Generating Purchase Order...' : 'Generate 1-Click Smart Restock PO'}
                           </Button>
                           <Button
                              type="button"
                              onClick={() => setShowRestockModal(false)}
                              className="bg-brand-grey border border-black text-black text-xs font-black uppercase px-6"
                           >
                              Cancel
                           </Button>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
}
