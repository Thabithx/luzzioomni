import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, ExternalLink, X, Upload, Loader2, GripVertical } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableImage = ({ url, index, onRemove }) => {
   const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
   } = useSortable({ id: url });

   const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 100 : 0,
      opacity: isDragging ? 0.5 : 1
   };

   return (
      <div
         ref={setNodeRef}
         style={style}
         className="w-full aspect-[3/4] bg-white border border-black overflow-hidden relative group"
      >
         <img
            src={url}
            alt={`Asset ${index + 1}`}
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable={false}
         />

         {/* Drag Handle Indicator */}
         <div
            className="absolute top-2 left-2 p-1 bg-black/50 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
         >
            <GripVertical size={12} />
         </div>

         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4 pointer-events-none">
            {/* Note: pointer-events-none on the overlay container to let clicks pass through, 
                 but we need pointer-events-auto on the buttons/handles */}
            <p className="text-[7px] text-white/60 font-black uppercase tracking-widest">Asset {index + 1}</p>
            <div className="flex gap-2 pointer-events-auto">
               <button
                  type="button"
                  onClick={(e) => {
                     e.stopPropagation();
                     onRemove();
                  }}
                  className="p-2.5 bg-white text-black hover:bg-red-600 hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0"
                  title="Release Asset"
               >
                  <Trash2 size={14} />
               </button>
            </div>
         </div>
      </div>
   );
};

