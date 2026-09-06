import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, MoveUp, MoveDown } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminFAQ() {
   const { token } = useAuth();
   const [faqs, setFaqs] = useState([]);
   const [loading, setLoading] = useState(true);
   const [editingId, setEditingId] = useState(null);
   const [isAdding, setIsAdding] = useState(false);
   const [formData, setFormData] = useState({
      question: '',
      answer: '',
      category: 'General',
      order: 0,
      isPublished: true
   });

   const categories = ['Shipping', 'Returns', 'Payment', 'Products', 'Account', 'General'];

   useEffect(() => {
      fetchFAQs();
   }, []);

   const fetchFAQs = async () => {
      setLoading(true);
      try {
         const res = await api.get('/faq/admin');
         if (res.data.success) {
            setFaqs(res.data.data);
         }
      } catch (error) {
         console.error('Error fetching FAQs:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData({
         ...formData,
         [name]: type === 'checkbox' ? checked : value
      });
   };

   const handleAdd = async () => {
      try {
         const res = await api.post('/faq', formData);
         if (res.data.success) {
            setFaqs([...faqs, res.data.data]);
            setIsAdding(false);
            resetForm();
         }
      } catch (error) {
         console.error('Error adding FAQ:', error);
         alert('Failed to add FAQ');
      }
   };

   const handleEdit = (faq) => {
      setEditingId(faq._id);
      setFormData({
         question: faq.question,
         answer: faq.answer,
         category: faq.category,
         order: faq.order,
         isPublished: faq.isPublished
      });
   };

   const handleUpdate = async (id) => {
      try {
         const res = await api.put(`/faq/${id}`, formData);
         if (res.data.success) {
            setFaqs(faqs.map(faq => faq._id === id ? res.data.data : faq));
            setEditingId(null);
            resetForm();
         }
      } catch (error) {
         console.error('Error updating FAQ:', error);
         alert('Failed to update FAQ');
      }
   };

   const handleDelete = async (id) => {
      if (!confirm('Are you sure you want to delete this FAQ?')) return;

      try {
         await api.delete(`/faq/${id}`);
         setFaqs(faqs.filter(faq => faq._id !== id));
      } catch (error) {
         console.error('Error deleting FAQ:', error);
         alert('Failed to delete FAQ');
      }
   };

   const handleReorder = async (id, direction) => {
      const index = faqs.findIndex(f => f._id === id);
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === faqs.length - 1)) return;

      const newFaqs = [...faqs];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newFaqs[index], newFaqs[targetIndex]] = [newFaqs[targetIndex], newFaqs[index]];

      // Update order values
      newFaqs.forEach((faq, idx) => {
         faq.order = idx;
      });

      setFaqs(newFaqs);

      // Update in backend
      try {
         await api.put(`/faq/${id}`, { order: newFaqs[targetIndex].order });
      } catch (error) {
         console.error('Error reordering FAQ:', error);
      }
   };

   const resetForm = () => {
      setFormData({
         question: '',
         answer: '',
         category: 'General',
         order: 0,
         isPublished: true
      });
   };

   const cancelEdit = () => {
      setEditingId(null);
      setIsAdding(false);
      resetForm();
   };

   return (
      <div className="p-8">
         <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tight">FAQ Management</h1>
            <button
               onClick={() => setIsAdding(true)}
               className="btn-brand px-6 py-3 flex items-center gap-2"
               disabled={isAdding || editingId}
            >
               <Plus size={16} />
               Add FAQ
            </button>
         </div>

         {/* Add New FAQ Form */}
         {isAdding && (
            <div className="bg-brand-grey border border-black p-6 mb-6">
               <h3 className="text-[12px] font-black uppercase tracking-widest mb-4">New FAQ</h3>
               <div className="space-y-4">
                  <input
                     type="text"
                     name="question"
                     placeholder="Question"
                     value={formData.question}
                     onChange={handleInputChange}
                     className="w-full border border-black px-4 py-3 text-[11px] font-medium"
                  />
                  <textarea
                     name="answer"
                     placeholder="Answer"
                     value={formData.answer}
                     onChange={handleInputChange}
                     rows={4}
                     className="w-full border border-black px-4 py-3 text-[11px] font-medium tracking-wide resize-none"
                  />
                  <div className="grid grid-cols-3 gap-4">
                     <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="border border-black px-4 py-3 text-[11px] font-medium uppercase tracking-widest"
                     >
                        {categories.map(cat => (
                           <option key={cat} value={cat}>{cat}</option>
                        ))}
                     </select>
                     <input
                        type="number"
                        name="order"
                        placeholder="Order"
                        value={formData.order}
                        onChange={handleInputChange}
                        className="border border-black px-4 py-3 text-[11px] font-medium"
                     />
                     <label className="flex items-center gap-2 border border-black px-4 py-3">
                        <input
                           type="checkbox"
                           name="isPublished"
                           checked={formData.isPublished}
                           onChange={handleInputChange}
                        />
                        <span className="text-[11px] font-medium uppercase tracking-widest">Published</span>
                     </label>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={handleAdd} className="btn-brand px-6 py-2 flex items-center gap-2">
                        <Save size={14} />
                        Save
                     </button>
                     <button onClick={cancelEdit} className="border border-black px-6 py-2 hover:bg-black hover:text-white transition-colors">
                        <X size={14} />
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* FAQ List */}
         {loading ? (
            <div className="text-center py-20">
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading FAQs...</p>
            </div>
         ) : (
            <div className="space-y-4">
               {faqs.map((faq, index) => (
                  <div key={faq._id} className="border border-black bg-white">
                     {editingId === faq._id ? (
                        <div className="p-6 space-y-4">
                           <input
                              type="text"
                              name="question"
                              value={formData.question}
                              onChange={handleInputChange}
                              className="w-full border border-black px-4 py-3 text-[11px] font-medium"
                           />
                           <textarea
                              name="answer"
                              value={formData.answer}
                              onChange={handleInputChange}
                              rows={4}
                              className="w-full border border-black px-4 py-3 text-[11px] font-medium tracking-wide resize-none"
                           />
                           <div className="grid grid-cols-3 gap-4">
                              <select
                                 name="category"
                                 value={formData.category}
                                 onChange={handleInputChange}
                                 className="border border-black px-4 py-3 text-[11px] font-medium uppercase tracking-widest"
                              >
                                 {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                 ))}
                              </select>
                              <input
                                 type="number"
                                 name="order"
                                 value={formData.order}
                                 onChange={handleInputChange}
                                 className="border border-black px-4 py-3 text-[11px] font-medium"
                              />
                              <label className="flex items-center gap-2 border border-black px-4 py-3">
                                 <input
                                    type="checkbox"
                                    name="isPublished"
                                    checked={formData.isPublished}
                                    onChange={handleInputChange}
                                 />
                                 <span className="text-[11px] font-medium uppercase tracking-widest">Published</span>
                              </label>
                           </div>
                           <div className="flex gap-3">
                              <button onClick={() => handleUpdate(faq._id)} className="btn-brand px-6 py-2 flex items-center gap-2">
                                 <Save size={14} />
                                 Update
                              </button>
                              <button onClick={cancelEdit} className="border border-black px-6 py-2 hover:bg-black hover:text-white transition-colors">
                                 <X size={14} />
                              </button>
                           </div>
                        </div>
                     ) : (
                        <div className="p-6">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                 <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-black text-white">
                                       {faq.category}
                                    </span>
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">
                                       Order: {faq.order}
                                    </span>
                                    {!faq.isPublished && (
                                       <span className="text-[8px] font-bold uppercase tracking-widest text-red-600">
                                          Unpublished
                                       </span>
                                    )}
                                 </div>
                                 <h3 className="text-[11px] font-black uppercase tracking-tight mb-2">
                                    {faq.question}
                                 </h3>
                                 <p className="text-[10px] font-medium leading-relaxed text-gray-700">
                                    {faq.answer}
                                 </p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                 <button
                                    onClick={() => handleReorder(faq._id, 'up')}
                                    disabled={index === 0}
                                    className="p-2 border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-30"
                                 >
                                    <MoveUp size={14} />
                                 </button>
                                 <button
                                    onClick={() => handleReorder(faq._id, 'down')}
                                    disabled={index === faqs.length - 1}
                                    className="p-2 border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-30"
                                 >
                                    <MoveDown size={14} />
                                 </button>
                                 <button
                                    onClick={() => handleEdit(faq)}
                                    className="p-2 border border-black hover:bg-black hover:text-white transition-colors"
                                 >
                                    <Edit2 size={14} />
                                 </button>
                                 <button
                                    onClick={() => handleDelete(faq._id)}
                                    className="p-2 border border-black hover:bg-red-600 hover:text-white transition-colors"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
