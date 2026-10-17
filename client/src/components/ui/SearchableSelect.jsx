import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function SearchableSelect({ options, value, onChange, placeholder, name, required, className }) {
   const [isOpen, setIsOpen] = useState(false);
   const [search, setSearch] = useState('');
   const containerRef = useRef(null);
   const inputRef = useRef(null);

   const filteredOptions = options.filter(option =>
      option.toLowerCase().includes(search.toLowerCase())
   );

   useEffect(() => {
      const handleClickOutside = (event) => {
         if (containerRef.current && !containerRef.current.contains(event.target)) {
            setIsOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const handleSelect = (option) => {
      onChange({ target: { name, value: option } });
      setIsOpen(false);
      setSearch('');
   };

   return (
      <div className={cn("relative w-full", className)} ref={containerRef}>
         <div
            onClick={() => {
               setIsOpen(!isOpen);
               if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className={cn(
               "flex h-12 w-full border border-black bg-white px-4 py-2 text-[16px] md:text-[13px] font-bold tracking-wider transition-all cursor-pointer items-center justify-between",
               isOpen && "border-b-transparent"
            )}
         >
            <span className={cn(value ? "text-black" : "text-gray-400")}>
               {value || placeholder}
            </span>
            <ChevronDown size={16} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
         </div>

         <AnimatePresence>
            {isOpen && (
               <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-[100] w-full bg-white border border-black border-t-0 shadow-xl"
               >
                  <div className="p-3 border-b border-gray-100 flex items-center gap-2 sticky top-0 bg-white">
                     <Search size={14} className="text-gray-400 shrink-0" />
                     <input
                        ref={inputRef}
                        type="text"
                        className="w-full text-[12px] font-bold outline-none uppercase tracking-widest placeholder:text-gray-300"
                        placeholder="Search area..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                     />
                     {search && (
                        <X
                           size={14}
                           className="text-gray-400 cursor-pointer hover:text-black"
                           onClick={(e) => {
                              e.stopPropagation();
                              setSearch('');
                           }}
                        />
                     )}
                  </div>

                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                     {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                           <div
                              key={option}
                              onClick={() => handleSelect(option)}
                              className={cn(
                                 "px-4 py-3 text-[11px] font-bold uppercase tracking-widest cursor-pointer transition-colors hover:bg-black hover:text-white",
                                 value === option && "bg-gray-50 text-black border-l-4 border-black"
                              )}
                           >
                              {option}
                           </div>
                        ))
                     ) : (
                        <div className="px-4 py-8 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                           No areas found
                        </div>
                     )}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Hidden input for form submission if needed, though we use custom onChange */}
         <input type="hidden" name={name} value={value} required={required} />
      </div>
   );
}
