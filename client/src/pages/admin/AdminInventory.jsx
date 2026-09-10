// DULARA
// Centralized inventory management dashboard.
// Single source of truth stock registry, low-stock alerts, manual stock adjustments (+/-),
// and auditable stock movement history ledger.

import React, { useState, useEffect } from 'react';
import { Search, Boxes, AlertTriangle, RefreshCw, Plus, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';

export default function AdminInventory() {
   const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'history'
   const [products, setProducts] = useState([]);
   const [history, setHistory] = useState([]);
   const [loading, setLoading] = useState(false);
   const [search, setSearch] = useState('');
   const [lowStockFilter, setLowStockFilter] = useState(false);

   // Manual adjustment modal state
   const [showAdjustModal, setShowAdjustModal] = useState(false);
   const [selectedProduct, setSelectedProduct] = useState(null);
   const [adjustData, setAdjustData] = useState({
      variantSize: '',
      quantityChange: 0,
      transactionType: 'RESTOCK',
      notes: ''
   });
   const [submittingAdjust, setSubmittingAdjust] = useState(false);

   useEffect(() => {
      if (activeTab === 'registry') {
         fetchInventory();
      } else {
         fetchHistory();
      }
   }, [activeTab, lowStockFilter]);

   const fetchInventory = async () => {
      setLoading(true);
      try {
         const res = await api.get(`/inventory?search=${encodeURIComponent(search)}&lowStock=${lowStockFilter}`);
         setProducts(res.data.data || []);
      } catch (err) {
         console.error('Fetch inventory error:', err);
      } finally {
         setLoading(false);
      }
   };

   const fetchHistory = async () => {
      setLoading(true);
      try {
         const res = await api.get('/inventory/history');
         setHistory(res.data.data || []);
      } catch (err) {
         console.error('Fetch history error:', err);
      } finally {
         setLoading(false);
      }
   };

   const handleSearchSubmit = (e) => {
      e.preventDefault();
      fetchInventory();
   };

   const openAdjustModal = (product) => {
      setSelectedProduct(product);
      setAdjustData({
         variantSize: (product.variants && product.variants[0]?.size) || '',
         quantityChange: 0,
         transactionType: 'RESTOCK',
         notes: ''
      });
      setShowAdjustModal(true);
   };

   const handleAdjustSubmit = async (e) => {
      e.preventDefault();
      if (!selectedProduct || adjustData.quantityChange === 0) {
         alert('Quantity change cannot be 0');
         return;
      }

      setSubmittingAdjust(true);
      try {
         await api.post('/inventory/adjust', {
            productId: selectedProduct._id,
            variantSize: adjustData.variantSize,
            quantityChange: Number(adjustData.quantityChange),
            transactionType: adjustData.transactionType,
            notes: adjustData.notes
         });

         setShowAdjustModal(false);
         fetchInventory();
      } catch (err) {
         alert(err.response?.data?.message || 'Stock adjustment failed');
      } finally {
         setSubmittingAdjust(false);
      }
   };

   return (
      <div className="space-y-8">
         {/* Page Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black text-white p-8">
            <div>
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Single Source of Truth</span>
               <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Centralized Stock Registry</h1>
            </div>
            <div className="flex items-center gap-4">
               <Button
                  onClick={() => setActiveTab('registry')}
                  className={`text-xs font-black uppercase tracking-wider px-5 py-2.5 ${activeTab === 'registry' ? 'bg-white text-black' : 'bg-transparent text-white border border-white'}`}
               >
                  <Boxes size={14} className="mr-2 inline" /> Stock Overview
               </Button>
               <Button
                  onClick={() => setActiveTab('history')}
                  className={`text-xs font-black uppercase tracking-wider px-5 py-2.5 ${activeTab === 'history' ? 'bg-white text-black' : 'bg-transparent text-white border border-white'}`}
               >
                  <History size={14} className="mr-2 inline" /> Audit History
               </Button>
            </div>
         </div>

         {/* Tab Content: Registry */}
         {activeTab === 'registry' && (
            <div className="space-y-6">
               {/* Controls Bar */}
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto flex-1">
                     <Input
                        type="text"
                        placeholder="Search product name, SKU or barcode..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-md uppercase font-mono text-sm"
                     />
                     <Button type="submit" className="bg-black text-white px-6">
                        <Search size={16} />
                     </Button>
                  </form>

                  <div className="flex items-center gap-4 w-full md:w-auto">
                     <button
                        type="button"
                        onClick={() => setLowStockFilter(!lowStockFilter)}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider border transition-all ${
                           lowStockFilter
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white text-black border-black hover:bg-gray-100'
                        }`}
                     >
                        <AlertTriangle size={14} />
                        Low Stock Alert (&le; 10)
                     </button>
                     <Button onClick={fetchInventory} className="bg-brand-grey border border-black text-black">
                        <RefreshCw size={16} />
                     </Button>
                  </div>
               </div>

               {/* Inventory Table */}
               <div className="bg-white border border-black overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="border-b border-black bg-brand-grey text-[9px] font-black uppercase tracking-[0.2em]">
                           <th className="p-4">Product Details</th>
                           <th className="p-4">SKU / Barcode</th>
                           <th className="p-4">Central Stock</th>
                           <th className="p-4">Variant Breakdown</th>
                           <th className="p-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200 text-xs font-mono">
                        {loading ? (
                           <tr>
                              <td colSpan="5" className="p-12 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                                 Loading Stock Registry...
                              </td>
                           </tr>
                        ) : products.length === 0 ? (
                           <tr>
                              <td colSpan="5" className="p-12 text-center text-gray-400 font-black uppercase tracking-widest">
                                 No Stock Records Found
                              </td>
                           </tr>
                        ) : (
                           products.map((p) => (
                              <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                                 <td className="p-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 bg-brand-grey border border-black overflow-hidden flex-shrink-0">
                                          <img src={p.images[0] || 'https://via.placeholder.com/50'} alt="" className="w-full h-full object-cover" />
                                       </div>
                                       <div>
                                          <p className="font-sans font-black uppercase text-xs tracking-tight">{p.name}</p>
                                          <p className="text-[10px] text-gray-500 font-sans">
                                             Rs. {(p.salePrice > 0 ? p.salePrice : p.price).toLocaleString()}
                                          </p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="p-4 font-mono">
                                    <p className="text-xs font-bold text-black">{p.sku || 'N/A'}</p>
                                    <p className="text-[10px] text-gray-400">{p.barcode || 'N/A'}</p>
                                 </td>
                                 <td className="p-4">
                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-black uppercase border ${
                                       p.stock <= 0
                                          ? 'bg-red-100 border-red-600 text-red-600'
                                          : p.stock <= 10
                                          ? 'bg-amber-100 border-amber-600 text-amber-700'
                                          : 'bg-green-100 border-green-600 text-green-700'
                                    }`}>
                                       {p.stock <= 10 && <AlertTriangle size={12} className="mr-1 inline" />}
                                       {p.stock} Units
                                    </span>
                                 </td>
                                 <td className="p-4">
                                    {p.variants && p.variants.length > 0 ? (
                                       <div className="flex flex-wrap gap-1">
                                          {p.variants.map((v) => (
                                             <span key={v.size} className="px-2 py-0.5 bg-brand-grey border border-black text-[10px] font-bold">
                                                {v.size}: {v.stock}
                                             </span>
                                          ))}
                                       </div>
                                    ) : (
                                       <span className="text-gray-400 text-[10px]">No Variants</span>
                                    )}
                                 </td>
                                 <td className="p-4 text-right">
                                    <Button
                                       onClick={() => openAdjustModal(p)}
                                       className="bg-black text-white text-[9px] font-black uppercase px-3 py-1.5"
                                    >
                                       <Plus size={12} className="mr-1 inline" /> Adjust Stock
                                    </Button>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* Tab Content: History Audit Ledger */}
         {activeTab === 'history' && (
            <div className="bg-white border border-black overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-black bg-brand-grey text-[9px] font-black uppercase tracking-[0.2em]">
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Product</th>
                        <th className="p-4">Type / Source</th>
                        <th className="p-4">Movement</th>
                        <th className="p-4">Performed By</th>
                        <th className="p-4">Notes</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs font-mono">
                     {loading ? (
                        <tr>
                           <td colSpan="6" className="p-12 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                              Loading Stock History Ledger...
                           </td>
                        </tr>
                     ) : history.length === 0 ? (
                        <tr>
                           <td colSpan="6" className="p-12 text-center text-gray-400 font-black uppercase tracking-widest">
                              No Movement History Logged
                           </td>
                        </tr>
                     ) : (
                        history.map((h) => (
                           <tr key={h._id} className="hover:bg-gray-50">
                              <td className="p-4 text-[10px] text-gray-500">
                                 {new Date(h.timestamp).toLocaleString()}
                              </td>
                              <td className="p-4 font-sans font-black uppercase">
                                 {h.product ? h.product.name : 'Unknown Product'}
                                 {h.variantSize && <span className="ml-1 text-[10px] text-gray-500">[{h.variantSize}]</span>}
                              </td>
                              <td className="p-4">
                                 <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase">
                                    {h.transactionType}
                                 </span>
                                 <span className="ml-2 text-[10px] text-gray-500">({h.source})</span>
                              </td>
                              <td className="p-4 font-black">
                                 <span className={`inline-flex items-center ${h.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {h.quantityChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {h.quantityChange > 0 ? `+${h.quantityChange}` : h.quantityChange}
                                 </span>
                                 <span className="text-[10px] text-gray-400 ml-2">({h.previousQuantity} &rarr; {h.newQuantity})</span>
                              </td>
                              <td className="p-4 font-sans text-xs">
                                 {h.performedBy ? h.performedBy.name : 'System / POS'}
                              </td>
                              <td className="p-4 text-gray-500 text-[10px]">
                                 {h.notes || '—'}
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         )}

         {/* Stock Adjustment Modal */}
         {showAdjustModal && selectedProduct && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black p-8 max-w-md w-full space-y-6">
                  <div className="border-b border-black pb-4">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Manual Stock Entry</span>
                     <h3 className="text-base font-black uppercase tracking-tight mt-1">{selectedProduct.name}</h3>
                  </div>

                  <form onSubmit={handleAdjustSubmit} className="space-y-4">
                     {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Select Size Variant</label>
                           <select
                              value={adjustData.variantSize}
                              onChange={(e) => setAdjustData({ ...adjustData, variantSize: e.target.value })}
                              className="w-full p-2.5 border border-black font-mono text-xs bg-white"
                           >
                              {selectedProduct.variants.map((v) => (
                                 <option key={v.size} value={v.size}>
                                    Size {v.size} (Current: {v.stock})
                                 </option>
                              ))}
                           </select>
                        </div>
                     )}

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Adjustment Type</label>
                        <select
                           value={adjustData.transactionType}
                           onChange={(e) => setAdjustData({ ...adjustData, transactionType: e.target.value })}
                           className="w-full p-2.5 border border-black font-mono text-xs bg-white"
                        >
                           <option value="RESTOCK">RESTOCK (+)</option>
                           <option value="MANUAL_ADJUSTMENT">MANUAL ADJUSTMENT (+/-)</option>
                           <option value="DAMAGED">DAMAGED (-)</option>
                           <option value="LOST">LOST (-)</option>
                        </select>
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                           Quantity Change (+ for increase, - for decrease)
                        </label>
                        <Input
                           type="number"
                           required
                           value={adjustData.quantityChange}
                           onChange={(e) => setAdjustData({ ...adjustData, quantityChange: e.target.value })}
                           className="font-mono text-base font-bold"
                        />
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Reason / Notes</label>
                        <textarea
                           rows="3"
                           value={adjustData.notes}
                           onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                           placeholder="Audit note explaining the change..."
                           className="w-full p-2.5 border border-black text-xs font-sans"
                        />
                     </div>

                     <div className="flex gap-4 pt-4 border-t border-black">
                        <Button
                           type="submit"
                           disabled={submittingAdjust}
                           className="flex-1 bg-black text-white text-xs font-black uppercase py-3"
                        >
                           {submittingAdjust ? 'Updating...' : 'Confirm Adjustment'}
                        </Button>
                        <Button
                           type="button"
                           onClick={() => setShowAdjustModal(false)}
                           className="bg-brand-grey border border-black text-black text-xs font-black uppercase px-6"
                        >
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
