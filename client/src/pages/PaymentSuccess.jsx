import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Meta from '../components/ui/Meta';
import * as metaPixel from '../utils/metaPixel';
import api from '../services/api';

export function PaymentSuccess() {
   const { clearCart } = useCart();
   const [searchParams] = useSearchParams();
   const sessionId = searchParams.get('session_id');

   useEffect(() => {
      // Clear cart on successful payment protocol
      clearCart();
      // Ensure we start at the top of the completion screen
      window.scrollTo(0, 0);

      // Meta Pixel Purchase Tracking
      const orderId = searchParams.get('orderId');
      if (orderId) {
         api.get(`/orders/myorders`).then(res => {
            if (res.data.success) {
               const order = res.data.data.find(o => o._id === orderId);
               if (order) {
                  metaPixel.purchase(order);
               }
            }
         }).catch(err => {
            // Fallback for guests: orders might not be in "myorders"
            // We could try a specific guest endpoint if available
            console.warn('Could not fetch order details for tracking:', err);
         });
      }
   }, [clearCart, searchParams]);

   return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
         <Meta title="Logistics Confirmed" description="Your order protocol has been successfully verified." />

         <div className="space-y-12 max-w-lg">
            <div className="flex flex-col items-center space-y-6">
               <div className="w-20 h-20 bg-brand-grey border border-black flex items-center justify-center animate-in zoom-in-50 duration-500">
                  <CheckCircle size={40} strokeWidth={1} className="text-black" />
               </div>
               <div className="space-y-4">
                  <h1 className="text-[10vw] md:text-6xl font-black uppercase tracking-tighter leading-none">Registered.</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Order Protocol Verified</p>
               </div>
            </div>

            <p className="text-sm font-medium leading-relaxed uppercase tracking-widest text-gray-600">
               Your selection has been successfully recorded. A confirmation email has been dispatched to your registered email.
            </p>

            <div className="pt-10 border-t border-black space-y-4">
               <Link to="/profile" className="btn-brand w-full flex justify-between items-center group">
                  <span>Review Archive</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </Link>
               <Link to="/products" className="text-small-brand hover:opacity-50 inline-block border-b border-black pb-1">
                  Return to Collection
               </Link>
            </div>
         </div>
      </div>
   );
}