const ProductModal = ({ isOpen, onClose, product, onSave, categories }) => {
   const [formData, setFormData] = useState({
      name: '',
      price: '',
      categories: [],
      stock: '',
      description: '',
      images: [''],
      sizes: ['S', 'M', 'L'],
      variants: [
         { size: 'S', stock: '' },
         { size: 'M', stock: '' },
         { size: 'L', stock: '' }
      ],
      colors: [],
      material: '',
      salePrice: '',
      sizeChart: ''
   });
   const [uploading, setUploading] = useState(false);
   const { token } = useAuth();

   // dnd-kit sensors
   const sensors = useSensors(
      useSensor(MouseSensor, {
         activationConstraint: {
            distance: 10,
         },
      }),
      useSensor(TouchSensor, {
         activationConstraint: {
            delay: 250,
            tolerance: 5,
         },
      })
   );

   useEffect(() => {
      if (product) {
         // Handle both old single category and new categories array
         let productCategories = [];
         if (product.categories && Array.isArray(product.categories)) {
            productCategories = product.categories.map(cat => typeof cat === 'object' ? cat._id : cat);
         } else if (product.category) {
            productCategories = [typeof product.category === 'object' ? product.category._id : product.category];
         }

         setFormData({
            ...product,
            categories: productCategories,
            images: product.images.length > 0 ? product.images : [''],
            colors: product.colors || [],
            material: product.material || '',
            salePrice: product.salePrice || '',
            sizeChart: product.sizeChart || '',
            variants: product.variants || (product.sizes || []).map(s => ({ size: s, stock: '' }))
         });
      } else {
         setFormData({
            name: '',
            price: '',
            categories: [],
            stock: '',
            description: '',
            images: [''],
            sizes: ['S', 'M', 'L'],
            variants: [
               { size: 'S', stock: '' },
               { size: 'M', stock: '' },
               { size: 'L', stock: '' }
            ],
            colors: [],
            material: '',
            salePrice: '',
            sizeChart: ''
         });
      }
   }, [product, isOpen, categories]);

   if (!isOpen) return null;

   const handleUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const currentImages = formData.images.filter(img => img !== '');
      if (currentImages.length + files.length > 10) {
         alert('Maximum 10 images allowed per product');
         return;
      }

      const uploadData = new FormData();
      files.forEach(file => {
         uploadData.append('images', file);
      });

      try {
         setUploading(true);
         const res = await api.post('/upload', uploadData, {
            headers: {
               'Content-Type': 'multipart/form-data'
            }
         });

         const newUrls = res.data.files.map(f => f.url);
         setFormData({
            ...formData,
            images: [...currentImages, ...newUrls]
         });
      } catch (err) {
         console.error('Asset upload failed:', err);
         alert('FAILED TO UPLOAD ARCHIVE ASSET: ' + (err.response?.data?.message || err.message));
      } finally {
         setUploading(false);
      }
   };

   const handleDragEnd = (event) => {
      const { active, over } = event;

      if (active.id !== over.id) {
         setFormData((items) => {
            const oldIndex = items.images.indexOf(active.id);
            const newIndex = items.images.indexOf(over.id);

            return {
               ...items,
               images: arrayMove(items.images, oldIndex, newIndex)
            };
         });
      }
   };

   const handleSubmit = (e) => {
      e.preventDefault();

      // Calculate total stock from variants
      const totalStock = formData.variants?.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0) || 0;

      // Prepare payload with number versions of stock
      const payload = {
         ...formData,
         stock: totalStock,
         variants: formData.variants?.map(v => ({
            ...v,
            stock: parseInt(v.stock) || 0
         })) || []
      };

      onSave(payload);
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
         <div className="bg-white w-full max-w-2xl max-h-[95vh] overflow-y-auto overflow-x-hidden border border-black shadow-2xl">
            <div className="p-8 bg-black flex justify-between items-center sticky top-0 z-10">
               <div className="space-y-1">
                  <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em]">Archive Protocol</p>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">
                     {product ? 'Modify Entry' : 'Create New Archive'}
                  </h2>
               </div>
               <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors">
                  <X size={20} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-small-brand text-gray-400">Inventory Label</label>
                     <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="rounded-none border-black focus:border-black"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-small-brand text-gray-400">Acquisition Price (LKR)</label>
                     <Input
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        required
                        className="rounded-none border-black focus:border-black"
                     />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-small-brand text-gray-400">Category Tags (Multiple)</label>

                     <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-3 border border-black/10 bg-gray-50">
                        {formData.categories.length > 0 ? (
                           formData.categories.map((catId) => {
                              const cat = categories.find(c => c._id === catId);
                              return cat ? (
                                 <span key={catId} className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest">
                                    {cat.name}
                                    <button
                                       type="button"
                                       onClick={() => {
                                          setFormData({
                                             ...formData,
                                             categories: formData.categories.filter(id => id !== catId)
                                          });
                                       }}
                                       className="hover:text-red-500 transition-colors"
                                    >
                                       <X size={10} />
                                    </button>
                                 </span>
                              ) : null;
                           })
                        ) : (
                           <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">No categories selected</span>
                        )}
                     </div>

                     <select
                        className="w-full border-black focus:border-black focus:ring-0 text-[11px] h-10 px-3 font-black appearance-none bg-white rounded-none border"
                        value=""
                        onChange={e => {
                           const catId = e.target.value;
                           if (catId && !formData.categories.includes(catId)) {
                              setFormData({
                                 ...formData,
                                 categories: [...formData.categories, catId]
                              });
                           }
                        }}
                     >
                        <option value="">+ Add Category</option>
                        {categories.filter(cat => !formData.categories.includes(cat._id)).map(cat => (
                           <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-small-brand text-gray-400">Stock Count (Total)</label>
                     <Input
                        type="number"
                        value={formData.stock}
                        readOnly
                        placeholder="Calculated from sizes"
                        className="rounded-none border-black bg-gray-50 cursor-not-allowed opacity-60"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-small-brand text-gray-400">Material Composition</label>
                     <Input
                        value={formData.material}
                        onChange={e => setFormData({ ...formData, material: e.target.value })}
                        placeholder="e.g. 100% Organic Cotton"
                        className="rounded-none border-black focus:border-black"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-small-brand text-gray-400">Market Value / Sale Price (LKR)</label>
                     <Input
                        type="number"
                        value={formData.salePrice}
                        onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
                        placeholder="Leave empty for no discount"
                        className="rounded-none border-black focus:border-black"
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-small-brand text-gray-400">Technical Description</label>
                  <textarea
                     className="w-full border-black focus:border-black focus:ring-0 text-[11px] p-4 min-h-[120px] font-medium leading-relaxed bg-white border"
                     value={formData.description}
                     onChange={e => setFormData({ ...formData, description: e.target.value })}
                     required
                     placeholder="Enter product specifications..."
                  />
               </div>

               {/* SIZE & INVENTORY MANAGEMENT */}
               <div className="space-y-6 pt-4 border-t border-black/10">
                  <div className="space-y-4">
                     <label className="text-small-brand text-gray-400">Available Sizes (Custom Dimensions)</label>
                     <div className="flex flex-wrap gap-2 mb-4">
                        {formData.sizes?.map((size, index) => (
                           <span key={index} className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest">
                              {size}
                              <button
                                 type="button"
                                 onClick={() => {
                                    const newSizes = formData.sizes.filter((_, i) => i !== index);
                                    const newVariants = formData.variants.filter(v => v.size !== size);
                                    setFormData({ ...formData, sizes: newSizes, variants: newVariants });
                                 }}
                                 className="hover:text-red-500 transition-colors"
                              >
                                 <X size={10} />
                              </button>
                           </span>
                        ))}
                        {formData.sizes?.length === 0 && (
                           <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">No sizes defined</span>
                        )}
                     </div>

                     <div className="space-y-3 bg-gray-50 p-4 border border-black/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-2">Inventory Levels (Units)</p>
                        <div className="grid grid-cols-2 gap-4">
                           {formData.variants?.map((variant, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                 <span className="text-[10px] font-black uppercase w-8">{variant.size}</span>
                                 <Input
                                    type="number"
                                    placeholder="QTY"
                                    value={variant.stock}
                                    onChange={(e) => {
                                       const newVariants = [...formData.variants];
                                       newVariants[idx].stock = e.target.value;
                                       setFormData({ ...formData, variants: newVariants });
                                    }}
                                    className="h-8 text-[10px] rounded-none border-black/20 focus:border-black"
                                 />
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="flex gap-2">
                        <Input
                           placeholder="Add size (e.g. UK 6, 42, OS)..."
                           className="flex-1 rounded-none border-black focus:border-black text-[10px] font-bold"
                           onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                 e.preventDefault();
                                 const val = e.target.value.trim();
                                 if (val && !formData.variants.some(v => v.size === val)) {
                                    setFormData({
                                       ...formData,
                                       sizes: [...(formData.sizes || []), val],
                                       variants: [...(formData.variants || []), { size: val, stock: '' }]
                                    });
                                    e.target.value = '';
                                 }
                              }
                           }}
                        />
                        <Button
                           type="button"
                           onClick={(e) => {
                              const input = e.currentTarget.previousSibling;
                              const val = input.value.trim();
                              if (val && !formData.variants.some(v => v.size === val)) {
                                 setFormData({
                                    ...formData,
                                    sizes: [...(formData.sizes || []), val],
                                    variants: [...(formData.variants || []), { size: val, stock: '' }]
                                 });
                                 input.value = '';
                              }
                           }}
                           className="px-6 py-2 h-10 text-[10px] font-black uppercase tracking-widest"
                        >
                           Add
                        </Button>
                     </div>
                  </div>

                  <div className="pt-6 space-y-2">
                     <label className="text-small-brand text-gray-400">Size Chart Guide (Image)</label>
                     <div className="flex gap-4 items-center">
                        {formData.sizeChart ? (
                           <div className="relative group w-24 h-24 border border-black">
                              <img src={formData.sizeChart} alt="Size Chart" className="w-full h-full object-cover" />
                              <button
                                 type="button"
                                 onClick={() => setFormData({ ...formData, sizeChart: '' })}
                                 className="absolute top-0 right-0 p-1 bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                 <X size={12} />
                              </button>
                           </div>
                        ) : (
                           <div className="relative border border-dashed border-black/20 hover:border-black transition-colors w-24 h-24 flex flex-col items-center justify-center gap-2 bg-brand-grey/30 group">
                              {uploading ? (
                                 <Loader2 size={16} className="animate-spin text-black" />
                              ) : (
                                 <Upload size={16} className="text-black/40 group-hover:text-black" />
                              )}
                              <p className="text-[7px] font-black uppercase tracking-widest text-center px-1">Upload Guide</p>
                              <input
                                 type="file"
                                 className="absolute inset-0 opacity-0 cursor-pointer"
                                 onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const data = new FormData();
                                    data.append('images', file);
                                    try {
                                       setUploading(true);
                                       const res = await api.post('/upload', data, {
                                          headers: { 'Content-Type': 'multipart/form-data' }
                                       });
                                       setFormData({ ...formData, sizeChart: res.data.files[0].url });
                                    } catch (err) {
                                       alert('Upload failed');
                                    } finally {
                                       setUploading(false);
                                    }
                                 }}
                                 disabled={uploading}
                                 accept="image/*"
                              />
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* COLOR MANAGEMENT */}
               <div className="space-y-4 pt-4 border-t border-black/10">
                  <label className="text-small-brand text-gray-400">Available Palette (Colors)</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                     {formData.colors?.map((color, index) => (
                        <span key={index} className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest">
                           {color}
                           <button
                              type="button"
                              onClick={() => {
                                 const newColors = formData.colors.filter((_, i) => i !== index);
                                 setFormData({ ...formData, colors: newColors });
                              }}
                              className="hover:text-red-500 transition-colors"
                           >
                              <X size={10} />
                           </button>
                        </span>
                     ))}
                     {formData.colors?.length === 0 && (
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">No colors defined</span>
                     )}
                  </div>
                  <div className="flex gap-2">
                     <Input
                        placeholder="Add color (e.g. Midnight Black)..."
                        className="flex-1 rounded-none border-black focus:border-black text-[10px] font-bold"
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.target.value.trim();
                              if (val && !formData.colors.includes(val)) {
                                 setFormData({ ...formData, colors: [...formData.colors, val] });
                                 e.target.value = '';
                              }
                           }
                        }}
                     />
                     <Button
                        type="button"
                        onClick={(e) => {
                           const input = e.currentTarget.previousSibling;
                           const val = input.value.trim();
                           if (val && !formData.colors.includes(val)) {
                              setFormData({ ...formData, colors: [...formData.colors, val] });
                              input.value = '';
                           }
                        }}
                        className="px-6 py-2 h-10 text-[10px] font-black uppercase tracking-widest"
                     >
                        Add
                     </Button>
                  </div>
                  <p className="text-[8px] text-gray-400 italic">Press Enter to register color tag</p>
               </div>

               {/* ASSET MANAGEMENT */}
               <div className="space-y-6 pt-4 border-t border-black/10">
                  <div className="space-y-4">
                     <label className="text-small-brand text-gray-400">Archive Assets (Visual) - Max 10 Documents</label>

                     <div className="space-y-4">
                        {/* Dnd Context for Sorting */}
                        <DndContext
                           sensors={sensors}
                           collisionDetection={closestCenter}
                           onDragEnd={handleDragEnd}
                        >
                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                              {/* Static Upload Card - Always First */}
                              <div className="relative border border-dashed border-black/20 hover:border-black transition-colors aspect-[3/4] flex flex-col items-center justify-center gap-3 bg-brand-grey/30 group cursor-pointer">
                                 {uploading ? (
                                    <Loader2 size={20} className="animate-spin text-black" />
                                 ) : (
                                    <Upload size={20} className="text-black/40 group-hover:text-black transition-colors" />
                                 )}
                                 <p className="text-[8px] font-black uppercase tracking-widest text-center px-2">
                                    {uploading ? 'Synchronizing...' : 'Upload Sequence Assets'}
                                 </p>
                                 <input
                                    type="file"
                                    multiple
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleUpload}
                                    disabled={uploading}
                                    accept="image/*"
                                 />
                              </div>

                              <SortableContext
                                 items={formData.images.filter(img => img !== '')}
                                 strategy={rectSortingStrategy}
                              >
                                 {formData.images.filter(img => img !== '').map((img, index) => (
                                    <SortableImage
                                       key={img}
                                       url={img}
                                       index={index}
                                       onRemove={() => {
                                          const newImages = formData.images.filter((_, i) => _.valueOf() !== img);
                                          setFormData({ ...formData, images: newImages.length > 0 ? newImages : [''] });
                                       }}
                                    />
                                 ))}
                              </SortableContext>
                           </div>
                        </DndContext>
                     </div>
                  </div>
               </div>

               <div className="pt-8 border-t border-black flex justify-end gap-1">
                  <button type="button" onClick={onClose} className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] border border-black hover:bg-black hover:text-white transition-all">
                     Abandon
                  </button>
                  <button type="submit" className="btn-brand px-12 py-5 font-black uppercase tracking-[0.2em]" disabled={uploading}>
                     {product ? 'Authorize Update' : 'Initialize Entry'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

const AdminProducts = () => {
   const [products, setProducts] = useState([]);
   const [categories, setCategories] = useState([]);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingProduct, setEditingProduct] = useState(null);
   const [searchTerm, setSearchTerm] = useState('');
   const { token } = useAuth();

   const fetchData = async () => {
      try {
         const [prodRes, catRes] = await Promise.all([
            api.get('/products'),
            api.get('/categories')
         ]);
         setProducts(prodRes.data.data);
         setCategories(catRes.data.data);
      } catch (err) {
         console.error('Archive retrieval failed:', err);
         alert('FAILED TO RETRIEVE ARCHIVE: ' + (err.response?.data?.message || err.message));
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   const handleSave = async (formData) => {
      try {
         const dataToSave = {
            ...formData,
            salePrice: formData.salePrice === '' ? 0 : Number(formData.salePrice),
            price: Number(formData.price),
            stock: (formData.variants || []).reduce((acc, v) => acc + (Number(v.stock) || 0), 0),
            variants: (formData.variants || []).map(v => ({ ...v, stock: Number(v.stock) || 0 }))
         };

         if (editingProduct) {
            await api.put(`/products/${editingProduct._id}`, dataToSave);
         } else {
            await api.post('/products', dataToSave);
         }
         setIsModalOpen(false);
         setEditingProduct(null);
         fetchData();
      } catch (err) {
         console.error('Archive synchronization failed:', err);
         alert('ARCHIVE SYNCHRONIZATION FAILED: ' + (err.response?.data?.message || err.message));
      }
   };

   const handleDelete = async (id) => {
      if (window.confirm('Confirm permanent deletion?')) {
         try {
            await api.delete(`/products/${id}`);
            fetchData();
         } catch (err) {
            console.error('De-archiving failed:', err);
         }
      }
   };

   const filteredProducts = products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p._id.toLowerCase().includes(searchTerm.toLowerCase())
   );

   return (
      <div className="space-y-12 pb-40">
         {/* HEADER SECTION */}
         <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-black pb-8 gap-6">
            <div className="space-y-4">
               <p className="text-small-brand text-gray-400">Digital Archive</p>
               <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Inventory Registry</h1>
            </div>
            <button
               onClick={() => {
                  setEditingProduct(null);
                  setIsModalOpen(true);
               }}
               className="btn-brand px-10 py-5 font-black uppercase tracking-[0.2em]"
            >
               <div className="flex items-center gap-3">
                  <Plus size={16} /> Create Archive Entry
               </div>
            </button>
         </div>

         {/* Search Bar */}
         <div className="w-full max-w-xl relative">
            <Input
               placeholder="Identify entry (search)..."
               className="pl-14 py-6 border-black focus:border-black rounded-none bg-brand-grey/50"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" size={18} />
         </div>

         {/* Table Section */}
         <div className="bg-white border border-black">
            <div className="overflow-x-auto w-full max-w-full">
               <table className="w-full text-left min-w-[1000px]">
                  <thead>
                     <tr className="bg-brand-grey border-b border-black">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Visual</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Label</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Acquisition Tag</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Market Value</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Archive Count</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black text-right">Protocols</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                     {filteredProducts.map((product) => (
                        <tr key={product._id} className="hover:bg-brand-grey transition-all group">
                           <td className="px-8 py-6">
                              <div className="w-16 aspect-[3/4] bg-white border border-black overflow-hidden shadow-sm group-hover:bg-white transition-all">
                                 <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="text-[11px] font-black uppercase tracking-tight text-black">{product.name}</div>
                              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">CODE: {product._id.toUpperCase()}</div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-wrap gap-1">
                                 {product.categories && product.categories.length > 0 ? (
                                    product.categories.map((cat) => {
                                       const categoryName = typeof cat === 'object' ? cat.name : categories.find(c => c._id === cat)?.name;
                                       return categoryName ? (
                                          <span key={typeof cat === 'object' ? cat._id : cat} className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-white border border-black">
                                             {categoryName}
                                          </span>
                                       ) : null;
                                    })
                                 ) : (
                                    // Fallback for old single category field
                                    product.category ? (
                                       <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-white border border-black">
                                          {typeof product.category === 'object' ? product.category?.name : categories.find(c => c._id === product.category)?.name || 'UNCLASSIFIED'}
                                       </span>
                                    ) : (
                                       <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-gray-100 border border-gray-300 text-gray-400">
                                          NO CATEGORY
                                       </span>
                                    )
                                 )}
                              </div>
                           </td>
                           <td className="px-8 py-6 text-[11px] font-black text-black">
                              {product.salePrice > 0 ? (
                                 <div className="flex flex-col">
                                    <span className="text-black">LKR {product.salePrice.toLocaleString()}.00</span>
                                    <span className="text-[9px] text-gray-400 line-through">LKR {product.price.toLocaleString()}.00</span>
                                 </div>
                              ) : (
                                 <span>LKR {product.price.toLocaleString()}.00</span>
                              )}
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <div className={cn(
                                    "w-1.5 h-1.5",
                                    product.stock < 10 ? "bg-black animate-pulse" : "bg-black"
                                 )}></div>
                                 <span className="text-[11px] font-black uppercase">{product.stock} Units</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex justify-end gap-1">
                                 <button
                                    className="p-3 text-black/30 hover:text-black hover:bg-white border border-transparent hover:border-black transition-all"
                                    onClick={() => {
                                       setEditingProduct(product);
                                       setIsModalOpen(true);
                                    }}
                                 >
                                    <Edit2 size={16} strokeWidth={1.5} />
                                 </button>
                                 <button
                                    onClick={() => handleDelete(product._id)}
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
         </div>

         <ProductModal
            isOpen={isModalOpen}
            onClose={() => {
               setIsModalOpen(false);
               setEditingProduct(null);
            }}
            product={editingProduct}
            onSave={handleSave}
            categories={categories}
         />
      </div>
   );
};

export default AdminProducts;
