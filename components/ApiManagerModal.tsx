import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Server, 
  Sliders, 
  X,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { apiManager } from '../services/apiManager';
import { ApiKeyConfig, ApiProvider } from '../types';

interface ApiManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysChanged?: () => void;
}

export const ApiManagerModal: React.FC<ApiManagerModalProps> = ({
  isOpen,
  onClose,
  onKeysChanged,
}) => {
  const [keys, setKeys] = useState<ApiKeyConfig[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // New key form
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProvider, setNewProvider] = useState<ApiProvider>('gemini');
  const [newKey, setNewKey] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newModel, setNewModel] = useState('');

  const refreshList = () => {
    setKeys(apiManager.getKeys());
    onKeysChanged?.();
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async (id: string) => {
    setTestingId(id);
    await apiManager.testKey(id);
    setTestingId(null);
    refreshList();
  };

  const handleTestAll = async () => {
    setIsTestingAll(true);
    await apiManager.testAllKeys();
    setIsTestingAll(false);
    refreshList();
  };

  const handleSetActive = (id: string) => {
    apiManager.setActiveKey(id);
    refreshList();
  };

  const handleDelete = (id: string) => {
    apiManager.deleteKey(id);
    refreshList();
  };

  const handleResetExhausted = (id: string) => {
    apiManager.resetKey(id);
    refreshList();
  };

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    let defaultModel = newModel;
    let defaultEndpoint = newEndpoint;

    if (newProvider === 'friendli') {
      defaultEndpoint = defaultEndpoint || 'https://api.friendli.ai/serverless/v1';
      defaultModel = defaultModel || 'meta-llama/Llama-3.2-11B-Vision-Instruct';
    } else if (newProvider === 'openai') {
      defaultEndpoint = defaultEndpoint || 'https://api.openai.com/v1';
      defaultModel = defaultModel || 'gpt-4o-mini';
    } else {
      defaultModel = defaultModel || 'gemini-3.1-flash-lite';
    }

    apiManager.saveKey({
      name: newName.trim() || `${newProvider.toUpperCase()} Key`,
      provider: newProvider,
      key: newKey.trim(),
      endpoint: defaultEndpoint,
      model: defaultModel,
    });

    setIsAdding(false);
    setNewName('');
    setNewKey('');
    setNewEndpoint('');
    setNewModel('');
    refreshList();
  };

  const getStatusBadge = (keyItem: ApiKeyConfig) => {
    if (testingId === keyItem.id || keyItem.status === 'testing') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse">
          <RefreshCw className="w-3 h-3 animate-spin" /> পরীক্ষা হচ্ছে...
        </span>
      );
    }
    if (keyItem.status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          সক্রিয় (Active)
        </span>
      );
    }
    if (keyItem.status === 'exhausted') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          লিমিট শেষ (Quota Exhausted)
        </span>
      );
    }
    if (keyItem.status === 'error') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <AlertTriangle className="w-3 h-3" />
          ত্রুটি (Error)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
        স্ট্যান্ডবাই (Standby)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-xl max-h-[90vh] flex flex-col bg-[#0f0e17] border border-purple-500/30 rounded-3xl shadow-[0_10px_40px_rgba(139,92,246,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                মাল্টি-এপিআই রোটেশন ম্যানেজার
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  Auto-Failover
                </span>
              </h3>
              <p className="text-xs text-purple-300/70">
                একটার লিমিট শেষ হলে সাথে সাথে পরবর্তী কী-তে অটোমেটিক সুইচ হবে
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 sm:px-5 py-3 bg-purple-950/20 border-b border-purple-500/10 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-purple-200">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>সক্রিয় কী: <strong>{apiManager.getActiveKey()?.name || 'নেই'}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestAll}
              disabled={isTestingAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isTestingAll ? 'animate-spin' : ''}`} />
              সবগুলো চেক করুন
            </button>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন কী যুক্ত করুন
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {/* Add Form */}
          {isAdding && (
            <form onSubmit={handleAddKey} className="p-4 rounded-2xl bg-purple-900/20 border border-purple-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-400" />
                  নতুন API Key কনফিগারেশন
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  বাতিল
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-purple-200 font-medium block mb-1">কী এর নাম (Label)</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="যেমন: Friendli AI Key #1"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-purple-200 font-medium block mb-1">প্রোভাইডার (Provider)</label>
                  <select
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value as ApiProvider)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400"
                  >
                    <option value="gemini">Google Gemini API</option>
                    <option value="friendli">Friendli AI (Llama 3.2 Vision)</option>
                    <option value="openai">OpenAI (GPT-4o Vision)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-purple-200 font-medium block mb-1">API Key *</label>
                <input
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder={newProvider === 'friendli' ? 'flp_...' : newProvider === 'openai' ? 'sk-...' : 'AIzaSy...'}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              {newProvider === 'friendli' && (
                <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-200">
                  Friendli AI-এর জন্য <code>meta-llama/Llama-3.2-11B-Vision-Instruct</code> মডেল ডিফল্টভাবে সক্রিয় থাকবে।
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}

          {/* Key List */}
          {keys.map((k, index) => {
            const hasKey = k.key && k.key.trim().length > 0;
            const isMasked = hasKey ? `${k.key.slice(0, 7)}••••••••${k.key.slice(-4)}` : 'কী কনফিগার করা নেই';

            return (
              <div
                key={k.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  k.status === 'active'
                    ? 'bg-purple-900/25 border-purple-500/60 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                    : k.status === 'exhausted'
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-[#151322] border-purple-500/15 hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="w-5 h-5 rounded-full bg-purple-600/20 text-purple-300 text-[10px] font-bold flex items-center justify-center border border-purple-500/30">
                        #{index + 1}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate">{k.name}</h4>
                      {getStatusBadge(k)}
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-purple-200 border border-white/10 uppercase font-mono">
                        {k.provider}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1 flex-wrap">
                      <span className="font-mono text-[11px] text-purple-300/80">{isMasked}</span>
                      {k.model && (
                        <span className="text-[11px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                          {k.model}
                        </span>
                      )}
                      {k.latencyMs !== undefined && (
                        <span className="text-[11px] text-emerald-400">⚡ {k.latencyMs}ms</span>
                      )}
                      <span className="text-[11px] text-neutral-400">ব্যবহার: {k.usageCount || 0} বার</span>
                    </div>

                    {k.errorMessage && (
                      <p className="text-xs text-amber-300/90 mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{k.errorMessage}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {k.status === 'exhausted' && (
                      <button
                        onClick={() => handleResetExhausted(k.id)}
                        title="রিসেট করুন (আবার সক্রিয় হিসেবে টেস্ট করুন)"
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 cursor-pointer"
                      >
                        রিসেট
                      </button>
                    )}

                    {hasKey && (
                      <button
                        onClick={() => handleTestKey(k.id)}
                        disabled={testingId === k.id}
                        title="কী চেক করুন"
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-purple-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${testingId === k.id ? 'animate-spin' : ''}`} />
                      </button>
                    )}

                    {hasKey && k.status !== 'active' && (
                      <button
                        onClick={() => handleSetActive(k.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-xs font-semibold border border-purple-500/40 transition-colors cursor-pointer"
                      >
                        সক্রিয় করুন
                      </button>
                    )}

                    {!k.isSystem && (
                      <button
                        onClick={() => handleDelete(k.id)}
                        title="মুছে ফেলুন"
                        className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {!hasKey && (
                  <div className="mt-2.5 pt-2 border-t border-purple-500/10 flex items-center gap-2">
                    <input
                      type="password"
                      placeholder={`${k.name}-এর API Key এখানে পেস্ট করুন...`}
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          apiManager.saveKey({ id: k.id, key: e.target.value.trim() });
                          refreshList();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-purple-500/20 text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                    <span className="text-[10px] text-purple-300/60">পেস্ট করে বাইরে ট্যাপ করুন</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-purple-950/40 border-t border-purple-500/20 text-xs text-purple-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>সবগুলো কী আপনার ব্রাউজারের সুরক্ষায় লোকাললি সেভ থাকে। কোনো এক্সটার্নাল সার্ভারে পাঠানো হয় না।</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiManagerModal;
