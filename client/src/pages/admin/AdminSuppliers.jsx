// THABITH SRIHARAN
// Supplier / Vendor procurement management interface.
// Create, edit, and manage supplier profiles for product procurement and purchase order generation.

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Truck, RefreshCw, X, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';

export default function AdminSuppliers() {
   const [suppliers, setSuppliers] = useState([]);
   const [loading, setLoading] = useState(false);
   const [search, setSearch] = useState('');

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

   useEffect(() => {
      fetchSuppliers();
   }, []);

   const fetchSuppliers = async () => {
      setLoading(true);
      try {
         const res = await api.get(`/suppliers?search=${encodeURIComponent(search)}`);
         setSuppliers(res.data.data || []);
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
      try {
         if (editingSupplier) {
            await api.put(`/suppliers/${editingSupplier._id}`, formData);
         } else {
            await api.post('/suppliers', formData);
         }
         setShowModal(false);
         fetchSuppliers();
      } catch (err) {
         alert(err.response?.data?.message || 'Failed to save supplier');
      }
   };

   const handleDelete = async (id) => {
      if (!window.confirm('Are you sure you want to remove this supplier?')) return;
      try {
         await api.delete(`/suppliers/${id}`);
         fetchSuppliers();
      } catch (err) {
         alert(err.response?.data?.message || 'Failed to delete supplier');
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
                     </div>

                     <div className="pt-4 border-t border-black flex gap-2">
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
      </div>
   );
}
