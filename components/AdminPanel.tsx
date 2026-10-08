import React, { useEffect, useState } from 'react';
import { collection, query, limit, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { Users, FileText, X, Shield, Clock, Key } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminPanelProps {
  onClose: () => void;
}

interface UserRecord extends UserProfile {
  createdAt?: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(50)));
      const usersList = usersSnap.docs.map(doc => doc.data() as UserRecord);
      setUsers(usersList);
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addTime = async (userId: string, months: number) => {
    setUpdating(userId);
    try {
      const userRef = doc(db, 'users', userId);
      const user = users.find(u => u.uid === userId);
      if (!user) return;

      const now = Date.now();
      const currentExpiry = user.subscription?.expiresAt || now;
      const baseTime = currentExpiry < now ? now : currentExpiry;
      
      const newExpiry = baseTime + (months * 30 * 24 * 60 * 60 * 1000);

      await setDoc(userRef, {
        subscription: {
          ...user.subscription,
          status: 'premium',
          expiresAt: newExpiry
        }
      }, { merge: true });

      await fetchData();
    } catch (err) {
      console.error("Failed to add time:", err);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-4 sm:p-12 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#080808] border border-white/10 rounded-[3rem] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_150px_rgba(0,0,0,0.8)]"
      >
        <div className="p-10 border-b border-white/5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-5 h-5 text-blue-500" />
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Admin System</h2>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">User Authorization & Subscription Management</p>
          </div>
          <button 
            onClick={onClose}
            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <div className="w-10 h-10 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Scanning Registry...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 p-8 rounded-[2rem] hover:border-white/10 transition-colors group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Registered Users</h3>
                  </div>
                  <p className="text-5xl font-black text-white tracking-tighter italic">{users.length}</p>
                </div>
                
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 p-8 rounded-[2rem] hover:border-white/10 transition-colors group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6 text-purple-500" />
                    </div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Active Subs</h3>
                  </div>
                  <p className="text-5xl font-black text-white tracking-tighter italic">
                    {users.filter(u => u.subscription?.status === 'premium' && u.subscription.expiresAt > Date.now()).length}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 p-8 rounded-[2rem] hover:border-white/10 transition-colors group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Key className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Access Tokens</h3>
                  </div>
                  <p className="text-5xl font-black text-white tracking-tighter italic">SECURE</p>
                </div>
              </div>

              <div className="bg-white/[0.01] border border-white/5 rounded-[2rem] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/[0.03] text-[10px] uppercase font-black tracking-[0.3em] text-gray-500">
                        <th className="px-8 py-6">Identity</th>
                        <th className="px-8 py-6">Unique Token</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-8 py-6">Authorization Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u, i) => {
                        const isPremium = u.subscription?.status === 'premium' && u.subscription.expiresAt > Date.now();
                        const expiryDate = u.subscription?.expiresAt ? new Date(u.subscription.expiresAt).toLocaleDateString() : 'None';
                        
                        return (
                          <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <img src={u.photoURL || ''} alt="" className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10" />
                                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#080808] ${u.role === 'admin' ? 'bg-blue-500' : 'bg-gray-700'}`} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white tracking-tight">{u.displayName}</p>
                                  <p className="text-[10px] text-gray-600 font-medium">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                                  <code className="text-[10px] font-mono text-blue-400 select-all">{u.subscription?.token || 'N/A'}</code>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="space-y-1">
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest ${isPremium ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                  {isPremium ? 'PREMIUM' : 'INACTIVE'}
                                </span>
                                {isPremium && <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Exp: {expiryDate}</p>}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <button
                                  disabled={updating === u.uid}
                                  onClick={() => addTime(u.uid, 1)}
                                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-white hover:bg-white hover:text-black transition-all disabled:opacity-50"
                                >
                                  +1 Mon
                                </button>
                                <button
                                  disabled={updating === u.uid}
                                  onClick={() => addTime(u.uid, 3)}
                                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-white hover:bg-white hover:text-black transition-all disabled:opacity-50"
                                >
                                  +3 Mon
                                </button>
                                <button
                                  disabled={updating === u.uid}
                                  onClick={() => addTime(u.uid, 12)}
                                  className="px-4 py-2 bg-blue-500 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase text-white hover:bg-blue-600 transition-all disabled:opacity-50"
                                >
                                  +1 Year
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-8 bg-black border-t border-white/5 flex items-center justify-between">
          <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.5em]">Vision Core v5.1 / Unified Access Control</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Service Operational</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPanel;

