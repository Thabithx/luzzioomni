import React, { useState, useEffect } from 'react';
import Meta from '../components/ui/Meta';
import { ChevronDown, Search } from 'lucide-react';
import api from '../services/api';

export function FAQ() {
   const [faqs, setFaqs] = useState([]);
   const [loading, setLoading] = useState(true);
   const [selectedCategory, setSelectedCategory] = useState('All');
   const [searchQuery, setSearchQuery] = useState('');
   const [openFaqId, setOpenFaqId] = useState(null);

   const categories = ['All', 'Shipping', 'Returns', 'Payment', 'Products', 'Account', 'General'];

   useEffect(() => {
      fetchFAQs();
   }, []);

   const fetchFAQs = async () => {
      setLoading(true);
      try {
         const res = await api.get('/faq');
         if (res.data.success) {
            setFaqs(res.data.data);
         }
      } catch (error) {
         console.error('Error fetching FAQs:', error);
      } finally {
         setLoading(false);
      }
   };

   const filteredFaqs = faqs.filter(faq => {
      const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
   });

   const toggleFaq = (id) => {
      setOpenFaqId(openFaqId === id ? null : id);
   };

   return (
      <div className="min-h-screen bg-white pt-24 pb-40 px-10">
         <Meta title="Frequently Asked Questions | Luzzio" />

         <div className="max-w-4xl mx-auto">
            <h1 className="text-[32px] font-black uppercase tracking-tight mb-12 border-b-2 border-black pb-6">
               Frequently Asked Questions
            </h1>

            {/* Search Bar */}
            <div className="mb-12">
               <div className="relative">
                  <input
                     type="text"
                     placeholder="Search FAQs..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full border border-black px-4 py-4 pl-12 text-[11px] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
               </div>
            </div>

            {/* Category Filter */}
            <div className="mb-12 flex flex-wrap gap-3">
               {categories.map((category) => (
                  <button
                     key={category}
                     onClick={() => setSelectedCategory(category)}
                     className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border border-black transition-colors ${selectedCategory === category
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-brand-grey'
                        }`}
                  >
                     {category}
                  </button>
               ))}
            </div>

            {/* FAQs List */}
            {loading ? (
               <div className="text-center py-20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading FAQs...</p>
               </div>
            ) : filteredFaqs.length === 0 ? (
               <div className="border border-black p-12 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                     {searchQuery ? 'No FAQs found matching your search.' : 'No FAQs available in this category.'}
                  </p>
               </div>
            ) : (
               <div className="space-y-4">
                  {filteredFaqs.map((faq) => (
                     <div key={faq._id} className="border border-black">
                        <button
                           onClick={() => toggleFaq(faq._id)}
                           className="w-full flex justify-between items-center p-6 text-left hover:bg-brand-grey transition-colors"
                        >
                           <div className="flex-1 pr-4">
                              <div className="flex items-center gap-3 mb-2">
                                 <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-black text-white">
                                    {faq.category}
                                 </span>
                              </div>
                              <h3 className="text-[11px] font-black uppercase tracking-tight">
                                 {faq.question}
                              </h3>
                           </div>
                           <ChevronDown
                              size={16}
                              className={`transition-transform duration-300 ${openFaqId === faq._id ? 'rotate-180' : ''
                                 }`}
                           />
                        </button>

                        <div
                           className={`overflow-hidden transition-all duration-300 ${openFaqId === faq._id ? 'max-h-[500px]' : 'max-h-0'
                              }`}
                        >
                           <div className="p-6 pt-0 border-t border-black bg-brand-grey">
                              <p className="text-[11px] font-medium leading-relaxed tracking-wide">
                                 {faq.answer}
                              </p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}

            {/* Still Have Questions */}
            <div className="mt-16 border-2 border-black p-12 text-center bg-brand-grey">
               <h2 className="text-[14px] font-black uppercase tracking-widest mb-4">
                  Still Have Questions?
               </h2>
               <p className="text-[11px] font-medium mb-6 tracking-wide">
                  Can't find what you're looking for? Our customer service team is here to help.
               </p>
               <a
                  href="/contact"
                  className="inline-block btn-brand px-12 py-4"
               >
                  Contact Us
               </a>
            </div>
         </div>
      </div>
   );
}
