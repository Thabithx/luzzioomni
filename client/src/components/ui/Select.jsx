import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Select({ className, options, placeholder, ...props }) {
   return (
      <div className="relative w-full">
         <select
            className={twMerge(
               clsx(
                  'flex h-12 w-full border border-black bg-transparent px-4 py-2 text-[16px] md:text-[13px] font-bold tracking-wider transition-colors focus-visible:outline-none focus:border-black rounded-none appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
                  className
               )
            )}
            {...props}
         >
            <option value="" disabled className="text-black/20 font-bold bg-white">
               {placeholder || "Select an option"}
            </option>
            {options.map((option) => (
               <option key={option} value={option} className="text-black font-bold bg-white px-4">
                  {option}
               </option>
            ))}
         </select>
         <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg
               width="10"
               height="6"
               viewBox="0 0 10 6"
               fill="none"
               xmlns="http://www.w3.org/2000/svg"
               className="text-black"
            >
               <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
         </div>
      </div>
   );
}
