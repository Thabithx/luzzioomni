import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import Meta from '../components/ui/Meta';

export function Login() {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const navigate = useNavigate();
   const { login } = useAuth();

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      const result = await login(email, password);

      if (result.success) {
         const user = JSON.parse(localStorage.getItem('user'));
         if (user?.role === 'admin') {
            navigate('/admin');
         } else {
            navigate('/profile');
         }
      } else {
         setError(result.message);
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-white flex flex-col lg:flex-row">
         <Meta title="Client Access | Luzzio" />

         {/* IMAGE SECTION: CAMPAIGN VISUAL */}
         <div className="hidden lg:block w-1/2 relative bg-brand-grey overflow-hidden">
            <img
               src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1974&auto=format&fit=crop"
               alt="Luzzio Noir Campaign"
               className="absolute inset-0 w-full h-full object-cover grayscale-[40%] hover:grayscale-0 transition-all duration-1000"
            />
            <div className="absolute inset-0 bg-black/5" />
            <div className="absolute bottom-10 left-10 p-10 border border-white/20 backdrop-blur-sm bg-black/10">
               <p className="text-white text-small-brand">Luzzio Archive</p>
               <h2 className="text-white text-3xl font-black uppercase tracking-tighter mt-2">Spring 26 Selection</h2>
            </div>
         </div>

         {/* FORM SECTION: MINIMALIST */}
         <div className="flex-1 flex items-center justify-center p-10 lg:p-20">
            <div className="w-full max-w-sm space-y-16">
               <div className="space-y-4">
                  <p className="text-small-brand text-gray-400">Security Protocol</p>
                  <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Archive Access</h1>
                  <p className="text-[11px] text-gray-500 tracking-widest font-medium">Digital credentials required for order synchronization.</p>
               </div>

               {error && (
                  <div className="p-4 border border-black text-[10px] font-black uppercase tracking-widest bg-brand-grey text-black">
                     Error: {error}
                  </div>
               )}

               <form className="space-y-8" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                     <p className="text-small-brand text-gray-400 pl-1">Email Address</p>
                     <Input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-transparent border-t-0 border-x-0 border-b border-black focus:border-black rounded-none transition-all px-1 py-4"
                     />
                  </div>
                  <div className="space-y-2">
                     <p className="text-small-brand text-gray-400 pl-1">Password</p>
                     <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-transparent border-t-0 border-x-0 border-b border-black focus:border-black rounded-none transition-all px-1 py-4"
                     />
                  </div>

                  <div className="flex items-center justify-between">
                     <Link to="/forgot-password" size="sm" className="text-[10px] uppercase font-bold text-gray-400 hover:text-black transition-colors">Forgot Credentials?</Link>
                  </div>

                  <button className="btn-brand w-full py-5" type="submit" disabled={loading}>
                     {loading ? 'Synchronizing...' : 'Sign In To Archive'}
                  </button>
               </form>

               <div className="pt-10 border-t border-black text-center">
                  <p className="text-small-brand text-gray-400 mb-6">New to the Archive?</p>
                  <Link to="/register" className="inline-block text-small-brand border-b border-black pb-1 hover:opacity-50 transition-opacity">
                     Create Client Profile
                  </Link>
               </div>
            </div>
         </div>
      </div>
   );
}
