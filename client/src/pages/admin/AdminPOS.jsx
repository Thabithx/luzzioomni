// POS TERMINAL SYSTEM UI
// In-store cashier interface designed for high-speed product scanning, variant selection,
// walk-in / registered customer checkout, discount/tax calculations, and instant receipt generation.

import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, User, CreditCard, DollarSign, CheckCircle, Printer, X, RefreshCw, Barcode } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminPOS() {
   const { user } = useAuth();
   const [products, setProducts] = useState([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [loadingProducts, setLoadingProducts] = useState(false);

   // Cart State
   const [cart, setCart] = useState([]);
   const [discount, setDiscount] = useState(0);
   const [taxRate, setTaxRate] = useState(0); // percentage

   // Customer State
   const [selectedCustomer, setSelectedCustomer] = useState(null);
   const [customerQuery, setCustomerQuery] = useState('');
   const [customerResults, setCustomerResults] = useState([]);
   const [showCustomerModal, setShowCustomerModal] = useState(false);
   const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

   // Checkout State
   const [paymentMethod, setPaymentMethod] = useState('CASH');
   const [cashTendered, setCashTendered] = useState('');
   const [processing, setProcessing] = useState(false);
   const [receiptData, setReceiptData] = useState(null);
   const [errorMessage, setErrorMessage] = useState('');

   useEffect(() => {
      fetchProducts('');
   }, []);

   const fetchProducts = async (q = '') => {
      setLoadingProducts(true);
      try {
         const res = await api.get(`/pos/products?query=${encodeURIComponent(q)}`);
         setProducts(res.data.data || []);
      } catch (err) {
         console.error('Fetch POS products failed:', err);
      } finally {
         setLoadingProducts(false);
      }
   };

   const handleSearchSubmit = (e) => {
      e.preventDefault();
      fetchProducts(searchQuery);
   };

   const addToCart = (product, selectedSize = '') => {
      const sizeToUse = selectedSize || (product.sizes && product.sizes[0]) || '';

      // Check available stock
      let availableStock = product.stock;
      if (sizeToUse && product.variants && product.variants.length > 0) {
         const variant = product.variants.find(v => v.size.toLowerCase() === sizeToUse.toLowerCase());
         availableStock = variant ? variant.stock : 0;
      }

      if (availableStock <= 0) {
         alert(`Stock depleted for '${product.name}' (${sizeToUse || 'All'})`);
         return;
      }

      const existingIndex = cart.findIndex(item => item.productId === product._id && item.size === sizeToUse);
      if (existingIndex > -1) {
         const currentQty = cart[existingIndex].qty;
         if (currentQty + 1 > availableStock) {
            alert(`Cannot add more than available stock (${availableStock})`);
            return;
         }
         const updated = [...cart];
         updated[existingIndex].qty += 1;
         setCart(updated);
      } else {
         const price = product.salePrice > 0 ? product.salePrice : product.price;
         setCart([
            ...cart,
            {
               productId: product._id,
               name: product.name,
               price: price,
               size: sizeToUse,
               image: (product.images && product.images[0]) || '',
               qty: 1,
               maxStock: availableStock
            }
         ]);
      }
   };

   const updateQty = (index, delta) => {
      const updated = [...cart];
      const newQty = updated[index].qty + delta;
      if (newQty <= 0) {
         updated.splice(index, 1);
      } else if (newQty > updated[index].maxStock) {
         alert(`Stock limit reached (${updated[index].maxStock})`);
      } else {
         updated[index].qty = newQty;
      }
      setCart(updated);
   };

   const removeFromCart = (index) => {
      setCart(cart.filter((_, i) => i !== index));
   };

   // Calculations
   const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
   const discountAmount = Number(discount) || 0;
   const taxAmount = (subtotal - discountAmount) * ((Number(taxRate) || 0) / 100);
   const grandTotal = Math.max(0, subtotal - discountAmount + Math.max(0, taxAmount));
   const changeDue = Math.max(0, (Number(cashTendered) || 0) - grandTotal);

   // Customer search
   const handleSearchCustomer = async () => {
      if (!customerQuery.trim()) return;
      try {
         const res = await api.get(`/pos/customers?query=${encodeURIComponent(customerQuery)}`);
         setCustomerResults(res.data.data || []);
      } catch (err) {
         console.error('Search customer error:', err);
      }
   };

   const handleCreateCustomer = async (e) => {
      e.preventDefault();
      try {
         const res = await api.post('/pos/customers', newCustomer);
         setSelectedCustomer(res.data.data);
         setShowCustomerModal(false);
         setNewCustomer({ name: '', phone: '', email: '' });
      } catch (err) {
         alert(err.response?.data?.message || 'Failed to create customer');
      }
   };

   // Complete Sale
   const handleCheckout = async () => {
      if (cart.length === 0) {
         alert('Cart is empty');
         return;
      }

      if (paymentMethod === 'CASH' && Number(cashTendered) < grandTotal) {
         alert(`Cash tendered (Rs. ${cashTendered}) is less than total (Rs. ${grandTotal})`);
         return;
      }

      setProcessing(true);
      setErrorMessage('');

      try {
         const payload = {
            items: cart.map(item => ({
               productId: item.productId,
               name: item.name,
               size: item.size,
               qty: item.qty
            })),
            customerId: selectedCustomer ? selectedCustomer._id : null,
            customerEmail: selectedCustomer ? selectedCustomer.email : '',
            paymentMethod,
            discount: discountAmount,
            tax: taxAmount
         };

         const res = await api.post('/pos/sale', payload);

         if (res.data.success) {
            setReceiptData(res.data.data.receipt);
            setCart([]);
            setSelectedCustomer(null);
            setDiscount(0);
            setCashTendered('');
            fetchProducts(searchQuery); // Refresh available stock
         }
      } catch (err) {
         console.error('POS Checkout Error:', err);
         setErrorMessage(err.response?.data?.message || 'Sale execution failed');
      } finally {
         setProcessing(false);
      }
   };

   return (
      <div className="space-y-8">
         {/* Top Banner / Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black text-white p-8">
            <div>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 animate-ping"></div>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Terminal Live</span>
               </div>
               <h1 className="text-2xl font-black uppercase tracking-tight mt-1">POS Checkout Terminal</h1>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Authorized Cashier</p>
                  <p className="text-xs font-black uppercase tracking-wider text-white">{user?.name || 'Staff User'}</p>
               </div>
            </div>
         </div>

         {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-600 text-red-600 text-xs font-black uppercase tracking-wider">
               {errorMessage}
            </div>
         )}

         {/* Main Terminal Layout: Left Product Scanner, Right Cart & Tender */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Products & Quick Selector */}
            <div className="lg:col-span-7 space-y-6">
               {/* Search / Barcode Input */}
               <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                     <Input
                        type="text"
                        placeholder="Search product name, SKU or scan barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 font-mono text-sm uppercase"
                     />
                  </div>
                  <Button type="submit" className="bg-black text-white px-6">
                     <Search size={16} />
                  </Button>
                  <Button type="button" onClick={() => { setSearchQuery(''); fetchProducts(''); }} className="bg-brand-grey border border-black text-black">
                     <RefreshCw size={16} />
                  </Button>
               </form>

               {/* Product Grid */}
               {loadingProducts ? (
                  <div className="py-20 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                     Querying Central Stock...
                  </div>
               ) : products.length === 0 ? (
                  <div className="py-20 text-center text-gray-400 text-xs font-black uppercase tracking-widest border border-dashed border-black">
                     No Products Found
                  </div>
               ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[650px] overflow-y-auto pr-2">
                     {products.map((product) => {
                        const hasVariants = product.variants && product.variants.length > 0;
                        return (
                           <div
                              key={product._id}
                              className="bg-white border border-black p-4 flex flex-col justify-between hover:shadow-lg transition-all group"
                           >
                              <div>
                                 <div className="aspect-square bg-brand-grey border border-black overflow-hidden relative mb-3">
                                    <img
                                       src={product.images[0] || 'https://via.placeholder.com/200'}
                                       alt={product.name}
                                       className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 text-[8px] font-black uppercase tracking-widest">
                                       Stock: {product.stock}
                                    </div>
                                 </div>

                                 <h3 className="text-xs font-black uppercase tracking-tight line-clamp-1">{product.name}</h3>
                                 {product.sku && <p className="text-[8px] font-mono text-gray-400">SKU: {product.sku}</p>}

                                 <p className="text-xs font-black mt-1">
                                    Rs. {(product.salePrice > 0 ? product.salePrice : product.price).toLocaleString()}
                                 </p>
                              </div>

                              {/* Size Selector Buttons or Quick Add */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                 {hasVariants ? (
                                    <div className="flex flex-wrap gap-1">
                                       {product.variants.map((v) => (
                                          <button
                                             key={v.size}
                                             type="button"
                                             disabled={v.stock <= 0}
                                             onClick={() => addToCart(product, v.size)}
                                             className={`px-2 py-1 text-[9px] font-black border transition-all ${
                                                v.stock <= 0
                                                   ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                                                   : 'bg-white border-black text-black hover:bg-black hover:text-white'
                                             }`}
                                          >
                                             {v.size} ({v.stock})
                                          </button>
                                       ))}
                                    </div>
                                 ) : (
                                    <Button
                                       type="button"
                                       onClick={() => addToCart(product)}
                                       disabled={product.stock <= 0}
                                       className="w-full text-[9px] font-black uppercase py-2 bg-black text-white"
                                    >
                                       {product.stock > 0 ? '+ Add To Cart' : 'Out of Stock'}
                                    </Button>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>

            {/* Right Column: POS Cart & Checkout */}
            <div className="lg:col-span-5 space-y-6">
               <div className="bg-white border border-black p-6 space-y-6">
                  
                  {/* Attached Customer Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-black">
                     <div>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">Customer</span>
                        <p className="text-xs font-black uppercase tracking-wider">
                           {selectedCustomer ? selectedCustomer.name : 'Walk-In Customer'}
                        </p>
                        {selectedCustomer && <p className="text-[9px] text-gray-500 font-mono">{selectedCustomer.email}</p>}
                     </div>
                     <Button
                        type="button"
                        onClick={() => setShowCustomerModal(true)}
                        className="bg-brand-grey border border-black text-black text-[9px] font-black uppercase px-3 py-1.5"
                     >
                        <User size={12} className="mr-1 inline" />
                        {selectedCustomer ? 'Change' : 'Select Customer'}
                     </Button>
                  </div>

                  {/* Cart Itemized List */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                     {cart.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-xs font-black uppercase tracking-widest border border-dashed border-gray-300">
                           Cart is Empty
                        </div>
                     ) : (
                        cart.map((item, index) => (
                           <div key={`${item.productId}-${item.size}`} className="flex items-center justify-between p-3 bg-brand-grey border border-black">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-white border border-black overflow-hidden">
                                    <img src={item.image || 'https://via.placeholder.com/50'} alt="" className="w-full h-full object-cover" />
                                 </div>
                                 <div>
                                    <h4 className="text-xs font-black uppercase tracking-tight line-clamp-1">{item.name}</h4>
                                    <p className="text-[9px] text-gray-500 font-mono">
                                       {item.size ? `Size: ${item.size} | ` : ''}Rs. {item.price.toLocaleString()}
                                    </p>
                                 </div>
                              </div>

                              <div className="flex items-center gap-3">
                                 <div className="flex items-center border border-black bg-white">
                                    <button
                                       type="button"
                                       onClick={() => updateQty(index, -1)}
                                       className="p-1 hover:bg-gray-200"
                                    >
                                       <Minus size={12} />
                                    </button>
                                    <span className="px-2 text-xs font-black font-mono">{item.qty}</span>
                                    <button
                                       type="button"
                                       onClick={() => updateQty(index, 1)}
                                       className="p-1 hover:bg-gray-200"
                                    >
                                       <Plus size={12} />
                                    </button>
                                 </div>
                                 <button
                                    type="button"
                                    onClick={() => removeFromCart(index)}
                                    className="text-gray-400 hover:text-red-600"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>

                  {/* Calculations & Discounts */}
                  <div className="pt-4 border-t border-black space-y-3 text-xs">
                     <div className="flex justify-between font-black uppercase">
                        <span>Subtotal</span>
                        <span>Rs. {subtotal.toLocaleString()}</span>
                     </div>

                     <div className="flex items-center justify-between gap-4">
                        <span className="font-black uppercase text-[10px]">Discount (Rs.)</span>
                        <input
                           type="number"
                           min="0"
                           value={discount}
                           onChange={(e) => setDiscount(e.target.value)}
                           className="w-28 p-1.5 border border-black font-mono text-right text-xs"
                        />
                     </div>

                     <div className="flex justify-between font-black uppercase text-sm pt-3 border-t border-black">
                        <span>Grand Total</span>
                        <span className="text-base font-black">Rs. {grandTotal.toLocaleString()}</span>
                     </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3 pt-3 border-t border-black">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Payment Method</label>
                     <div className="grid grid-cols-4 gap-2">
                        {['CASH', 'CARD', 'ONLINE', 'OTHER'].map((method) => (
                           <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={`py-2 text-[10px] font-black uppercase border transition-all ${
                                 paymentMethod === method
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-black border-black hover:bg-gray-100'
                              }`}
                           >
                              {method}
                           </button>
                        ))}
                     </div>

                     {/* Cash Tender Calculation */}
                     {paymentMethod === 'CASH' && (
                        <div className="p-3 bg-brand-grey border border-black space-y-2">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase">Tendered (Rs.)</span>
                              <input
                                 type="number"
                                 value={cashTendered}
                                 onChange={(e) => setCashTendered(e.target.value)}
                                 placeholder="0.00"
                                 className="w-32 p-1 border border-black font-mono text-right text-xs bg-white"
                              />
                           </div>
                           <div className="flex justify-between items-center text-xs font-black">
                              <span>Change Due</span>
                              <span className={changeDue > 0 ? 'text-green-600' : 'text-black'}>
                                 Rs. {changeDue.toLocaleString()}
                              </span>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Checkout Button */}
                  <Button
                     type="button"
                     onClick={handleCheckout}
                     disabled={processing || cart.length === 0}
                     className="w-full bg-black text-white py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-800"
                  >
                     {processing ? 'Executing Sale...' : `Complete Sale — Rs. ${grandTotal.toLocaleString()}`}
                  </Button>
               </div>
            </div>
         </div>

         {/* Customer Search / Selection Modal */}
         {showCustomerModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border border-black p-8 max-w-lg w-full space-y-6">
                  <div className="flex justify-between items-center border-b border-black pb-4">
                     <h3 className="text-sm font-black uppercase tracking-widest">Select or Register Customer</h3>
                     <button type="button" onClick={() => setShowCustomerModal(false)}><X size={18} /></button>
                  </div>

                  {/* Search Existing */}
                  <div className="space-y-3">
                     <div className="flex gap-2">
                        <Input
                           type="text"
                           placeholder="Search customer email or phone..."
                           value={customerQuery}
                           onChange={(e) => setCustomerQuery(e.target.value)}
                        />
                        <Button type="button" onClick={handleSearchCustomer} className="bg-black text-white">Search</Button>
                     </div>

                     <div className="max-h-40 overflow-y-auto space-y-1">
                        {customerResults.map((c) => (
                           <div
                              key={c._id}
                              onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }}
                              className="p-3 border border-black cursor-pointer hover:bg-brand-grey flex justify-between items-center"
                           >
                              <div>
                                 <p className="text-xs font-black uppercase">{c.name}</p>
                                 <p className="text-[10px] text-gray-500">{c.email} | {c.phone}</p>
                              </div>
                              <CheckCircle size={14} />
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Create New Walk-in */}
                  <form onSubmit={handleCreateCustomer} className="pt-4 border-t border-black space-y-3">
                     <h4 className="text-xs font-black uppercase tracking-wider">Quick Register New Customer</h4>
                     <Input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                     />
                     <Input
                        type="tel"
                        placeholder="Phone Number"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                     />
                     <Input
                        type="email"
                        placeholder="Email (Optional)"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                     />
                     <Button type="submit" className="w-full bg-black text-white text-xs uppercase font-black py-2.5">
                        Register & Attach
                     </Button>
                  </form>
               </div>
            </div>
         )}

         {/* Receipt Print Modal */}
         {receiptData && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black p-8 max-w-md w-full space-y-6 print:border-none print:shadow-none">
                  <div className="text-center border-b border-black pb-4 space-y-1">
                     <h2 className="text-2xl font-black uppercase tracking-tighter">LUZZIO</h2>
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Official POS Sales Receipt</p>
                     <p className="text-[10px] font-mono mt-2">Order #: {receiptData.orderNumber}</p>
                     <p className="text-[9px] text-gray-500">{new Date(receiptData.date).toLocaleString()}</p>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                     {receiptData.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                           <span>{item.name} {item.size ? `[${item.size}]` : ''} x{item.qty}</span>
                           <span>Rs. {(item.price * item.qty).toLocaleString()}</span>
                        </div>
                     ))}
                  </div>

                  <div className="border-t border-black pt-3 space-y-1 text-xs font-mono">
                     <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>Rs. {receiptData.itemsPrice.toLocaleString()}</span>
                     </div>
                     {receiptData.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                           <span>Discount:</span>
                           <span>-Rs. {receiptData.discount.toLocaleString()}</span>
                        </div>
                     )}
                     <div className="flex justify-between font-black text-sm pt-2 border-t border-black">
                        <span>TOTAL PAID ({receiptData.paymentMethod}):</span>
                        <span>Rs. {receiptData.totalPrice.toLocaleString()}</span>
                     </div>
                  </div>

                  <div className="text-center pt-4 border-t border-black text-[9px] font-black uppercase tracking-widest text-gray-500">
                     Thank you for shopping at Luzzio Storefront!
                  </div>

                  <div className="flex gap-4 print:hidden">
                     <Button type="button" onClick={() => window.print()} className="flex-1 bg-black text-white text-xs font-black uppercase">
                        <Printer size={14} className="mr-2" /> Print Receipt
                     </Button>
                     <Button type="button" onClick={() => setReceiptData(null)} className="flex-1 bg-brand-grey border border-black text-black text-xs font-black uppercase">
                        Close
                     </Button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
