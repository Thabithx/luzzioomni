import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import { cn } from '../../utils/cn';

export function ProductCard({ product }) {
   const { addToCart } = useCart();
   const [added, setAdded] = useState(false);
   const imageUrl = product.images?.[0] || 'https://placehold.co/600x800/E5E7EB/000000?text=Product';

   const handleQuickAdd = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const defaultSize = product.sizes?.[0] || 'OS';
      const defaultColor = product.colors?.[0] || 'Noir';
      addToCart(product, 1, defaultSize, defaultColor);

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
   };

   return (
      <div className="group relative cursor-pointer transition-all duration-500 bg-brand-grey hover:bg-[#EEEEEE] h-full">
         <Link to={`/products/${product._id}`} className="flex flex-col h-full">
            <div className="aspect-[3/4] relative overflow-hidden shrink-0">
               {product.salePrice > 0 && (
                  <div className="absolute top-0 right-0 z-10 bg-black text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                     Sale
                  </div>
               )}

               <img
                  src={imageUrl}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-contain transition-all duration-700 mix-blend-multiply group-hover:scale-110"
               />
            </div>

            <div className="p-3 pt-1 flex flex-col flex-1 justify-between items-center text-center space-y-2">
               <div className="space-y-0.5 w-full">
                  <h3 className="text-[10px] font-black uppercase tracking-widest group-hover:opacity-50 transition-opacity line-clamp-2 min-h-[2.5em]">
                     {product.name}
                  </h3>
                  <div className="flex flex-row items-baseline gap-2 justify-center">
                     {product.salePrice > 0 ? (
                        <>
                           <p className="text-[11px] font-black tracking-tight text-black">LKR {product.salePrice.toLocaleString()}</p>
                           <p className="text-[9px] font-black text-gray-400 line-through opacity-50">LKR {product.price.toLocaleString()}</p>
                        </>
                     ) : (
                        <p className="text-[11px] font-black tracking-tight">LKR {product.price.toLocaleString()}</p>
                     )}
                  </div>
               </div>

               <button
                  onClick={handleQuickAdd}
                  className={cn(
                     "w-full py-3 text-[9px] font-black uppercase tracking-[0.2em] border border-black transition-all duration-500 mt-auto",
                     added
                        ? "bg-black text-white"
                        : "bg-transparent text-black hover:bg-black hover:text-white"
                  )}
               >
                  <span className="flex items-center justify-center gap-2">
                     {added ? (
                        <>
                           <Check size={12} strokeWidth={3} />
                           Added
                        </>
                     ) : (
                        "Add to Bag"
                     )}
                  </span>
               </button>
            </div>
         </Link>
      </div>
   );
}
