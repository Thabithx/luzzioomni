import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Meta from '../components/ui/Meta';
import { KokoWidget } from '../components/ui/KokoWidget';


export function Cart() {
   const { cart, removeFromCart, updateQuantity, loading } = useCart();

   const validItems = cart.filter(item => item && item.product);

   const subtotal = validItems.reduce((acc, item) => {
      const price = (item.product?.salePrice > 0) ? item.product.salePrice : (item.product?.price || 0);
      return acc + (price * item.quantity);
   }, 0);

   const shippingPrice = subtotal >= 10000 ? 0 : 390;
   const totalPrice = subtotal + shippingPrice;

   if (loading) return <div className="min-h-screen flex items-center justify-center text-small-brand animate-pulse">Syncing Shopping Bag...</div>;

   if (cart.length === 0) {
      return (
         <div className="min-h-screen bg-white pt-40 pb-24 px-10 text-center flex flex-col items-center">
            <Meta title="Shopping Bag | Luzzio" />
            <h1 className="text-[8vw] font-black uppercase tracking-tighter leading-none mb-10">Your Bag is Empty</h1>
            <p className="text-small-brand text-gray-400 max-w-sm mb-12">
               Your bag contains no items. Explore the collection to begin your selection.
            </p>
            <Link to="/products" className="btn-brand">
               Explore Collection
            </Link>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-white pt-24 pb-40 px-4 md:px-10">
         <Meta title="Shopping Bag | Luzzio" />

         <div className="max-w-[1920px] mx-auto">
            <div className="flex flex-col items-center mb-24">
               <h1 className="text-[8vw] font-black uppercase tracking-tighter leading-none">Shopping Bag</h1>
               <div className="mt-4 flex items-center gap-4 text-small-brand">
                  <span>{validItems.length} Items</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-black font-black">Archive Selection</span>
               </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-20">
               {/* Cart Items */}
               <div className="flex-1 space-y-1">
                  {validItems.map((item, index) => (
                     <div key={`${item.product?._id || index}-${item.size}-${index}`} className="flex gap-4 md:gap-10 py-6 md:py-10 border-t border-black last:border-b">
                        <Link to={`/products/${item.product?._id}`} className="w-24 md:w-32 aspect-[3/4] bg-brand-grey shrink-0 overflow-hidden hover:opacity-80 transition-opacity">
                           <img
                              src={item.product?.images?.[0] || 'https://placehold.co/300x400/F6F6F6/000000'}
                              alt={item.product?.name}
                              className="w-full h-full object-cover grayscale-[20%]"
                           />
                        </Link>

                        <div className="flex-1 flex flex-col justify-between py-2">
                           <div className="flex justify-between items-start">
                              <div className="space-y-2 md:space-y-4">
                                 <Link to={`/products/${item.product?._id}`}>
                                    <h3 className="text-sm md:text-xl font-black uppercase tracking-tight leading-tight hover:underline">{item.product?.name}</h3>
                                 </Link>
                                 <div className="flex flex-col md:flex-row gap-2 md:gap-8 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <p>Size: <span className="text-black">{item.size}</span></p>
                                    <p>Color: <span className="text-black capitalize">{item.color || 'Noir'}</span></p>
                                 </div>
                              </div>
                              <button
                                 onClick={() => removeFromCart(item.product?._id, item.size, item.color)}
                                 className="text-black hover:opacity-50 transition-opacity"
                              >
                                 <Trash2 size={18} strokeWidth={1.5} />
                              </button>
                           </div>

                           <div className="flex justify-between items-end">
                              <div className="flex items-center border border-black scale-90 md:scale-100 origin-left">
                                 <button
                                    onClick={() => updateQuantity(item.product?._id, item.size, item.color, Math.max(1, item.quantity - 1))}
                                    className="p-2 md:p-3 hover:bg-black hover:text-white transition-all border-r border-black"
                                 >
                                    <Minus size={10} />
                                 </button>
                                 <span className="px-4 md:px-6 text-[10px] md:text-[11px] font-black">{item.quantity}</span>
                                 <button
                                    onClick={() => updateQuantity(item.product?._id, item.size, item.color, item.quantity + 1)}
                                    className="p-2 md:p-3 hover:bg-black hover:text-white transition-all border-l border-black"
                                 >
                                    <Plus size={10} />
                                 </button>
                              </div>
                              <div className="flex flex-col items-end">
                                 {item.product?.salePrice > 0 ? (
                                    <>
                                       <p className="text-sm md:text-xl font-black text-black">LKR {(item.product.salePrice * item.quantity).toLocaleString()}.00</p>
                                       <p className="text-[10px] md:text-xs font-bold text-gray-400 line-through opacity-50">LKR {(item.product.price * item.quantity).toLocaleString()}.00</p>
                                    </>
                                 ) : (
                                    <p className="text-sm md:text-xl font-black">LKR {((item.product?.price || 0) * item.quantity).toLocaleString()}.00</p>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>

               {/* Summary */}
               <div className="lg:w-[450px] space-y-12">
                  <div className="p-10 bg-brand-grey space-y-10">
                     <p className="text-small-brand font-black">Order Summary</p>

                     <div className="space-y-4 text-[11px] font-bold uppercase tracking-widest">
                        <div className="flex justify-between">
                           <span className="text-gray-400">Subtotal</span>
                           <span>LKR {subtotal.toLocaleString()}.00</span>
                        </div>
                        <div className="flex flex-col">
                           <div className="flex justify-between">
                              <span className="text-gray-400">Shipping (Standard)</span>
                              <span className={shippingPrice === 0 ? "text-green-600 font-black" : "text-black"}>
                                 {shippingPrice === 0 ? "FREE" : `LKR ${shippingPrice.toLocaleString()}.00`}
                              </span>
                           </div>
                           {shippingPrice > 0 && (
                              <p className="text-[9px] text-black/40 font-bold lowercase tracking-widest mt-1 text-right">
                                 Spend LKR {(10000 - subtotal).toLocaleString()}.00 more for FREE delivery
                              </p>
                           )}
                        </div>
                        <div className="border-t border-black pt-6 flex justify-between text-lg font-black tracking-tighter">
                           <span>LKR {totalPrice.toLocaleString()}.00</span>
                        </div>
                        <KokoWidget price={totalPrice} className="pt-4 justify-end" />
                     </div>


                     <div className="space-y-4">
                        <Link to="/checkout" className="btn-brand w-full flex justify-between items-center group">
                           <span>Checkout</span>
                           <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <p className="text-[9px] text-gray-400 text-center uppercase tracking-widest">
                           Safe & Secure Checkout Guaranteed.
                        </p>
                     </div>
                  </div>

                  <div className="space-y-6 px-4">
                     <p className="text-small-brand">Dedicated Client Services</p>
                     <p className="text-[11px] text-gray-500 leading-relaxed uppercase tracking-widest font-medium">
                        Our experts are available to guide you through your selection and answer any questions regarding size, fit, or composition.
                     </p>
                     <button className="text-small-brand border-b border-black pb-1">Contact Us</button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
