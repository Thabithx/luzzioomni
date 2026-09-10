import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const CategoryModal = ({ isOpen, onClose, category, onSave }) => {
   const [formData, setFormData] = useState({
      name: '',
      description: ''
   });

   useEffect(() => {
      if (category) {
         setFormData({
            name: category.name,
            description: category.description || ''
         });
      } else {
         setFormData({
            name: '',
            description: ''
         });
      }
   }, [category, isOpen]);

   if (!isOpen) return null;

   const handleSubmit = (e) => {
      e.preventDefault();
      onSave(formData);
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
         <div className="bg-white w-full max-w-lg border border-black shadow-2xl">
            <div className="p-8 bg-black flex justify-between items-center sticky top-0 z-10">
               <div className="space-y-1">
                  <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em]">Archive Classification</p>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">
                     {category ? 'Modify Scope' : 'Initialize Classification'}
                  </h2>
               </div>
               <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors">
                  <X size={20} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
               <div className="space-y-2">
                  <label className="text-small-brand text-gray-400">Classification Label</label>
                  <Input
                     value={formData.name}
                     onChange={e => setFormData({ ...formData, name: e.target.value })}
                     required
                     disabled={!!category}
                     className={cn(
                        "rounded-none border-black focus:border-black text-small-brand",
                        category && "bg-gray-100 cursor-not-allowed opacity-70"
                     )}
                  />
                  {category && (
                     <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Classification labels are system-locked. Modify tactical description only.
                     </p>
                  )}
               </div>
               <div className="space-y-2">
                  <label className="text-small-brand text-gray-400">Tactical Description</label>
                  <textarea
                     className="w-full border-black focus:border-black focus:ring-0 text-[11px] p-4 min-h-[120px] font-medium leading-relaxed bg-white border"
                     value={formData.description}
                     onChange={e => setFormData({ ...formData, description: e.target.value })}
                     placeholder="Enter classification details..."
                  />
               </div>

               <div className="pt-8 border-t border-black flex justify-end gap-1">
                  <button type="button" onClick={onClose} className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] border border-black hover:bg-black hover:text-white transition-all">
                     Abandon
                  </button>
                  <button type="submit" className="btn-brand px-12 py-5 font-black uppercase tracking-[0.2em]">
                     {category ? 'Authorize Update' : 'Initialize Classification'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

const AdminCategories = () => {
   const [categories, setCategories] = useState([]);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingCategory, setEditingCategory] = useState(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [hasOrderChanges, setHasOrderChanges] = useState(false);
   const { token } = useAuth();

   const fetchCategories = async () => {
      try {
         const res = await api.get('/categories');
         setCategories(res.data.data);
      } catch (err) {
         console.error('Classification retrieval failed:', err);
      }
   };

   useEffect(() => {
      fetchCategories();
   }, []);

   const handleSave = async (formData) => {
      try {
         if (editingCategory) {
            await api.put(`/categories/${editingCategory._id}`, formData);
         } else {
            await api.post('/categories', formData);
         }
         setIsModalOpen(false);
         setEditingCategory(null);
         fetchCategories();
      } catch (err) {
         console.error('Classification synchronization failed:', err);
      }
   };

   const handleDelete = async (id) => {
      if (window.confirm('PROTOCOL: PERMANENT CLASSIFICATION REMOVAL. PROCEED?')) {
         try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
         } catch (err) {
            console.error('De-classification failed:', err);
         }
      }
   };

   const filteredCategories = categories.filter(cat =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat._id.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const moveCategory = (index, direction) => {
      const newCategories = [...categories];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newCategories.length) return;

      [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
      setCategories(newCategories);
      setHasOrderChanges(true);
   };

   const handleSaveOrder = async () => {
      try {
         const orders = categories.map((cat, index) => ({
            id: cat._id,
            sortOrder: index
         }));

         await api.post('/categories/reorder', { orders });
         setHasOrderChanges(false);
         alert('Display order synchronized successfully.');
      } catch (err) {
         console.error('Order synchronization failed:', err);
         alert('Failed to synchronize display order.');
      }
   };

   return (
      <div className="space-y-12 pb-40">
         {/* HEADER SECTION */}
         <div className="flex justify-between items-end border-b border-black pb-8">
            <div className="space-y-4">
               <p className="text-small-brand text-gray-400">Inventory Logic</p>
               <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Archive Classification</h1>
            </div>
            <div className="flex items-center gap-3">
               {hasOrderChanges && (
                  <button
                     onClick={handleSaveOrder}
                     className="px-10 py-5 bg-black text-white font-black uppercase tracking-[0.2em] border border-black hover:bg-white hover:text-black transition-all"
                  >
                     Save Order
                  </button>
               )}
               <button
                  onClick={() => {
                     setEditingCategory(null);
                     setIsModalOpen(true);
                  }}
                  className="btn-brand px-10 py-5 font-black uppercase tracking-[0.2em]"
               >
                  <div className="flex items-center gap-3">
                     <Plus size={16} /> Add Classification
                  </div>
               </button>
            </div>
         </div>

         {/* Search Bar */}
         <div className="w-full max-w-xl relative">
            <Input
               placeholder="Identify classification..."
               className="pl-14 py-6 border-black focus:border-black rounded-none text-small-brand bg-brand-grey/50"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" size={18} />
         </div>

         {/* Table Section */}
         <div className="bg-white border border-black overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
               <thead>
                  <tr className="bg-brand-grey border-b border-black">
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Tag Label</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black text-center">Rank</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Technical Scope</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black text-right">Protocols</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-black">
                  {filteredCategories.map((cat) => (
                     <tr key={cat._id} className="hover:bg-brand-grey transition-all group">
                        <td className="px-8 py-8">
                           <div className="text-[11px] font-black uppercase tracking-tight text-black">{cat.name}</div>
                           <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">CODE: {cat._id.toUpperCase()}</div>
                        </td>
                        <td className="px-8 py-8">
                           <div className="flex justify-center items-center gap-1">
                              <button
                                 onClick={() => moveCategory(categories.indexOf(cat), 'up')}
                                 disabled={categories.indexOf(cat) === 0}
                                 className="p-2 text-black/30 hover:text-black disabled:opacity-0 transition-all"
                              >
                                 <ArrowUp size={14} />
                              </button>
                              <button
                                 onClick={() => moveCategory(categories.indexOf(cat), 'down')}
                                 disabled={categories.indexOf(cat) === categories.length - 1}
                                 className="p-2 text-black/30 hover:text-black disabled:opacity-0 transition-all"
                              >
                                 <ArrowDown size={14} />
                              </button>
                           </div>
                        </td>
                        <td className="px-8 py-8">
                           <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest max-w-lg leading-relaxed">{cat.description || 'NO SYSTEM DESCRIPTION RECORDED.'}</div>
                        </td>
                        <td className="px-8 py-8">
                           <div className="flex justify-end gap-1">
                              <button
                                 className="p-3 text-black/30 hover:text-black hover:bg-white border border-transparent hover:border-black transition-all"
                                 onClick={() => {
                                    setEditingCategory(cat);
                                    setIsModalOpen(true);
                                 }}
                              >
                                 <Edit2 size={16} strokeWidth={1.5} />
                              </button>
                              <button
                                 onClick={() => handleDelete(cat._id)}
                                 className="p-3 text-black/30 hover:text-red-600 hover:bg-white border border-transparent hover:border-black transition-all"
                              >
                                 <Trash2 size={16} strokeWidth={1.5} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <CategoryModal
            isOpen={isModalOpen}
            onClose={() => {
               setIsModalOpen(false);
               setEditingCategory(null);
            }}
            category={editingCategory}
            onSave={handleSave}
         />
      </div>
   );
};

export default AdminCategories;
