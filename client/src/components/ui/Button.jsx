import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({
   children,
   variant = 'primary',
   size = 'md',
   className,
   ...props
}) {
   const baseStyles = 'inline-flex items-center justify-center font-black transition-all duration-500 focus:outline-none disabled:opacity-50 disabled:pointer-events-none uppercase tracking-[0.2em] rounded-none border transition-all';

   const variants = {
      primary: 'bg-black text-white border-black hover:bg-white hover:text-black',
      secondary: 'bg-brand-grey text-black border-black hover:bg-black hover:text-white',
      outline: 'border border-black text-black hover:bg-black hover:text-white',
      ghost: 'text-black hover:bg-brand-grey border-transparent hover:border-black',
      white: 'bg-white text-black border-black hover:bg-black hover:text-white'
   };

   const sizes = {
      sm: 'h-10 px-6 text-[9px]',
      md: 'h-12 px-10 text-[10px]',
      lg: 'h-16 px-12 text-[11px]',
      icon: 'h-10 w-10',
   };

   return (
      <button
         className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
         {...props}
      >
         {children}
      </button>
   );
}
