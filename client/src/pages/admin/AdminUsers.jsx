import React, { useState, useEffect } from 'react';
import { Shield, Mail, Calendar, UserMinus, Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminUsers = () => {
   const [users, setUsers] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const { token } = useAuth();

   const fetchUsers = async () => {
      try {
         const res = await api.get('/users');
         setUsers(res.data.data);
      } catch (err) {
         console.error('Error fetching users:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchUsers();
   }, []);

   const handleDelete = async (id) => {
      if (window.confirm('PROTOCOL: REVOKING CLIENT ACCESS IS PERMANENT. PROCEED?')) {
         try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
         } catch (err) {
            console.error('Error deleting user:', err);
         }
      }
   };

   const filteredUsers = users.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u._id.includes(searchTerm)
   );

   if (loading) return <div className="p-40 text-center text-small-brand animate-pulse">Syncing Client Registry...</div>;

   return (
      <div className="space-y-12 pb-40">
         {/* HEADER SECTION */}
         <div className="flex justify-between items-end border-b border-black pb-8">
            <div className="space-y-4">
               <p className="text-small-brand text-gray-400">Security Protocol</p>
               <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Client Registry</h1>
            </div>
            <div className="text-right space-y-1">
               <p className="text-[10px] font-black uppercase tracking-widest text-black">{users.length} Active Profiles</p>
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Encrypted Database Access</p>
            </div>
         </div>

         {/* Search bar */}
         <div className="w-full max-w-xl relative">
            <Input
               placeholder="Identify profile (search)..."
               className="pl-14 py-6 border-black focus:border-black rounded-none text-small-brand bg-brand-grey/50"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" size={18} />
         </div>

         {/* Table Section */}
         <div className="bg-white border border-black overflow-x-auto w-full max-w-full">
            <table className="w-full text-left min-w-[1000px]">
               <thead>
                  <tr className="bg-brand-grey border-b border-black">
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Identity</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Digital Coordinates</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Authorization</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Initiation Date</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black text-right">Access Control</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-black">
                  {filteredUsers.map((user) => (
                     <tr key={user._id} className="hover:bg-brand-grey transition-all group">
                        <td className="px-8 py-8">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-black text-white flex items-center justify-center text-[10px] font-black tracking-tighter shrink-0 border border-black shadow-sm">
                                 {user.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="min-w-0">
                                 <div className="text-[11px] font-black uppercase tracking-tight text-black truncate">{user.name}</div>
                                 <div className="text-[9px] text-gray-400 uppercase tracking-widest mt-1 font-bold">UID: {user._id.slice(-8).toUpperCase()}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-8">
                           <div className="flex items-center gap-2 text-[11px] text-gray-500 font-black uppercase tracking-[0.1em]">
                              <Mail size={12} strokeWidth={2.5} className="text-black/20" />
                              {user.email}
                           </div>
                        </td>
                        <td className="px-8 py-8">
                           <div className="flex items-center gap-2">
                              {user.role === 'admin' && <Shield size={12} strokeWidth={2.5} className="text-black" />}
                              <span className={cn(
                                 "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 border border-black",
                                 user.role === 'admin' ? "bg-black text-white px-3" : "bg-white text-black/40 px-3"
                              )}>
                                 {user.role}
                              </span>
                           </div>
                        </td>
                        <td className="px-8 py-8">
                           <div className="flex items-center gap-2 text-[11px] text-gray-500 font-black uppercase tracking-[0.1em]">
                              <Calendar size={12} strokeWidth={2.5} className="text-black/20" />
                              {new Date(user.createdAt).toLocaleDateString()}
                           </div>
                        </td>
                        <td className="px-8 py-8 text-right">
                           <div className="flex justify-end gap-1">
                              <button
                                 className="p-3 text-black/30 hover:text-red-600 hover:bg-white border border-transparent hover:border-black transition-all"
                                 onClick={() => handleDelete(user._id)}
                              >
                                 <UserMinus size={16} strokeWidth={1.5} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
};

export default AdminUsers;
