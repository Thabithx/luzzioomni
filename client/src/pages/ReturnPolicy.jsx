import React from 'react';
import Meta from '../components/ui/Meta';

export function ReturnPolicy() {
   return (
      <div className="min-h-screen bg-white pt-24 pb-40 px-10">
         <Meta title="Return Policy | Luzzio" />

         <div className="max-w-4xl mx-auto">
            <h1 className="text-[32px] font-black uppercase tracking-tight mb-12 border-b-2 border-black pb-6">
               Return Policy
            </h1>

            <div className="space-y-16 py-12">
               <section className="max-w-2xl border-l-4 border-black pl-10">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-loose">
                     At Luzzio, we maintain a strict return protocol. We do not accept returns under any circumstances
                     unless the item is proven to be defective or damaged upon arrival.
                  </p>
               </section>

               <section className="bg-brand-grey p-10 border border-black space-y-8">
                  <h2 className="text-[14px] font-black uppercase tracking-widest border-b border-black pb-4">Defect Reporting Protocol</h2>
                  <div className="space-y-6 text-[11px] font-medium leading-relaxed tracking-wider">
                     <div className="flex gap-4">
                        <span className="font-black text-[14px]">/</span>
                        <p>In the case of damaged or defective items, please contact our support team within <span className="font-black underline">48 HOURS</span> of delivery.</p>
                     </div>
                     <div className="flex gap-4">
                        <span className="font-black text-[14px]">/</span>
                        <p>You must provide <span className="font-black">PHOTOGRAPHIC EVIDENCE</span> of the defect for our verification.</p>
                     </div>
                  </div>
               </section>

               <section className="pt-20">
                  <div className="border border-black p-8 text-center space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em]">Quality Assurance</p>
                     <p className="text-gray-400 max-w-lg mx-auto italic leading-relaxed">
                        Every item undergoes a rigorous quality audit before the dispatch sequence is initiated.
                        We ensure that every component meets our architectural standards.
                     </p>
                  </div>
               </section>

               <section className="text-center pt-12">
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-200">
                     Luzzio Logistics & Control
                  </p>
               </section>
            </div>
         </div>
      </div>
   );
}
