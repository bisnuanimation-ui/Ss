import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  UserCheck, 
  UserMinus, 
  Plus, 
  RefreshCw, 
  Key, 
  Search, 
  Lock, 
  Unlock, 
  Sparkles, 
  Smartphone,
  CheckCircle2,
  Trash2,
  Building2,
  Cpu
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { UserProfile } from '../types';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Global API Configuration states
  const [globalProvider, setGlobalProvider] = useState<'gemini' | 'deepseek'>('gemini');
  const [globalGeminiKey, setGlobalGeminiKey] = useState('');
  const [globalDeepseekKey, setGlobalDeepseekKey] = useState('');
  const [globalCustomModel, setGlobalCustomModel] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Fetch registered users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const q = collection(db, 'users');
      const snap = await getDocs(q);
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        list.push(d.data() as UserProfile);
      });
      setUsers(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Global Configuration
  const fetchGlobalConfig = async () => {
    try {
      const docRef = doc(db, 'config', 'global');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setGlobalProvider(data.activeProvider || 'gemini');
        setGlobalGeminiKey(data.geminiApiKey || '');
        setGlobalDeepseekKey(data.deepseekApiKey || '');
        setGlobalCustomModel(data.customModel || '');
      }
    } catch (err) {
      console.error("Error fetching global config:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGlobalConfig();
  }, []);

  // Save Global Configuration to Firestore
  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      const docRef = doc(db, 'config', 'global');
      await setDoc(docRef, {
        activeProvider: globalProvider,
        geminiApiKey: globalGeminiKey,
        deepseekApiKey: globalDeepseekKey,
        customModel: globalCustomModel,
        updatedAt: Date.now()
      }, { merge: true });
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving global config:", err);
    } finally {
      setConfigSaving(false);
    }
  };

  // Toggle user subscription status between premium and free
  const handleTogglePremium = async (targetUser: UserProfile) => {
    const isCurrentlyPremium = targetUser.subscription?.status === 'premium';
    const newStatus = isCurrentlyPremium ? 'free' : 'premium';
    
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        'subscription.status': newStatus,
        'subscription.expiresAt': newStatus === 'premium' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : 0 // 30 Days
      });
      
      // Update local state instantly
      setUsers(prev => prev.map(u => {
        if (u.uid === targetUser.uid) {
          return {
            ...u,
            subscription: {
              status: newStatus,
              expiresAt: newStatus === 'premium' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : 0,
              token: u.subscription?.token || ''
            }
          };
        }
        return u;
      }));
    } catch (err) {
      console.error("Error updating subscription status:", err);
    }
  };

  // Reset trials count for user
  const handleResetTrials = async (targetUser: UserProfile) => {
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        dailyGenerations: 0,
        lastGenerationDate: new Date().toISOString().split('T')[0]
      });
      
      // Update local state instantly
      setUsers(prev => prev.map(u => {
        if (u.uid === targetUser.uid) {
          return {
            ...u,
            dailyGenerations: 0,
            lastGenerationDate: new Date().toISOString().split('T')[0]
          };
        }
        return u;
      }));
    } catch (err) {
      console.error("Error resetting trials:", err);
    }
  };

  // Toggle Admin role
  const handleToggleAdmin = async (targetUser: UserProfile) => {
    if (targetUser.email === 'bisnuanimation@gmail.com') return; // Protect master admin
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, { role: newRole });
      
      setUsers(prev => prev.map(u => {
        if (u.uid === targetUser.uid) {
          return { ...u, role: newRole };
        }
        return u;
      }));
    } catch (err) {
      console.error("Error toggling admin role:", err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(term) ||
      u.displayName?.toLowerCase().includes(term) ||
      u.uid.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-neutral-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight">Admin Control Panel (এডমিন প্যানেল)</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">প্রিমিয়াম মেম্বারশিপ ও গ্লোবাল এপিআই কী কনফিগারেশন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Columns Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column: Global Config Setup */}
          <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-white/10 p-6 overflow-y-auto space-y-5 bg-black/20">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Global API Configurations</h4>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              এখানে একটি গ্লোবাল এপিআই সেট করে রাখলে অন্য সাধারণ ব্যবহারকারীরা কোনো পার্সোনাল কী ছাড়াই এই মডেল দিয়ে ছবি অ্যানালাইসিস করতে পারবেন।
            </p>

            <div className="space-y-4 pt-2">
              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">সক্রিয় গ্লোবাল মডেল:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGlobalProvider('gemini')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      globalProvider === 'gemini'
                        ? 'bg-blue-600/10 border-blue-500 text-white'
                        : 'bg-white/5 border-white/5 text-neutral-400'
                    }`}
                  >
                    Google Gemini
                  </button>
                  <button
                    onClick={() => setGlobalProvider('deepseek')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      globalProvider === 'deepseek'
                        ? 'bg-cyan-600/10 border-cyan-500 text-white'
                        : 'bg-white/5 border-white/5 text-neutral-400'
                    }`}
                  >
                    deepseek-chat
                  </button>
                </div>
              </div>

              {/* Gemini Key */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Global Gemini API Key:</label>
                <input
                  type="password"
                  placeholder="Paste global Gemini Key here"
                  value={globalGeminiKey}
                  onChange={(e) => setGlobalGeminiKey(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* DeepSeek Key */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Global DeepSeek (OpenRouter) Key:</label>
                <input
                  type="password"
                  placeholder="Paste sk-or-... key here"
                  value={globalDeepseekKey}
                  onChange={(e) => setGlobalDeepseekKey(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Custom Model */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Custom Model Name (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. deepseek/deepseek-chat"
                  value={globalCustomModel}
                  onChange={(e) => setGlobalCustomModel(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {configSuccess && (
                <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 justify-center py-1 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>গ্লোবাল এপিআই কনফিগারেশন সেভ হয়েছে!</span>
                </div>
              )}

              <button
                onClick={handleSaveConfig}
                disabled={configSaving}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                {configSaving ? 'Saving Configurations...' : 'Save Config (এপিআই সেভ করুন)'}
              </button>
            </div>
          </div>

          {/* Right Column: User list & Subscriptions Management */}
          <div className="flex-1 p-6 flex flex-col overflow-hidden">
            {/* Search Bar */}
            <div className="relative mb-4 shrink-0">
              <Search className="w-4 h-4 text-neutral-500 absolute top-3.5 left-3.5" />
              <input
                type="text"
                placeholder="ইউজার বা ইমেল সার্চ করুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 transition-all"
              />
            </div>

            {/* Users List Container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingUsers ? (
                <div className="text-center py-10 text-xs text-neutral-400">Loading user database...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-xs text-neutral-500">কোনো ইউজার খুঁজে পাওয়া যায়নি।</div>
              ) : (
                filteredUsers.map((item) => (
                  <div
                    key={item.uid}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {item.photoURL ? (
                        <img src={item.photoURL} alt="" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-400">
                          {item.displayName?.substring(0, 1) || 'U'}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-white truncate max-w-[150px]">{item.displayName}</span>
                          {item.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                              Admin
                            </span>
                          )}
                          {item.subscription?.status === 'premium' ? (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                              Premium
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-neutral-800 text-neutral-400 uppercase">
                              Free
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5">{item.email}</p>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          আজকের ব্যবহার: <span className="text-blue-400 font-bold">{item.dailyGenerations || 0}/5</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      {/* Premium subscription toggle */}
                      <button
                        onClick={() => handleTogglePremium(item)}
                        title={item.subscription?.status === 'premium' ? "Remove premium subscription" : "Grant premium subscription"}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1 ${
                          item.subscription?.status === 'premium'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                        }`}
                      >
                        {item.subscription?.status === 'premium' ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        <span>{item.subscription?.status === 'premium' ? 'Free করুন' : 'Premium দিন'}</span>
                      </button>

                      {/* Reset Trial Counter */}
                      <button
                        onClick={() => handleResetTrials(item)}
                        title="Reset daily trial counts to 0"
                        className="p-1.5 rounded-xl bg-white/5 border border-white/5 text-neutral-400 hover:text-white transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      {/* Toggle admin roles */}
                      <button
                        onClick={() => handleToggleAdmin(item)}
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-[9px] border transition-colors ${
                          item.role === 'admin'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-white/5 text-neutral-400 border-white/5 hover:text-white'
                        }`}
                        disabled={item.email === 'bisnuanimation@gmail.com'}
                      >
                        {item.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
