import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [token, setToken] = useState(localStorage.getItem('token'));
   const [guestEmail, setGuestEmail] = useState(localStorage.getItem('guestEmail'));
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      if (savedUser && savedToken) {
         try {
            setUser(JSON.parse(savedUser));
            setToken(savedToken);
         } catch (e) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
         }
      }
      setLoading(false);
   }, []);

   const login = async (email, password) => {
      try {
         const res = await api.post('/auth/login', {
            email,
            password,
            guestEmail // Send local guest identification for merging
         });
         if (res.data.success) {
            const userData = {
               name: res.data.name,
               role: res.data.role,
               email: res.data.email,
               id: res.data._id
            };
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(res.data.token);
            setUser(userData);
            return { success: true };
         }
      } catch (err) {
         return {
            success: false,
            message: err.response?.data?.message || 'Login failed. Please check your credentials.'
         };
      }
   };

   const register = async (name, email, password) => {
      try {
         const res = await api.post('/auth/register', {
            name,
            email,
            password,
            guestEmail // Send local guest identification for merging
         });
         if (res.data.success) {
            const userData = {
               name: res.data.name,
               role: res.data.role,
               email: res.data.email,
               id: res.data._id
            };
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(res.data.token);
            setUser(userData);
            return { success: true };
         }
      } catch (err) {
         return {
            success: false,
            message: err.response?.data?.message || 'Registration failed. Please try again.'
         };
      }
   };

   const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      // We keep guestEmail to allow them to see the Guest Profile after logout
   };

   const setGuestProfile = (email) => {
      localStorage.setItem('guestEmail', email);
      setGuestEmail(email);
   };

   const clearGuestProfile = () => {
      localStorage.removeItem('guestEmail');
      setGuestEmail(null);
   };

   const updateUser = (userData) => {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
   };

   return (
      <AuthContext.Provider value={{ user, token, guestEmail, setGuestProfile, clearGuestProfile, loading, login, register, logout, updateUser }}>
         {children}
      </AuthContext.Provider>
   );
};
