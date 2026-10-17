import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import * as metaPixel from '../utils/metaPixel';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
   const [cart, setCart] = useState([]);
   const [loading, setLoading] = useState(true);
   const { token } = useAuth();
   const debounceTimer = React.useRef(null);

   const fetchCart = async () => {
      if (token) {
         try {
            // First, check if there's a local cart to sync
            const localCart = JSON.parse(localStorage.getItem('cart')) || [];

            if (localCart.length > 0) {
               // Sync local items to server one by one (or potentially add a bulk sync endpoint)
               // For now, we'll iterate to ensure consistency with existing logic
               for (const item of localCart) {
                  await api.post('/cart', {
                     productId: item.product._id,
                     quantity: item.quantity,
                     size: item.size,
                     color: item.color
                  });
               }
               // Clear local storage after successful sync
               localStorage.removeItem('cart');
            }

            const res = await api.get('/cart');
            const items = (res.data.data.items || []).filter(item => item.product !== null);
            setCart(items);
         } catch (err) {
            console.error('Error fetching/merging cart:', err.response?.data?.message || err.message);
         } finally {
            setLoading(false);
         }
      } else {
         const localCart = JSON.parse(localStorage.getItem('cart')) || [];
         setCart(localCart);
         setLoading(false);
      }
   };

   useEffect(() => {
      setLoading(true);
      fetchCart();
   }, [token]);

   const addToCart = async (product, quantity, size, color) => {
      if (token) {
         try {
            // Track Meta Pixel Event
            metaPixel.addToCart(product, quantity, size, color);

            const res = await api.post('/cart', {
               productId: product._id,
               quantity,
               size,
               color
            });
            const items = (res.data.data.items || []).filter(item => item.product !== null);
            setCart(items);
         } catch (err) {
            console.error('Error adding to cart:', err);
         }
      } else {
         // Track Meta Pixel Event
         metaPixel.addToCart(product, quantity, size, color);

         const localCart = (JSON.parse(localStorage.getItem('cart')) || []).filter(item => item.product !== null);
         const index = localCart.findIndex(item => item.product?._id === product._id && item.size === size && item.color === color);
         if (index > -1) {
            localCart[index].quantity += quantity;
         } else {
            localCart.push({ product, quantity, size, color });
         }
         setCart([...localCart]);
         localStorage.setItem('cart', JSON.stringify(localCart));
      }
   };

   const removeFromCart = async (productId, size, color) => {
      if (token) {
         try {
            const res = await api.delete(`/cart/${productId}/${size}/${color}`);
            const items = (res.data.data.items || []).filter(item => item.product !== null);
            setCart(items);
         } catch (err) {
            console.error('Error removing from cart:', err);
         }
      } else {
         const localCart = (JSON.parse(localStorage.getItem('cart')) || []).filter(item => item.product !== null);
         const updatedCart = localCart.filter(item => !(item.product?._id === productId && item.size === size && item.color === color));
         setCart(updatedCart);
         localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
   };

   const updateQuantity = async (productId, size, color, quantity) => {
      // 1. Instant Optimistic Update for UI Smoothness
      const previousCart = [...cart];
      const updatedCart = cart.map(item =>
         item.product && (item.product._id === productId && item.size === size && item.color === color)
            ? { ...item, quantity }
            : item
      );

      setCart(updatedCart);

      // 2. Local Storage Sync (Instant)
      if (!token) {
         localStorage.setItem('cart', JSON.stringify(updatedCart));
         return; // Guests don't need backend sync
      }

      // 3. Debounced Backend Sync (Accuracy & Reliability)
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(async () => {
         try {
            const res = await api.put('/cart', {
               productId,
               size,
               color,
               quantity
            });
            const items = (res.data.data.items || []).filter(item => item.product !== null);
            setCart(items);
         } catch (err) {
            console.error('Error syncing cart quantity:', err);
            // Rollback to previous known good state on critical failure
            setCart(previousCart);
         }
      }, 500); // 500ms delay to catch rapid clicks
   };

   const clearCart = async () => {
      if (token) {
         try {
            const res = await api.delete('/cart');
            setCart(res.data.data.items);
         } catch (err) {
            console.error('Error clearing database cart:', err);
         }
      }
      setCart([]);
      localStorage.removeItem('cart');
   };

   return (
      <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, updateQuantity, clearCart }}>
         {children}
      </CartContext.Provider>
   );
};
