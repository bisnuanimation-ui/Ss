import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  LogIn, 
  LogOut, 
  History, 
  Wand2, 
  HelpCircle, 
  AlertCircle,
  X,
  Clock,
  ArrowRight,
  Key,
  ExternalLink,
  Check,
  Cpu,
  Shield,
  MessageSquare,
  Lock,
  Unlock,
  CheckCircle2
} from 'lucide-react';
import Header from './components/Header';
import ImagePreview from './components/ImagePreview';
import ResultsView from './components/ResultsView';
import { AdminPanel } from './components/AdminPanel';
import { analyzeImage } from './services/geminiService';
import { analyzeImageWithDeepSeek } from './services/deepseekService';
import { AppState, AnalysisResult } from './types';
import { useFirebase } from './components/FirebaseProvider';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const App: React.FC = () => {
  const { 
    user, 
    history, 
    signIn, 
    logout, 
    saveAnalysis, 
    clearHistory, 
    incrementGenerationCount,
    authError,
    setAuthError
  } = useFirebase();
  const [state, setState] = useState<AppState>({
    image: null,
    imageMimeType: null,
    isAnalyzing: false,
    result: null,
    error: null,
  });

  const [showHistory, setShowHistory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Active API Provider ('gemini' | 'deepseek')
  const [activeProvider, setActiveProvider] = useState<'gemini' | 'deepseek'>(() => {
    return (localStorage.getItem('promptvision_active_provider') as 'gemini' | 'deepseek') || 'gemini';
  });

  // Gemini API Key
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('promptvision_custom_api_key') || '';
  });

  // DeepSeek API Key
  const [deepseekApiKey, setDeepseekApiKey] = useState<string>(() => {
    return localStorage.getItem('promptvision_deepseek_api_key') || '';
  });

  const [tempGeminiKey, setTempGeminiKey] = useState<string>(customApiKey);
  const [tempDeepseekKey, setTempDeepseekKey] = useState<string>(deepseekApiKey);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Admin Configured Global Configuration state
  const [globalConfig, setGlobalConfig] = useState<any>(null);

  // Real-time listener for Global Configurations from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'global'), (snap) => {
      if (snap.exists()) {
        setGlobalConfig(snap.data());
      }
    }, (err) => {
      console.warn("Global config load note:", err);
    });
    return () => unsub();
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setState(prev => ({ ...prev, error: 'অনুগ্রহ করে একটি সঠিক ছবির ফাইল নির্বাচন করুন (Please select a valid image).' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setState(prev => ({
        ...prev,
        image: base64,
        imageMimeType: file.type,
        result: null,
        error: null,
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const handleSelectSample = useCallback((base64: string, mimeType: string) => {
    setState(prev => ({
      ...prev,
      image: base64,
      imageMimeType: mimeType,
      result: null,
      error: null,
    }));
  }, []);

  const handleRemove = useCallback(() => {
    setState(prev => ({
      ...prev,
      image: null,
      imageMimeType: null,
      result: null,
      error: null,
    }));
  }, []);

  const handleAnalyze = async () => {
    if (!state.image || !state.imageMimeType) return;

    // Enforce authentication
    if (!user) {
      setState(prev => ({ ...prev, error: 'অনুগ্রহ করে প্রথমে গুগল সাইন-ইন সম্পন্ন করুন।' }));
      signIn();
      return;
    }

    // 1. Enforce trial count increment & limits
    const allowed = await incrementGenerationCount();
    if (!allowed) {
      setShowUpgradeModal(true);
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      let result: AnalysisResult;

      // Determine key/provider prioritizing personal key first, falling back to global admin keys
      const finalProvider = activeProvider || globalConfig?.activeProvider || 'gemini';
      const finalGeminiKey = customApiKey || globalConfig?.geminiApiKey;
      const finalDeepseekKey = deepseekApiKey || globalConfig?.deepseekApiKey;

      if (finalProvider === 'deepseek') {
        if (!finalDeepseekKey) {
          throw new Error('DEEPSEEK_API_KEY_MISSING');
        }
        result = await analyzeImageWithDeepSeek(
          state.image, 
          state.imageMimeType, 
          finalDeepseekKey, 
          finalGeminiKey
        );
      } else {
        result = await analyzeImage(state.image, state.imageMimeType, finalGeminiKey);
      }

      setState(prev => ({ ...prev, result, isAnalyzing: false }));

      // Save to recent history
      await saveAnalysis(result, state.image);
    } catch (err: any) {
      console.error("Analysis execution failed:", err);
      let errorMessage = 'বিশ্লেষণ ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন (Analysis failed).';

      if (err.message === 'DEEPSEEK_API_KEY_MISSING') {
        errorMessage = 'DeepSeek API Key প্রয়োজন: অনুগ্রহ করে উপরে সেটিংসে গিয়ে DeepSeek বা OpenRouter কী সেভ করুন অথবা অ্যাডমিনকে গ্লোবাল কী সেট করতে বলুন।';
      } else if (err.message?.includes('QUOTA_EXCEEDED') || err.message?.includes('RESOURCE_EXHAUSTED') || err.status === 429) {
        errorMessage = 'কোটা শেষ হয়েছে (Quota Exceeded): অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।';
      } else if (err.message?.includes('API_KEY_INVALID')) {
        errorMessage = 'API Key ত্রুটি: আপনার এপিআই কী-টি ভুল বা নিষ্ক্রিয়। দয়া করে সঠিক কী চেক করুন।';
      } else {
        errorMessage = `বিশ্লেষণ ব্যর্থ হয়েছে (Details): ${err.message || err}`;
      }

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
      }));
    }
  };

  const handleSelectHistoryItem = (itemResult: AnalysisResult, thumb: string) => {
    setState({
      image: thumb || null,
      imageMimeType: 'image/jpeg',
      isAnalyzing: false,
      result: itemResult,
      error: null,
    });
    setShowHistory(false);
  };

  const handleSaveApiKeySettings = () => {
    const trimmedGemini = tempGeminiKey.trim();
    const trimmedDeepseek = tempDeepseekKey.trim();

    setCustomApiKey(trimmedGemini);
    setDeepseekApiKey(trimmedDeepseek);

    localStorage.setItem('promptvision_custom_api_key', trimmedGemini);
    localStorage.setItem('promptvision_deepseek_api_key', trimmedDeepseek);
    localStorage.setItem('promptvision_active_provider', activeProvider);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowApiKeyModal(false);
    }, 1500);
  };

  const handleClearGeminiKey = () => {
    setCustomApiKey('');
    setTempGeminiKey('');
    localStorage.removeItem('promptvision_custom_api_key');
  };

  const handleClearDeepseekKey = () => {
    setDeepseekApiKey('');
    setTempDeepseekKey('');
    localStorage.removeItem('promptvision_deepseek_api_key');
  };

  const isReady = !!state.image && !state.isAnalyzing;

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col font-sans selection:bg-blue-500/30">
      {/* Top Navbar */}
      <nav className="w-full border-b border-white/10 bg-black/50 backdrop-blur-xl px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              PromptVision <span className="text-blue-400">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin Panel Button */}
            {user && (user.role === 'admin' || user.email === 'bisnuanimation@gmail.com') && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-400 flex items-center gap-1.5 transition-all animate-pulse"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>🛡️ Admin Panel</span>
              </button>
            )}

            {/* Custom Model / API Key Button */}
            <button
              onClick={() => {
                setTempGeminiKey(customApiKey);
                setTempDeepseekKey(deepseekApiKey);
                setShowApiKeyModal(true);
              }}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                customApiKey || deepseekApiKey
                  ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {activeProvider === 'deepseek' 
                  ? `DeepSeek / deepseek-chat ${deepseekApiKey ? '(Active)' : '(Setup)'}` 
                  : `Gemini API ${customApiKey ? '(Active)' : '(Centralized)'}`}
              </span>
            </button>

            <button
              onClick={() => setShowGuide(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>ব্যবহার সহায়িকা (Guide)</span>
            </button>

            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>হিস্ট্রি ({history.length})</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                {user.photoURL && (
                  <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full border border-white/20" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-neutral-300 font-bold truncate max-w-[100px]">
                    {user.displayName}
                  </span>
                  <span className="text-[9px] text-amber-400 font-bold">
                    {user.subscription?.status === 'premium' ? '🏆 Premium' : 'Free Trial'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 py-8">
        {!state.result && <Header />}

        {/* Upload & Action Area */}
        {!state.result && (
          <section className="mt-4 mb-12">
            <ImagePreview
              image={state.image}
              onUpload={handleFileUpload}
              onSelectSample={handleSelectSample}
              onRemove={handleRemove}
              isAnalyzing={state.isAnalyzing}
            />

            <div className="flex flex-col items-center gap-4 mt-6">
              {/* Login Banner for Guests */}
              {!user && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2 max-w-md text-center">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span> ছবি বিশ্লেষণ করতে অনুগ্রহ করে প্রথমে গুগল সাইন-ইন করুন (৫ বার ফ্রি ট্রায়াল সুযোগ পাবেন)।</span>
                </div>
              )}

              {user && (
                <div className="text-xs text-neutral-400">
                  আজকের অবশিষ্ট ফ্রি ট্রায়াল: <span className="font-bold text-white">{(5 - (user.dailyGenerations || 0)) < 0 ? 0 : (5 - (user.dailyGenerations || 0))}/5</span>
                </div>
              )}

              <motion.button
                whileHover={isReady ? { scale: 1.02 } : {}}
                whileTap={isReady ? { scale: 0.98 } : {}}
                onClick={handleAnalyze}
                disabled={!isReady}
                className={`relative px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl ${
                  isReady
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:brightness-110 shadow-blue-500/25 cursor-pointer ring-1 ring-white/20'
                    : 'bg-white/5 text-neutral-500 border border-white/10 cursor-not-allowed'
                }`}
              >
                {state.isAnalyzing ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                    </div>
                    <span>বিশ্লেষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>প্রম্পট তৈরি করুন</span>
                  </>
                )}
              </motion.button>

              {state.error && (
                <div className="mt-2 flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs max-w-lg text-center">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Results View */}
        <AnimatePresence>
          {state.result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4"
            >
              <ResultsView
                result={state.result}
                imageUrl={state.image}
                onReset={() =>
                  setState({
                    image: null,
                    imageMimeType: null,
                    isAnalyzing: false,
                    result: null,
                    error: null,
                  })
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Usage Workflow Cards */}
        {!state.result && (
          <section className="mt-16 pt-12 border-t border-white/5">
            <h3 className="text-center text-xs font-bold uppercase tracking-widest text-neutral-400 mb-8">
              সহজ ৩ ধাপে অন্য ছবিতে প্রম্পট ব্যবহার করুন (How to use on other images)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 font-bold text-sm">
                  ১
                </div>
                <h4 className="text-sm font-bold text-white mb-2">ছবি আপলোড করুন</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  আপনার পছন্দের যেকোনো আর্ট, ফটো বা ডিজাইন আপলোড করুন। AI এর ক্যামেরা, লাইটিং ও পোজ স্ক্যান করবে।
                </p>
              </div>

              <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 font-bold text-sm">
                  ২
                </div>
                <h4 className="text-sm font-bold text-white mb-2">প্রম্পট পান ও কাস্টমাইজ করুন</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  সম্পূর্ণ মাস্টার প্রম্পট, মিডজার্নি ফরম্যাট অথবা "Subject Swap" টেমপ্লেট বেছে নিয়ে এক ক্লিকে কপি করুন।
                </p>
              </div>

              <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 font-bold text-sm">
                  ৩
                </div>
                <h4 className="text-sm font-bold text-white mb-2">নতুন ছবি তৈরি করুন</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Midjourney, Flux, Stable Diffusion বা DALL-E তে প্রম্পটটি পেস্ট করে একই কোয়ালিটি ও স্টাইলে নতুন ছবি জেনারেট করুন!
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Admin Panel Modal Overlay */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}

      {/* Premium Upgrade Block Modal Overlay */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-amber-500/20 rounded-3xl max-w-md w-full p-6 text-center relative overflow-hidden shadow-2xl"
          >
            <div className="absolute -top-10 -left-10 w-40 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400 animate-bounce">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">আপনার ৫টি ফ্রি ট্রায়াল লিমিট শেষ!</h3>
            <p className="text-xs text-neutral-300 mt-2.5 leading-relaxed">
              আজকের ফ্রি ছবি বিশ্লেষণের লিমিট শেষ হয়ে গেছে। আনলিমিটেড ব্যবহার এবং হাই-এন্ড প্রম্পট সার্ভিস চালু রাখতে আজই মাত্র **২০ টাকা** দিয়ে প্রিমিয়াম মেম্বারশিপ কিনুন!
            </p>

            <div className="my-5 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-left">
              <p className="text-xs font-semibold text-neutral-300">যোগাযোগের নম্বর (WhatsApp):</p>
              <p className="text-base font-extrabold text-amber-400 tracking-wider">01332756124</p>
              <p className="text-[10px] text-neutral-500 leading-relaxed">* যোগাযোগ করার পর অ্যাডমিন প্যানেল থেকে আপনার অ্যাকাউন্টে প্রিমিয়াম মেম্বারশিপ সচল করে দেওয়া হবে।</p>
            </div>

            <div className="space-y-3">
              <a
                href={`https://wa.me/8801332756124?text=Hi%2C%2520I%2520want%2520to%2520purchase%2520premium%2520subscription%2520for%2520PromptVision%2520AI%2520for%252520my%2520email%2520${user?.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:shadow-lg shadow-amber-500/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>হোয়াটসঅ্যাপে কিনুন (Buy Premium)</span>
              </a>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-medium transition-colors"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Model & API Key Settings Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h3 className="font-bold text-base text-white">API Model Settings (এপিআই মডেল কনফিগারেশন)</h3>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Active Provider Selector */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-400 block uppercase tracking-wider">
                  Active AI Model (সক্রিয় এপিআই মডেল নির্বাচন করুন):
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveProvider('gemini')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      activeProvider === 'gemini'
                        ? 'bg-blue-500/10 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5 mb-1 text-blue-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Google Gemini</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                      Gemini 1.5/3.8 Flash মডেল। আল্ট্রা-ফাস্ট ও মাল্টিমোডাল ছবি অ্যানালাইসিস।
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveProvider('deepseek')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      activeProvider === 'deepseek'
                        ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5 mb-1 text-cyan-400">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>deepseek-chat</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                      DeepSeek-Chat (OpenRouter / DeepSeek API)। বুদ্ধিমত্তা ও প্রম্পট রাইটিং মাস্টার।
                    </p>
                  </button>
                </div>
              </div>

              {/* Gemini Section */}
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Google Gemini API Key:
                  </span>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-neutral-400 hover:text-blue-400 flex items-center gap-1 font-bold underline"
                  >
                    <span>ফ্রি লিঙ্ক</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy... (Gemini Key)"
                    value={tempGeminiKey}
                    onChange={(e) => setTempGeminiKey(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-neutral-700 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {customApiKey && (
                    <button
                      onClick={handleClearGeminiKey}
                      className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 text-[10px] font-medium transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* DeepSeek Section */}
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" /> DeepSeek (OpenRouter) Key:
                  </span>
                  <a
                    href="https://openrouter.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-neutral-400 hover:text-cyan-400 flex items-center gap-1 font-bold underline"
                  >
                    <span>ফ্রি OpenRouter লিঙ্ক</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="sk-or-... / sk-api... (DeepSeek / OpenRouter)"
                    value={tempDeepseekKey}
                    onChange={(e) => setTempDeepseekKey(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-neutral-700 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  {deepseekApiKey && (
                    <button
                      onClick={handleClearDeepseekKey}
                      className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 text-[10px] font-medium transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">
                  * **deepseek/deepseek-chat** ওপেনরাউটার বা ডিপসিক অফিসিয়াল এপিআই-এর মাধ্যমে চলবে। এটি ছবির মাইক্রো-ডিটেইলস বিশ্লেষণ করতে আমাদের ডাইনামিক হাইব্রিড পার্সিং টেকনিক ব্যবহার করে।
                </p>
              </div>

              {saveSuccess && (
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 justify-center py-1">
                  <Check className="w-4 h-4" />
                  <span>কনফিগারেশন সফলভাবে সেভ হয়েছে!</span>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={handleSaveApiKeySettings}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  সেভ ও সক্রিয় করুন (Save & Activate)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* History Drawer Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">পূর্বের তৈরি প্রম্পট হিস্ট্রি (History)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistoryItem(item.result, item.imageThumbnail)}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 cursor-pointer transition-all flex items-center gap-4 group"
                >
                  {item.imageThumbnail ? (
                    <img
                      src={item.imageThumbnail}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-neutral-800 border border-white/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-neutral-500" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-200 line-clamp-2 font-mono leading-relaxed">
                      {item.result.masterPrompt}
                    </p>
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Click to view
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <span>কীভাবে প্রম্পট ব্যবহার করবেন? (User Guide)</span>
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-blue-400 block mb-1">১. Master Prompt (মাস্টার প্রম্পট):</strong>
                পুরো ছবিটি যেভাবে তৈরি করা হয়েছে (বিষয়, আলো, ব্যাকগ্রাউন্ড, ৮৫মিমি লেন্স, টেক্সচার) হুবহু নকল বা নতুনভাবে বানাতে এটি ব্যবহার করুন।
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-purple-400 block mb-1">২. Subject Swap (অন্য চরিত্র বসাতে):</strong>
                এই অপশনে মূল পোজ এবং ব্যাকগ্রাউন্ড ঠিক থাকবে, শুধু <code>[Insert Subject / Character Here]</code> লেখাটি বদলে আপনার কাঙ্ক্ষিত চরিত্র (যেমন: "a futuristic astronaut" বা "a cybernetic tiger") বসিয়ে দিন।
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-indigo-400 block mb-1">৩. Style Transfer (আর্ট স্টাইল রিইউজ):</strong>
                কোনো নির্দিষ্ট মানুষ বা চরিত্র ছাড়াই ছবির আর্ট স্টাইল ও লাইটিং অন্য যেকোনো আইডিয়ার সাথে যোগ করতে পারেন।
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-emerald-400 block mb-1">৪. Midjourney v6 Format:</strong>
                সরাসরি মিডজার্নি ডিসকর্ডে পেস্ট করার জন্য <code>--ar 16:9 --v 6.1 --style raw</code> ট্যাগ যুক্ত করে দেয়।
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full mt-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
            >
              বুঝেছি (Got it)
            </button>
          </div>
        </div>
      )}

      {/* Google Sign-In Auth Error Modal */}
      {authError && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-red-500/20 rounded-3xl max-w-lg w-full p-6 text-center relative overflow-hidden shadow-2xl"
          >
            <div className="absolute -top-10 -left-10 w-40 h-48 bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-red-400">
              <AlertCircle className="w-7 h-7" />
            </div>

            {authError === 'unauthorized_domain' ? (
              <>
                <h3 className="text-lg font-bold text-white tracking-tight">গুগল সাইন-ইন ডোমেইন ত্রুটি! (Unauthorized Domain)</h3>
                <p className="text-xs text-neutral-300 mt-2.5 leading-relaxed text-left">
                  আপনার ফায়ারবেস কনসোলে এই ডেভেলপমেন্ট ডোমেনটি অনুমোদিত তালিকায় যোগ করা নেই। সমাধান করার জন্য নিচে দেওয়া ধাপগুলো অনুসরণ করুন:
                </p>

                <div className="my-4 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-left">
                  <p className="text-[11px] font-bold text-red-400">ধাপ ১: নিচের লিঙ্কগুলো কপি করুন:</p>
                  <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5 select-all font-mono text-[10px] text-neutral-300">
                    <div>ais-dev-iz6v42th2kvc7wjz7jtcit-55654215301.asia-southeast1.run.app</div>
                    <div>ais-pre-iz6v42th2kvc7wjz7jtcit-55654215301.asia-southeast1.run.app</div>
                  </div>
                  
                  <p className="text-[11px] font-bold text-neutral-300">ধাপ ২: ফায়ারবেস কনসোলে যান:</p>
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    **Firebase Console**-এ গিয়ে **Authentication** - **Settings** - **Authorized Domains (অনুমোদিত ডোমেন)**-এ যান এবং উপরের ডোমেন দুটি যোগ (Add Domain) করুন।
                  </p>
                </div>
              </>
            ) : authError === 'popup_blocked' ? (
              <>
                <h3 className="text-lg font-bold text-white tracking-tight">পপআপ উইন্ডো ব্লক করা হয়েছে! (Popup Blocked)</h3>
                <p className="text-xs text-neutral-300 mt-2.5 leading-relaxed">
                  আপনার ব্রাউজার নতুন পপআপ উইন্ডো খোলা ব্লক করে রেখেছে। অনুগ্রহ করে ব্রাউজারের সার্চ বারের ডান কোণে ক্লিক করে পপআপ উইন্ডো খোলার অনুমতি (Allow Popups) দিন এবং আবার চেষ্টা করুন।
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white tracking-tight">গুগল সাইন-ইন করতে ব্যর্থ হয়েছে!</h3>
                <p className="text-xs text-neutral-300 mt-2.5 leading-relaxed text-left font-mono bg-black/40 p-3 rounded-xl border border-white/5 text-red-400">
                  {authError}
                </p>
              </>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setAuthError(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition-colors"
              >
                বন্ধ করুন (Close)
              </button>
              {authError === 'unauthorized_domain' && (
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Firebase Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-white/5 text-center text-[11px] text-neutral-600">
        PromptVision AI • Reverse Image Prompt Engineering for Midjourney, Flux, SDXL & DALL-E
      </footer>
    </div>
  );
};

export default App;
