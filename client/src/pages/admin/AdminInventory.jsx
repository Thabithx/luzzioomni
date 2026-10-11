// Centralized inventory management dashboard.
// Single source of truth stock registry, low-stock alerts, manual stock adjustments (+/-),
// and auditable stock movement history ledger.

import React, { useState, useEffect } from 'react';
import { Search, Boxes, AlertTriangle, RefreshCw, Plus, History, ArrowUpRight, ArrowDownRight, FileSpreadsheet, Printer, X, Tag } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import { firstError, isBlank } from '../../utils/formValidate';
import { useToast } from '../../components/ui/Toast';
import { exportMultiSheetExcelReport } from '../../utils/excelExporter';


export default function AdminInventory() {
   const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'history' | 'reports'
   const [products, setProducts] = useState([]);
   const [history, setHistory] = useState([]);
   const [reportData, setReportData] = useState(null);
   const [loading, setLoading] = useState(false);
   const [search, setSearch] = useState('');
   const [lowStockFilter, setLowStockFilter] = useState(false);
   const { showToast } = useToast();

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

   // DULARA: Barcode & Shelf Label Printing State
   const [showBarcodeModal, setShowBarcodeModal] = useState(false);
   const [barcodeProduct, setBarcodeProduct] = useState(null);
   const [barcodeSize, setBarcodeSize] = useState('ALL');
   const [barcodeCopies, setBarcodeCopies] = useState(6);

   useEffect(() => {
      if (activeTab === 'registry') {
         fetchInventory();
      } else if (activeTab === 'history') {
         fetchHistory();
      } else if (activeTab === 'reports') {
         fetchReport();
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

   const fetchReport = async () => {
      setLoading(true);
      try {
         const res = await api.get('/inventory/report');
         setReportData(res.data.data);
      } catch (err) {
         console.error('Fetch report error:', err);
      } finally {
         setLoading(false);
      }
   };

   const exportComprehensiveExcelReport = async () => {
      try {
         showToast('Generating multi-sheet inventory & POS audit workbook...', 'info');
         const res = await api.get('/analytics/comprehensive-report');
         if (res.data.success && res.data.data) {
            const { summaryData, inventoryData, posSalesData } = res.data.data;
            exportMultiSheetExcelReport({
               summaryData,
               inventoryData,
               posSalesData,
               filename: `Luzzio_Inventory_Valuation_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
            });
            showToast('Multi-sheet inventory report generated successfully!', 'success');
         }
      } catch (err) {
         console.error('Failed to export comprehensive report:', err);
         showToast('Failed to export inventory Excel report.', 'error');
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

      let qty = Number(adjustData.quantityChange);
      const error = firstError([
         { condition: !selectedProduct,                   message: 'No product selected' },
         { condition: isBlank(adjustData.transactionType), message: 'Please select a transaction type' },
         { condition: isNaN(qty) || qty === 0,             message: 'Quantity change cannot be 0' },
         { condition: !Number.isFinite(qty),               message: 'Please enter a valid quantity number' },
      ]);

      if (error) {
         showToast(error, 'warning');
         return;
      }

      if (adjustData.transactionType === 'DAMAGED' || adjustData.transactionType === 'LOST') {
         qty = -Math.abs(qty);
      } else if (adjustData.transactionType === 'RESTOCK') {
         qty = Math.abs(qty);
      }

      setSubmittingAdjust(true);
      try {
         await api.post('/inventory/adjust', {
            productId: selectedProduct._id,
            variantSize: adjustData.variantSize,
            quantityChange: qty,
            transactionType: adjustData.transactionType,
            notes: adjustData.notes
         });

         setShowAdjustModal(false);
         fetchInventory();
         showToast('Stock adjustment applied successfully.', 'success');
      } catch (err) {
         showToast(err.response?.data?.message || 'Stock adjustment failed.', 'error');
      } finally {
         setSubmittingAdjust(false);
      }
   };

   const openBarcodeModal = (product) => {
      setSelectedProduct(product);
      setBarcodeProduct(product);
      setBarcodeSize(product.variants && product.variants.length > 0 ? product.variants[0].size : 'STD');
      setBarcodeCopies(6);
      setShowBarcodeModal(true);
   };

   const printBarcodeSheet = () => {
      window.print();
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
               <Button
                  onClick={() => setActiveTab('reports')}
                  className={`text-xs font-black uppercase tracking-wider px-5 py-2.5 ${activeTab === 'reports' ? 'bg-white text-black' : 'bg-transparent text-white border border-white'}`}
               >
                  Stock Reports & Valuation
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
                                    <div className="flex items-center justify-end gap-2">
                                       <Button
                                          onClick={() => openAdjustModal(p)}
                                          className="bg-black text-white text-[9px] font-black uppercase px-3 py-1.5"
                                       >
                                          <Plus size={12} className="mr-1 inline" /> Adjust Stock
                                       </Button>
                                       <Button
                                          onClick={() => openBarcodeModal(p)}
                                          variant="outline"
                                          className="border-black text-black hover:bg-black hover:text-white text-[9px] font-black uppercase px-2 py-1.5"
                                       >
                                          <Printer size={12} className="mr-1 inline" /> Barcode
                                       </Button>
                                    </div>
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

         {/* Tab Content: Reports & Valuation */}
         {activeTab === 'reports' && (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-brand-grey p-6 border border-black">
                  <div>
                     <h3 className="text-lg font-black uppercase">Stock Valuation & Inventory Movement Reports</h3>
                     <p className="text-[10px] text-gray-500 mt-1">Real-time inventory valuation summary and multi-sheet audit ledger.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     <Button onClick={exportComprehensiveExcelReport} className="bg-black text-white text-xs font-black uppercase px-6 py-3 flex items-center gap-2">
                        <FileSpreadsheet size={14} />
                        Download Multi-Sheet Report (.XLSX)
                     </Button>
                  </div>
               </div>

               {reportData && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="p-6 bg-white border border-black space-y-1">
                        <p className="text-[10px] font-black uppercase text-gray-400">Total Products</p>
                        <p className="text-2xl font-black">{reportData.totalProducts}</p>
                     </div>
                     <div className="p-6 bg-white border border-black space-y-1">
                        <p className="text-[10px] font-black uppercase text-gray-400">Total Units in Stock</p>
                        <p className="text-2xl font-black">{reportData.totalStockCount.toLocaleString()} units</p>
                     </div>
                     <div className="p-6 bg-white border border-black space-y-1">
                        <p className="text-[10px] font-black uppercase text-gray-400">Total Inventory Valuation</p>
                        <p className="text-2xl font-black text-emerald-700">LKR {reportData.totalStockValuation.toLocaleString()}</p>
                     </div>
                     <div className="p-6 bg-white border border-black space-y-1">
                        <p className="text-[10px] font-black uppercase text-gray-400">Low Stock Items</p>
                        <p className="text-2xl font-black text-red-600">{reportData.lowStockCount}</p>
                     </div>
                  </div>
               )}

               {/* Category Valuation Breakdown */}
               {reportData?.valuationByCategory && (
                  <div className="bg-white border border-black">
                     <div className="p-4 bg-brand-grey border-b border-black">
                        <h4 className="text-xs font-black uppercase tracking-wider">Category-Wise Valuation Breakdown</h4>
                     </div>
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="border-b border-black bg-gray-50 text-[9px] font-black uppercase tracking-wider">
                              <th className="p-4">Category</th>
                              <th className="p-4">Products</th>
                              <th className="p-4">Total Stock</th>
                              <th className="p-4 text-right">Category Valuation (LKR)</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-xs font-mono">
                           {Object.entries(reportData.valuationByCategory).map(([cat, info]) => (
                              <tr key={cat}>
                                 <td className="p-4 font-black">{cat}</td>
                                 <td className="p-4">{info.count} items</td>
                                 <td className="p-4">{info.stock} units</td>
                                 <td className="p-4 text-right font-black">LKR {info.valuation.toLocaleString()}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
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
                           {adjustData.transactionType === 'DAMAGED' || adjustData.transactionType === 'LOST'
                              ? 'Units Lost / Damaged (Will be subtracted from stock)'
                              : adjustData.transactionType === 'RESTOCK'
                              ? 'Units Restocked (Will be added to stock)'
                              : 'Quantity Change (+ for increase, - for decrease)'}
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

         {/* DULARA: Printable Barcode & Shelf Price Label Modal */}
         {showBarcodeModal && barcodeProduct && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 space-y-6">
                  <div className="flex justify-between items-start border-b border-black pb-4">
                     <div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Shelf & Inventory Merchandising</span>
                           <span className="text-[8px] font-bold uppercase bg-black text-white px-2 py-0.5">Dulara</span>
                        </div>
                        <h3 className="text-base font-black uppercase tracking-tight mt-1">Print Barcode & Price Labels</h3>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{barcodeProduct.name} ({barcodeProduct.sku})</p>
                     </div>
                     <button
                        onClick={() => setShowBarcodeModal(false)}
                        className="p-1 hover:opacity-50"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  {/* Print Settings Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-brand-grey p-4 border border-black">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-black block mb-1">Variant Size</label>
                        <select
                           value={barcodeSize}
                           onChange={(e) => setBarcodeSize(e.target.value)}
                           className="w-full p-2 border border-black font-mono text-xs bg-white"
                        >
                           <option value="ALL">All Sizes Combined</option>
                           {(barcodeProduct.variants || []).map(v => (
                              <option key={v.size} value={v.size}>Size {v.size} (Stock: {v.stock})</option>
                           ))}
                        </select>
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-black block mb-1">Number of Label Stickers</label>
                        <select
                           value={barcodeCopies}
                           onChange={(e) => setBarcodeCopies(Number(e.target.value))}
                           className="w-full p-2 border border-black font-mono text-xs bg-white"
                        >
                           <option value={1}>1 Label (Single Item)</option>
                           <option value={2}>2 Labels</option>
                           <option value={4}>4 Labels</option>
                           <option value={6}>6 Labels (Half Sheet)</option>
                           <option value={8}>8 Labels</option>
                           <option value={12}>12 Labels (Full Sheet)</option>
                           <option value={24}>24 Labels (Bulk Intake)</option>
                        </select>
                     </div>
                  </div>

                  {/* Live Barcode Sheet Preview */}
                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                           Sticker Sheet Preview ({barcodeCopies} {barcodeCopies === 1 ? 'sticker' : 'stickers'})
                        </span>
                        <span className="text-[9px] font-mono text-gray-400">Standard 50mm x 30mm label sizing</span>
                     </div>

                     <div
                        id="printable-barcode-sheet"
                        className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 border border-black max-h-[360px] overflow-y-auto"
                     >
                        {Array.from({ length: barcodeCopies }).map((_, index) => {
                           const barcodeVal = barcodeProduct.barcode || barcodeProduct.sku || `LUZ-${barcodeProduct._id.slice(-6).toUpperCase()}`;
                           const priceVal = barcodeProduct.salePrice > 0 ? barcodeProduct.salePrice : barcodeProduct.price;

                           return (
                              <div
                                 key={index}
                                 className="barcode-sticker border-2 border-dashed border-black bg-white p-3 flex flex-col items-center justify-between text-center min-h-[140px] shadow-sm"
                              >
                                 <div className="w-full border-b border-black/20 pb-1 mb-1">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-black leading-none">LUZZIO</p>
                                    <p className="text-[9px] font-black uppercase truncate mt-0.5 text-black">{barcodeProduct.name}</p>
                                    <p className="text-[8px] font-mono font-bold text-gray-600">
                                       {barcodeSize === 'ALL' ? 'STD FIT' : `SIZE: ${barcodeSize}`} • {barcodeProduct.category?.name || barcodeProduct.category || 'APPAREL'}
                                    </p>
                                 </div>

                                 {/* Barcode Lines Visual */}
                                 <div className="w-full flex flex-col items-center my-1">
                                    <div className="flex items-center justify-center gap-[2px] h-9 w-full overflow-hidden px-2">
                                       {Array.from({ length: 34 }).map((_, barIdx) => {
                                          const isThick = (barIdx * 7) % 3 === 0;
                                          const isGap = (barIdx * 13) % 5 === 0;
                                          return (
                                             <div
                                                key={barIdx}
                                                style={{
                                                   width: isThick ? '3px' : '1.5px',
                                                   height: '36px',
                                                   backgroundColor: isGap ? 'transparent' : '#000000'
                                                }}
                                             />
                                          );
                                       })}
                                    </div>
                                    <p className="font-mono text-[9px] font-black tracking-widest text-black mt-1">
                                       *{barcodeVal}*
                                    </p>
                                 </div>

                                 <div className="w-full border-t border-black/20 pt-1 mt-1 flex justify-between items-center text-left">
                                    <span className="text-[8px] font-mono text-gray-400 uppercase">PRICE:</span>
                                    <span className="text-[11px] font-black font-mono text-black">
                                       LKR {priceVal.toLocaleString()}.00
                                    </span>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t border-black">
                     <Button
                        onClick={printBarcodeSheet}
                        className="flex-1 bg-black text-white text-xs font-black uppercase py-3 flex items-center justify-center gap-2 shadow-sm"
                     >
                        <Printer size={14} /> Print Sticker Sheet ({barcodeCopies} Labels)
                     </Button>
                     <Button
                        type="button"
                        onClick={() => setShowBarcodeModal(false)}
                        className="bg-brand-grey border border-black text-black text-xs font-black uppercase px-6"
                     >
                        Close
                     </Button>
                  </div>
               </div>
            </div>
         )}

         {/* Embedded Print CSS Rules */}
         <style>{`
            @media print {
               body * {
                  visibility: hidden !important;
               }
               #printable-barcode-sheet, #printable-barcode-sheet * {
                  visibility: visible !important;
               }
               #printable-barcode-sheet {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100vw !important;
                  max-height: none !important;
                  border: none !important;
                  background: white !important;
                  padding: 10mm !important;
                  grid-template-columns: repeat(3, 1fr) !important;
                  gap: 5mm !important;
                  z-index: 999999 !important;
               }
               .barcode-sticker {
                  page-break-inside: avoid !important;
                  border: 1px solid #000000 !important;
               }
            }
         `}</style>
      </div>
   );
}
