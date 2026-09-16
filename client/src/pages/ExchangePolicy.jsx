import React from 'react';
import Meta from '../components/ui/Meta';

export function ExchangePolicy() {
   return (
      <div className="min-h-screen bg-white pt-24 pb-40 px-10">
         <Meta title="Exchange Policy | Luzzio" />

         <div className="max-w-4xl mx-auto">
            <h1 className="text-[32px] font-black uppercase tracking-tight mb-12 border-b-2 border-black pb-6">
               Exchange Policy
            </h1>

            <div className="space-y-12 text-[11px] font-medium leading-relaxed tracking-wide">
               <p className="text-[13px] font-bold text-gray-500 uppercase tracking-widest leading-loose">
                  Luzzio is committed to ensuring you love every item you purchase from us.
                  If something isn’t right, we offer a simple and customer-friendly exchange process.
               </p>

               <section>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-6">Step 1: Contact Our Customer Support</h2>
                  <p className="mb-4">To place an exchange request, reach out to us through any of the following channels:</p>
                  <ul className="space-y-3 ml-4">
                     <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                        <span className="font-black uppercase">Instagram DM:</span> @luzzioclothing
                     </li>
                     <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                        <span className="font-black uppercase">WhatsApp:</span> 0781423168
                     </li>
                  </ul>
                  <p className="mt-4 text-gray-400 italic">Our team will acknowledge your request and guide you through the next steps.</p>
               </section>

               <section>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-6 border-l-2 border-black pl-4">Step 2: Exchange Approval & Item Collection</h2>
                  <p className="mb-4">Once your request is approved:</p>
                  <ul className="space-y-4 ml-4">
                     <li className="flex gap-4">
                        <span className="font-black">01</span>
                        <p>We will arrange the exchange process for you.</p>
                     </li>
                     <li className="flex gap-4">
                        <span className="font-black">02</span>
                        <p>The courier will collect the item from your location, provided it meets the exchange conditions mentioned below.</p>
                     </li>
                     <li className="flex gap-4">
                        <span className="font-black">03</span>
                        <p>After the product is received, our team will inspect it for quality, hygiene, and eligibility.</p>
                     </li>
                     <li className="flex gap-4">
                        <span className="font-black">04</span>
                        <p>You will be notified once your exchange item has been reviewed and approved.</p>
                     </li>
                  </ul>
               </section>

               <section>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-6 border-l-2 border-black pl-4">Step 3: Delivery of Your Exchange Item</h2>
                  <p className="mb-4">After the returned item is approved:</p>
                  <ul className="space-y-4 ml-4">
                     <li className="flex items-center gap-3 italic">
                        <span className="w-1 h-1 bg-black rotate-45"></span>
                        A fresh replacement item will be delivered to your doorstep.
                     </li>
                     <li className="flex items-center gap-3 font-black">
                        <span className="w-1 h-1 bg-black rotate-45"></span>
                        Delivery fee of Rs. 400 will be charged
                     </li>
                  </ul>
               </section>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-gray-100">
                  <section>
                     <h2 className="text-[14px] font-black uppercase tracking-widest mb-6">Exchange Conditions</h2>
                     <ul className="space-y-4">
                        {[
                           "Exchanges must be requested within 7 days of delivery.",
                           "Items must be unused, unwashed, and in their original packaging with all tags attached.",
                           "Products must show no signs of wear, perfume, stains, or damage.",
                           "Exchanges are strictly subject to stock availability.",
                           "Original invoice or proof of purchase must be provided.",
                           "Items purchased during sales or promotional offers may not be eligible unless defective."
                        ].map((condition, i) => (
                           <li key={i} className="flex gap-3 text-[10px] uppercase font-bold text-gray-400">
                              <span className="text-black shrink-0">/</span> {condition}
                           </li>
                        ))}
                     </ul>
                  </section>

                  <section className="bg-brand-grey p-8 border border-black">
                     <h2 className="text-[14px] font-black uppercase tracking-widest mb-6">Non-Exchangeable Items</h2>
                     <p className="mb-6 italic text-gray-500">For hygiene and customization reasons, the following items cannot be exchanged:</p>
                     <ul className="space-y-2">
                        {["Innerwear", "Accessories", "Customized or personalized products"].map((item, i) => (
                           <li key={i} className="font-black uppercase tracking-tighter">/ {item}</li>
                        ))}
                     </ul>
                  </section>
               </div>

               <section className="pt-12">
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-6">Defective or Manufacturing Errors</h2>
                  <div className="space-y-4 border-l-2 border-black pl-8">
                     <p>If an item is defective, you may request an exchange or size replacement.</p>
                     <ul className="space-y-2 text-gray-500">
                        <li>- If the replacement item is of higher value, the price difference must be paid.</li>
                        <li>- If the replacement item is of lower value, the balance will be refunded.</li>
                        <li>- If you do not want a replacement, you may request a full refund for the defective item.</li>
                     </ul>
                     <p className="font-black uppercase text-[9px] mt-6 bg-black text-white px-3 py-1 inline-block">
                        Luzzio reserves the right to reject any return if the defect is deemed not genuine or if the item does not comply with the return criteria.
                     </p>
                  </div>
               </section>
            </div>
         </div>
      </div>
   );
}
