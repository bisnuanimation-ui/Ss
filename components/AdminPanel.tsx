import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  UserCheck, 
  UserMinus, 
  RefreshCw, 
  Key, 
  Search, 
  Lock, 
  Unlock, 
  Sparkles, 
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc
} from 'firebase/firestore';
import { UserProfile } from '../types';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  // Password Lock states
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showPasswordChar, setShowPasswordChar] = useState(false);

  // Panel active tab: 'users' | 'api'
  const [activeTab, setActiveTab] = useState<'users' | 'api'>('users');

  // Users database states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Central Universal Global API state configured by Admin
  const [globalApiKey, setGlobalApiKey] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Authenticate Admin Password (152643)
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '152643') {
      setIsAuthorized(true);
      setPasswordError(false);
      fetchUsers();
      fetchGlobalConfig();
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  // Fetch all users
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
      console.error("Error fetching users database:", err);
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
        setGlobalApiKey(data.apiKey || '');
      }
    } catch (err) {
      console.error("Error loading global configuration:", err);
    }
  };

  // Save Universal Central API Configuration
  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      const docRef = doc(db, 'config', 'global');
      await setDoc(docRef, {
        apiKey: globalApiKey.trim(),
        updatedAt: Date.now()
      }, { merge: true });
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving centralized global API config:", err);
    } finally {
      setConfigSaving(false);
    }
  };

  // Grant/Revoke Premium membership
  const handleTogglePremium = async (targetUser: UserProfile) => {
    const isCurrentlyPremium = targetUser.subscription?.status === 'premium';
    const newStatus = isCurrentlyPremium ? 'free' : 'premium';
    
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        'subscription.status': newStatus,
        'subscription.expiresAt': newStatus === 'premium' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : 0
      });
      
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
      console.error("Error updating user subscription:", err);
    }
  };

  // Reset daily generation trials to 0
  const handleResetTrials = async (targetUser: UserProfile) => {
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        dailyGenerations: 0,
        lastGenerationDate: new Date().toISOString().split('T')[0]
      });
      
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
      console.error("Error resetting user trials:", err);
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

  // Render Password Lock Screen initially
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>

          <h3 className="text-lg font-extrabold text-white tracking-tight">এডমিন পাসওয়ার্ড প্রয়োজন</h3>
          <p className="text-[11px] text-neutral-400 mt-1">প্যানেলে প্রবেশ করতে এডমিন সিকিউরিটি পিন নম্বর প্রদান করুন।</p>

          <form onSubmit={handleVerifyPassword} className="mt-5 space-y-4">
            <div className="relative">
              <input
                type={showPasswordChar ? "text" : "password"}
                placeholder="পিন নম্বর লিখুন..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={10}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-4 pr-11 text-center font-mono text-sm tracking-widest text-white focus:outline-none focus:border-rose-500/50 transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPasswordChar(!showPasswordChar)}
                className="absolute top-3.5 right-3.5 text-neutral-500 hover:text-white"
              >
                {showPasswordChar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {passwordError && (
              <p className="text-[11px] text-red-400 font-bold flex items-center gap-1 justify-center animate-shake">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।</span>
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white text-xs font-semibold transition-colors"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs transition-all"
              >
                প্রবেশ করুন
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-neutral-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white shadow-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight">Admin Dashboard (পাসওয়ার্ড সুরক্ষিত)</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">প্রিমিয়াম মেম্বারশিপ এবং সার্বজনীন গ্লোবাল এপিআই কন্ট্রোল</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admin Tabs */}
        <div className="flex bg-black/20 border-b border-white/10 px-6 shrink-0 gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'users' 
                ? 'border-rose-500 text-white font-extrabold' 
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>ইউজার ডাটাবেজ ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'api' 
                ? 'border-rose-500 text-white font-extrabold' 
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>সেন্ট্রাল গ্লোবাল এপিআই (Central AI Key)</span>
          </button>
        </div>

        {/* Main Tab Views */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {activeTab === 'api' ? (
            <div className="max-w-2xl w-full mx-auto space-y-5 overflow-y-auto">
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-2">
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <Key className="w-4 h-4" />
                  <span>সার্বজনীন সেন্ট্রাল এপিআই ডিস্ট্রিবিউশন (Centralized API Auto-Detection)</span>
                </h4>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  এখানে আপনি একটি সেন্ট্রাল এপিআই কী বসিয়ে দিলে, সমস্ত গ্রাহকদের জন্য ব্যাকগ্রাউন্ডে সেই এপিআই দিয়ে সার্ভিসটি চলতে থাকবে। আলাদা এপিআই প্রোভাইডার সিলেক্ট করা লাগবে না—সিস্টেম স্বয়ংক্রিয়ভাবে কী-টি কোন مدلের তা ডিটেক্ট করে নেবে:
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-mono text-neutral-400">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-blue-400 font-bold block mb-0.5">Google Gemini:</span>
                    কী শুরু হবে <code className="text-white">AIzaSy</code> দিয়ে
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-cyan-400 font-bold block mb-0.5">OpenRouter:</span>
                    কী শুরু হবে <code className="text-white">sk-or-</code> দিয়ে
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-purple-400 font-bold block mb-0.5">DeepSeek / OpenAI:</span>
                    কী শুরু হবে <code className="text-white">sk-</code> দিয়ে
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {/* Global API Key */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Universal Central API Key:</label>
                  <input
                    type="password"
                    placeholder="পাস্ট করুন (Paste Gemini, OpenRouter, or DeepSeek API Key here)"
                    value={globalApiKey}
                    onChange={(e) => setGlobalApiKey(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono placeholder:text-neutral-700 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {configSuccess && (
                  <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 justify-center py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>গ্লোবাল এপিআই কনফিগারেশন সফলভাবে আপডেট হয়েছে!</span>
                  </div>
                )}

                <button
                  onClick={handleSaveConfig}
                  disabled={configSaving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider transition-all"
                >
                  {configSaving ? 'Saving Configurations...' : 'Save global configuration (কনফিগারেশন সেভ করুন)'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search user database */}
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

              {/* Users scroll list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loadingUsers ? (
                  <div className="text-center py-12 text-xs text-neutral-400">Loading user database...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-xs text-neutral-500">কোনো ইউজার খুঁজে পাওয়া যায়নি।</div>
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
                            আজকের ব্যবহার: <span className="text-blue-400 font-bold">{item.dailyGenerations || 0}/10</span>
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => handleTogglePremium(item)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1 ${
                            item.subscription?.status === 'premium'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                          }`}
                        >
                          {item.subscription?.status === 'premium' ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          <span>{item.subscription?.status === 'premium' ? 'Free করুন' : 'Premium দিন'}</span>
                        </button>

                        <button
                          onClick={() => handleResetTrials(item)}
                          title="Reset Trials"
                          className="p-1.5 rounded-xl bg-white/5 border border-white/5 text-neutral-400 hover:text-white transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
