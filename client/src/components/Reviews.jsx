import React, { useState, useMemo } from 'react';
import { Star, Upload, X, Check, Loader2, Award, ShieldCheck, ChevronDown, User, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from '../utils/cn';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export function Reviews({ productId, reviews = [], onReviewAdded, onReviewDeleted }) {
   const { user } = useAuth();
   const isAdmin = user?.role === 'admin';

   const [isWritingReview, setIsWritingReview] = useState(false);
   const [sortBy, setSortBy] = useState('newest'); // newest, highest, lowest
   const [isDeleting, setIsDeleting] = useState(null);
   const [expandedImage, setExpandedImage] = useState(null);

   const sortedReviews = useMemo(() => {
      const items = [...reviews];
      if (sortBy === 'newest') return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (sortBy === 'highest') return items.sort((a, b) => b.rating - a.rating);
      if (sortBy === 'lowest') return items.sort((a, b) => a.rating - b.rating);
      return items;
   }, [reviews, sortBy]);

   const [formData, setFormData] = useState({
      rating: 5,
      comment: '',
      images: [],
      name: '',
      email: ''
   });
   const [uploading, setUploading] = useState(false);
   const [submitting, setSubmitting] = useState(false);
   const [success, setSuccess] = useState(false);
   const [hoverRating, setHoverRating] = useState(0);

   const handleUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const totalImages = formData.images.length + files.length;
      if (totalImages > 8) {
         alert(`Maximum 8 images allowed. You can only add ${8 - formData.images.length} more.`);
         return;
      }

      const uploadData = new FormData();
      files.forEach(file => {
         uploadData.append('images', file);
      });

      try {
         setUploading(true);
         const res = await api.post('/upload/public', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
         });

         if (res.data.success) {
            setFormData(prev => ({
               ...prev,
               images: [...prev.images, ...res.data.files.map(f => f.url)]
            }));
         }
      } catch (err) {
         console.error('Upload failed:', err);
         const errorMsg = err.response?.data?.message || 'Failed to upload images. Check file sizes or format.';
         alert(errorMsg);
      } finally {
         setUploading(false);
         // Reset file input so same file can be selected again if needed
         e.target.value = '';
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
         const res = await api.post(`/products/${productId}/reviews`, formData);
         if (onReviewAdded) onReviewAdded(res.data.data);
         setSuccess(true);
         setFormData({ rating: 5, comment: '', images: [], name: '', email: '' });
         setTimeout(() => {
            setSuccess(false);
            setIsWritingReview(false);
         }, 2000);
      } catch (err) {
         console.error('Review submission error:', err);
         alert(err.response?.data?.message || 'Failed to submit review');
      } finally {
         setSubmitting(false);
      }
   };

   const handleDeleteReview = async (reviewId) => {
      if (!window.confirm('Are you sure you want to delete this review?')) return;

      try {
         setIsDeleting(reviewId);
         await api.delete(`/products/${productId}/reviews/${reviewId}`);
         // We need to trigger an update - since Reviews is controlled by parent ProductDetail, 
         // we should ideally have an onReviewDeleted prop or just refresh product.
         // For now, let's assume the parent handles it if we can - but ProductDetail only has onReviewAdded.
         // Let's reload page as a quick fix or if you want it smoother, we need parent update.
         window.location.reload();
      } catch (err) {
         console.error('Failed to delete review:', err);
         alert('Administrative bypass failed');
      } finally {
         setIsDeleting(null);
      }
   };

   return (
      <div className="space-y-6 max-w-2xl mx-auto">
         {/* CONTROLS & WRITE REVIEW TOGGLE */}
         <div className="flex justify-between items-center border-b border-black/10 pb-2">
            <div className="relative flex items-center gap-1 cursor-pointer group">
               <span className="text-[10px] md:text-xs font-bold text-black uppercase tracking-widest leading-none">
                  {sortBy === 'newest' ? 'Most Recent' : sortBy === 'highest' ? 'Highest Rating' : 'Lowest Rating'}
               </span>
               <ChevronDown size={12} className="text-black" />
               <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
               >
                  <option value="newest">Most Recent</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
               </select>
            </div>
            <button
               onClick={() => setIsWritingReview(!isWritingReview)}
               className="text-[10px] md:text-xs font-black tracking-[0.15em] uppercase hover:opacity-60 transition-opacity border-b border-black pb-0.5"
            >
               {isWritingReview ? "Cancel" : "Write a Review"}
            </button>
         </div>

         {/* WRITE REVIEW FORM */}
         {isWritingReview && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-gray-50/50 p-4 md:p-8 border border-black/5">
               <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Rating */}
                  <div className="flex justify-center gap-1.5">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <button
                           key={star}
                           type="button"
                           onMouseEnter={() => setHoverRating(star)}
                           onMouseLeave={() => setHoverRating(0)}
                           onClick={() => setFormData({ ...formData, rating: star })}
                           className="transition-transform hover:scale-110 focus:outline-none"
                        >
                           <Star
                              size={18}
                              className={cn(
                                 "transition-colors",
                                 (hoverRating || formData.rating) >= star
                                    ? "fill-black text-black"
                                    : "text-gray-200"
                              )}
                              strokeWidth={0}
                           />
                        </button>
                     ))}
                  </div>

                  {/* Input Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Name"
                        className="bg-white border-gray-200 text-xs py-2 h-10"
                        required
                     />
                     <Input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Email"
                        className="bg-white border-gray-200 text-xs py-2 h-10"
                        required
                     />
                  </div>
                  <textarea
                     value={formData.comment}
                     onChange={e => setFormData({ ...formData, comment: e.target.value })}
                     placeholder="Share your experience..."
                     className="w-full bg-white border border-gray-200 p-3 text-xs min-h-[80px] focus:border-black focus:ring-0 transition-colors resize-none"
                     required
                  />

                  {/* Image Upload */}
                  <div className="flex gap-3 items-center">
                     <div className="w-10 h-10 border border-dashed border-gray-300 flex items-center justify-center relative hover:border-black cursor-pointer bg-white transition-colors">
                        {uploading ? <Loader2 className="animate-spin w-3 h-3" /> : <Upload size={14} className="text-gray-400" />}
                        <input type="file" multiple accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                     </div>
                     <div className="flex gap-2 overflow-x-auto">
                        {formData.images.map((img, i) => (
                           <div key={i} className="w-10 h-10 relative group flex-shrink-0">
                              <img src={img} alt="" className="w-full h-full object-cover grayscale" />
                              <button
                                 type="button"
                                 onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                                 className="absolute -top-1 -right-1 bg-black text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                              >
                                 <X size={8} />
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>

                  <Button
                     type="submit"
                     disabled={submitting || uploading}
                     className="w-full bg-black text-white hover:bg-stone-800 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] py-3"
                  >
                     {submitting ? 'Processing...' : success ? 'Submitted' : 'Post Review'}
                  </Button>
               </form>
            </div>
         )}

         {/* REVIEWS LIST */}
         <div className="space-y-6">
            {sortedReviews.map((review, i) => (
               <div key={i} className="flex flex-col gap-2 pb-6 border-b border-gray-100 last:border-0 fade-in relative group">
                  {/* Admin Deletion */}
                  {isAdmin && (
                     <button
                        onClick={() => handleDeleteReview(review._id)}
                        disabled={isDeleting === review._id}
                        className="absolute top-0 right-0 p-2 text-black/20 hover:text-red-500 transition-colors"
                        title="Delete Review"
                     >
                        {isDeleting === review._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                     </button>
                  )}

                  {/* Rating Stars */}
                  <div className="flex gap-0.5">
                     {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className={i < review.rating ? "fill-black text-black" : "text-gray-200"} strokeWidth={0} />
                     ))}
                  </div>

                  {/* User Info Line */}
                  <div className="flex items-center gap-2">
                     <span className="text-[14px] md:text-[16px] font-bold text-black tracking-tight">{review.name || "Anonymous"}</span>
                     <div className="flex items-center gap-0.5 bg-black text-white px-1.5 py-[2px] rounded-[1px]">
                        <Check size={10} strokeWidth={4} />
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest leading-none">Verified</span>
                     </div>
                  </div>

                  {/* Comment */}
                  <div className="text-black/80 font-normal leading-relaxed text-[13px] md:text-[14px]">
                     <p>{review.comment}</p>
                  </div>

                  {/* Date & Review Images Footer */}
                  <div className="flex flex-col gap-3">
                     {review.images?.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                           {review.images.map((img, idx) => (
                              <div
                                 key={idx}
                                 onClick={() => setExpandedImage(img)}
                                 className="w-24 h-24 md:w-32 md:h-32 border border-gray-100 bg-gray-50 flex-shrink-0 cursor-zoom-in group/img overflow-hidden"
                              >
                                 <img src={img} alt="" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            ))}

            {reviews.length === 0 && !isWritingReview && (
               <div className="text-center py-10 space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">No reviews yet</p>
                  <button
                     onClick={() => setIsWritingReview(true)}
                     className="text-[10px] font-black uppercase tracking-[0.2em] border-b border-black pb-0.5 hover:opacity-50"
                  >
                     Be the First to Review
                  </button>
               </div>
            )}
         </div>

         {/* IMAGE LIGHTBOX */}
         {expandedImage && (
            <div
               className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-10 animate-in fade-in duration-300"
               onClick={() => setExpandedImage(null)}
            >
               <button
                  className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                  onClick={() => setExpandedImage(null)}
               >
                  <X size={32} strokeWidth={1.5} />
               </button>
               <div className="relative max-w-5xl max-h-full" onClick={e => e.stopPropagation()}>
                  <img
                     src={expandedImage}
                     alt="Review detail"
                     className="w-full h-auto max-h-[85vh] object-contain shadow-2xl animate-in zoom-in-95 duration-300"
                  />
               </div>
            </div>
         )}
      </div>
   );
}
