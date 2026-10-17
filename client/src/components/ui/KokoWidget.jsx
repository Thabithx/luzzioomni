import React from 'react';

export function KokoWidget({ price, className }) {
   return null;

   const installment = (price / 3).toFixed(2);
   const formattedInstallment = Number(installment).toLocaleString();

   return (
      <div className={`flex flex-wrap items-center gap-1.5 text-[11px] text-[#8e8e8e] transition-opacity duration-300 ${className}`}>
         <span>or pay in 3 x</span>
         <span className="font-black text-black tracking-tight">LKR {formattedInstallment}</span>
         <span>with</span>
         <a
            href="https://paykoko.com/customer-education"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-70 transition-opacity"
         >
            <img
               src="https://paykoko.com/img/logo1.7ff549c0.png"
               alt="Koko"
               className="h-[18px] w-auto relative top-[-1px]"
            />
         </a>
         <a
            href="https://paykoko.com/customer-education"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-70 transition-opacity ml-[-2px]"
         >
            <img
               src="https://koko-merchant.oss-ap-southeast-1.aliyuncs.com/bnpl-site-cms-dev/koko-images/info.png"
               alt="Info"
               className="h-[12px] w-auto opacity-40 brightness-0"
            />
         </a>
      </div>
   );
}
