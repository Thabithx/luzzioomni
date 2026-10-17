import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Input({ className, ...props }) {
   return (
      <input
         className={twMerge(
            clsx(
               'flex h-12 w-full border border-black bg-transparent px-4 py-2 text-[16px] md:text-[13px] font-bold tracking-wider transition-colors file:border-0 file:bg-transparent file:text-[10px] file:font-black placeholder:text-black/20 focus-visible:outline-none focus:border-black rounded-none disabled:cursor-not-allowed disabled:opacity-50',
               className
            )
         )}
         {...props}
      />
   );
}
