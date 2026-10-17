// THABITH SRIHARAN
// Purchase order generation, procurement tracking, and stock intake receiving interface.
// Receiving stock automatically increases central inventory and updates accounting ledgers.

import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, CheckCircle, Truck, PackageCheck, RefreshCw, X, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import { firstError, isBlank, isNonNeg, isInt } from '../../utils/formValidate';
import { useToast } from '../../components/ui/Toast';
import { exportSupplierPerformanceExcelReport } from '../../utils/excelExporter';

export default function AdminPurchaseOrders() {
   const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'reports'
   const [pos, setPos] = useState([]);
   const [suppliers, setSuppliers] = useState([]);
   const [products, setProducts] = useState([]);
   const [reportData, setReportData] = useState(null);
   const [loading, setLoading] = useState(false);
   const { showToast } = useToast();

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
      if (activeTab === 'orders') {
         fetchPOs();
         fetchSuppliersAndProducts();
      } else if (activeTab === 'reports') {
         fetchSupplierReport();
      }
   }, [activeTab]);

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

   const fetchSupplierReport = async () => {
      setLoading(true);
      try {
         const res = await api.get('/analytics/order-supplier-report');
         setReportData(res.data.data);
      } catch (err) {
         console.error('Fetch supplier report error:', err);
      } finally {
         setLoading(false);
      }
   };

   const exportSupplierExcel = () => {
      if (!reportData?.suppliers?.supplierPerformance) return;
      exportSupplierPerformanceExcelReport({
         supplierData: reportData.suppliers.supplierPerformance,
         posList: pos,
         filename: `Luzzio_Supplier_Performance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
      });
      showToast('Supplier Report (.XLSX) exported successfully!', 'success');
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

      // Validate PO form
      const error = firstError([
         { condition: isBlank(poForm.supplierId),          message: 'Please select a supplier' },
         { condition: poForm.items.length === 0,           message: 'Add at least one item to the purchase order' },
         { condition: poForm.items.some(i => isBlank(i.productId)), message: 'All items must have a product selected' },
         {
            condition: poForm.items.some(i => !isInt(i.quantity, 1)),
            message: 'All item quantities must be whole numbers of at least 1'
         },
         {
            condition: poForm.items.some(i => !isNonNeg(i.purchasePrice)),
            message: 'Purchase prices cannot be negative'
         },
      ]);

      if (error) {
         showToast(error, 'warning');
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
         showToast('Purchase order created successfully.', 'success');
      } catch (err) {
         showToast(err.response?.data?.message || 'Failed to create purchase order.', 'error');
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
         showToast('Stock intake received and inventory updated.', 'success');
      } catch (err) {
         showToast(err.response?.data?.message || 'Stock intake receiving failed.', 'error');
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
            <div className="flex flex-wrap items-center gap-3">
               <div className="flex items-center gap-2">
                  <Button
                     onClick={() => setActiveTab('orders')}
                     className={`text-xs font-black uppercase tracking-wider px-4 py-2 ${activeTab === 'orders' ? 'bg-white text-black' : 'bg-transparent text-white border border-white'}`}
                  >
                     Active POs
                  </Button>
                  <Button
                     onClick={() => setActiveTab('reports')}
                     className={`text-xs font-black uppercase tracking-wider px-4 py-2 ${activeTab === 'reports' ? 'bg-white text-black' : 'bg-transparent text-white border border-white'}`}
                  >
                     Supplier Performance Reports
                  </Button>
               </div>
               {activeTab === 'orders' && (
                  <Button
                     onClick={() => setShowCreateModal(true)}
                     className="bg-white text-black text-xs font-black uppercase tracking-wider px-4 py-2 hover:bg-gray-200"
                  >
                     <Plus size={16} className="mr-1 inline" /> Create PO
                  </Button>
               )}
            </div>
         </div>

         {/* Tab Content 1: PO List Table */}
         {activeTab === 'orders' && (
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
         )}

         {/* Tab Content 2: Supplier Performance & Procurement Reports */}
         {activeTab === 'reports' && (
            <div className="space-y-8">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-2 border-black p-6">
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tight">Supplier Performance & Fulfillment Analytics</h3>
                     <p className="text-xs text-gray-500 mt-1">Vendor reliability, PO fulfillment velocity, spend volume, and item intake metrics</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     <Button onClick={exportSupplierExcel} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase px-5 py-3 flex items-center gap-2 shadow-sm">
                        <FileSpreadsheet className="w-4 h-4" /> Download Supplier Report (.XLSX)
                     </Button>
                  </div>
               </div>

               {loading ? (
                  <div className="py-20 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                     Compiling Supplier Analytics...
                  </div>
               ) : reportData?.suppliers ? (
                  <>
                     {/* Summary KPI Cards */}
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white border-2 border-black p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Total Active Suppliers</span>
                           <p className="text-2xl font-black mt-2 font-mono">{reportData.suppliers.totalSuppliers}</p>
                           <p className="text-[10px] text-gray-400 mt-2">Verified procurement partners</p>
                        </div>

                        <div className="bg-white border-2 border-black p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Total POs Issued</span>
                           <p className="text-2xl font-black mt-2 font-mono text-blue-600">{reportData.suppliers.totalPOs}</p>
                           <p className="text-[10px] text-gray-400 mt-2">Historical procurement volume</p>
                        </div>

                        <div className="bg-black text-white border-2 border-black p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Order Fulfillment Velocity</span>
                           <p className="text-2xl font-black mt-2 font-mono text-green-400">
                              {reportData.orders?.orderFulfillmentRate || 100}%
                           </p>
                           <p className="text-[10px] text-gray-400 mt-2">Average order completion rate</p>
                        </div>
                     </div>

                     {/* THABITH: Supplier Breakdown Table & Reliability Scorecard */}
                     <div className="bg-white border-2 border-black p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-black pb-3">
                           <div>
                              <div className="flex items-center gap-2">
                                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Procurement Intelligence</span>
                                 <span className="text-[8px] font-bold uppercase bg-black text-white px-2 py-0.5">Thabith</span>
                              </div>
                              <h4 className="text-sm font-black uppercase tracking-wider mt-0.5">Supplier Reliability Scorecard & Spend Matrix</h4>
                           </div>
                           <span className="text-[9px] font-mono text-gray-400">Weighted: 65% Fulfillment Accuracy + 35% PO Completion Velocity</span>
                        </div>

                        <div className="overflow-x-auto">
                           <table className="w-full text-left text-xs font-mono">
                              <thead>
                                 <tr className="border-b border-black bg-gray-50 text-[10px] uppercase font-black">
                                    <th className="p-3">Supplier Name</th>
                                    <th className="p-3">Contact</th>
                                    <th className="p-3">Total POs</th>
                                    <th className="p-3">Intake (Rec'd / Ordered)</th>
                                    <th className="p-3">Total Spend (LKR)</th>
                                    <th className="p-3">Fulfillment</th>
                                    <th className="p-3 text-right">Reliability Scorecard</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                 {(!reportData.suppliers.supplierPerformance || reportData.suppliers.supplierPerformance.length === 0) ? (
                                    <tr><td colSpan="7" className="p-6 text-center text-gray-400">No supplier performance data</td></tr>
                                 ) : (
                                    reportData.suppliers.supplierPerformance.map(s => (
                                       <tr key={s.supplierId} className="hover:bg-gray-50">
                                          <td className="p-3 font-bold font-sans">
                                             <p className="font-black text-xs">{s.supplierName}</p>
                                             <span className="text-[9px] text-gray-400 font-mono">ID: {String(s.supplierId).slice(-6).toUpperCase()}</span>
                                          </td>
                                          <td className="p-3 text-gray-500">
                                             <p>{s.contactPerson || 'N/A'}</p>
                                             <p className="text-[9px] text-gray-400">{s.phone || 'No phone'}</p>
                                          </td>
                                          <td className="p-3 font-bold">
                                             <span>{s.totalPOs} POs</span>
                                             <span className="text-[9px] text-green-700 block">({s.completedPOs} fulfilled)</span>
                                          </td>
                                          <td className="p-3">{s.itemsReceived} / {s.itemsOrdered} units</td>
                                          <td className="p-3 font-bold">LKR {s.totalSpend.toLocaleString()}</td>
                                          <td className="p-3">
                                             <span className={`px-2 py-0.5 text-[9px] font-bold ${Number(s.fulfillmentRate) >= 80 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {s.fulfillmentRate}%
                                             </span>
                                          </td>
                                          <td className="p-3 text-right">
                                             <div className="inline-flex flex-col items-end">
                                                <div className="flex items-center gap-1.5">
                                                   <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${
                                                      s.grade === 'GRADE_A'
                                                         ? 'bg-emerald-100 border-emerald-600 text-emerald-800'
                                                         : s.grade === 'GRADE_B'
                                                         ? 'bg-blue-100 border-blue-600 text-blue-800'
                                                         : s.grade === 'GRADE_C'
                                                         ? 'bg-amber-100 border-amber-600 text-amber-800'
                                                         : 'bg-red-100 border-red-600 text-red-800'
                                                   }`}>
                                                      {s.gradeLabel || `Score: ${s.score || 100}%`}
                                                   </span>
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-400 mt-0.5 font-mono">
                                                   Rating: {s.score !== undefined ? `${s.score}/100` : '100/100'}
                                                </span>
                                             </div>
                                          </td>
                                       </tr>
                                    ))
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </>
               ) : null}
            </div>
         )}

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
