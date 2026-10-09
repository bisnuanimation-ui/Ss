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
  Zap,
  Share2,
  RefreshCw,
  Layers,
  Palette
} from 'lucide-react';
import Header from './components/Header';
import ImagePreview from './components/ImagePreview';
import ResultsView from './components/ResultsView';
import ApiManagerModal from './components/ApiManagerModal';
import MobileNav from './components/MobileNav';
import { analyzeWithMultiApi } from './services/visionAnalyzer';
import { apiManager } from './services/apiManager';
import { loadSharedAnalysis } from './services/shareService';
import { AppState, AnalysisResult, GraphicCustomization } from './types';
import { useFirebase } from './components/FirebaseProvider';

export const App: React.FC = () => {
  const { user, history, signIn, logout, saveAnalysis, clearHistory } = useFirebase();
  
  const [state, setState] = useState<AppState>({
    image: null,
    imageMimeType: null,
    isAnalyzing: false,
    result: null,
    error: null,
  });

  // UI state
  const [mobileTab, setMobileTab] = useState<'scanner' | 'studio' | 'history'>('scanner');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [fastMode, setFastMode] = useState(true);

  // Modifiers
  const [customAttire, setCustomAttire] = useState('');
  const [customHeadline, setCustomHeadline] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Key rotation alert toast
  const [rotationToast, setRotationToast] = useState<{
    show: boolean;
    fromName: string;
    toName: string;
    reason: string;
  } | null>(null);

  // Listen for automatic key rotation / failover
  useEffect(() => {
    const unsubscribe = apiManager.onKeyRotated(({ fromKey, toKey, reason }) => {
      setRotationToast({
        show: true,
        fromName: fromKey.name,
        toName: toKey.name,
        reason,
      });

      setTimeout(() => {
        setRotationToast(null);
      }, 6000);
    });

    return () => unsubscribe();
  }, []);

  // Check for shared link in URL on initial mount (?share=<id> or ?share_data=<payload>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    const shareData = params.get('share_data');

    if (shareId || shareData) {
      loadSharedAnalysis(shareId, shareData).then((sharedResult) => {
        if (sharedResult) {
          setState({
            image: null,
            imageMimeType: null,
            isAnalyzing: false,
            result: sharedResult,
            error: null,
          });
        }
      });
    }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setState(prev => ({ ...prev, error: 'অনুগ্রহ করে একটি সঠিক ছবির ফাইল নির্বাচন করুন (Select a valid image).' }));
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

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    setStatusMessage('ছবি বিশ্লেষণ শুরু হচ্ছে...');

    try {
      const result = await analyzeWithMultiApi(state.image, state.imageMimeType, {
        fastMode,
        customAttire: customAttire.trim() || undefined,
        customHeadline: customHeadline.trim() || undefined,
        onStatusUpdate: (msg) => setStatusMessage(msg),
      });

      setState(prev => ({ ...prev, result, isAnalyzing: false }));
      setStatusMessage('');

      // Save to recent history
      await saveAnalysis(result, state.image);
    } catch (err: any) {
      console.error('Multi-API Analysis execution failed:', err);
      const errMsg = err?.message || 'ছবি বিশ্লেষণ ব্যর্থ হয়েছে। অনুগ্রহ করে API Key যাচাই করুন।';

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errMsg,
      }));
      setStatusMessage('');
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
    setMobileTab('scanner');
  };

  const handleApplyCustomization = (customization: GraphicCustomization) => {
    if (state.result) {
      setState(prev => ({
        ...prev,
        result: prev.result ? {
          ...prev.result,
          customization,
          masterPrompt: customization.modifiedMasterPrompt || prev.result.masterPrompt,
        } : null,
      }));
    }
  };

  const isReady = !!state.image && !state.isAnalyzing;

  return (
    <div className="min-h-screen bg-[#090712] text-neutral-100 flex flex-col font-sans selection:bg-purple-600/40 pb-16 sm:pb-0">
      {/* Top Mobile Bar */}
      <MobileNav
        activeTab={mobileTab}
        onTabChange={(tab) => {
          setMobileTab(tab);
          if (tab === 'history') setShowHistory(true);
        }}
        onOpenApiManager={() => setIsApiModalOpen(true)}
        hasResult={!!state.result}
      />

      {/* Top Desktop Navbar */}
      <nav className="w-full border-b border-purple-500/15 bg-[#0d0a1a]/80 backdrop-blur-xl px-4 sm:px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                PromptVision <span className="text-purple-400">AI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30 hidden sm:inline">
                  MULTI-API ROTATION
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* API Manager Button */}
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-xs text-purple-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">API রোটেশন কী</span>
              <span className="sm:hidden">এপিআই</span>
            </button>

            <button
              onClick={() => setShowGuide(true)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-all hidden sm:flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
              <span>সহায়িকা</span>
            </button>

            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(true)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>হিস্ট্রি ({history.length})</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                {user.photoURL && (
                  <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full border border-purple-500/30" />
                )}
                <span className="text-xs text-neutral-300 hidden md:inline max-w-[90px] truncate">
                  {user.displayName}
                </span>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-xs text-purple-200 hover:text-white font-medium border border-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>লগইন</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Floating Failover Alert Toast */}
      <AnimatePresence>
        {rotationToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] p-3.5 rounded-2xl bg-amber-950/95 border border-amber-500/40 text-amber-200 shadow-[0_10px_35px_rgba(245,158,11,0.25)] backdrop-blur-xl flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <strong className="font-bold text-white block">
                  অটো-সুইচ সম্পন্ন: {rotationToast.toName}
                </strong>
                <p className="text-[11px] text-amber-300/80">
                  {rotationToast.fromName}-এর {rotationToast.reason} হওয়ায় পরবর্তী সক্রিয় কী-তে সুইচ করা হয়েছে।
                </p>
              </div>
            </div>
            <button
              onClick={() => setRotationToast(null)}
              className="text-amber-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!state.result && (
          <Header
            onOpenApiManager={() => setIsApiModalOpen(true)}
            fastMode={fastMode}
            onToggleFastMode={() => setFastMode(!fastMode)}
          />
        )}

        {/* Upload & Scanner Screen */}
        {!state.result && (
          <section className="mt-4 mb-10">
            <ImagePreview
              image={state.image}
              onUpload={handleFileUpload}
              onSelectSample={handleSelectSample}
              onRemove={handleRemove}
              isAnalyzing={state.isAnalyzing}
              onStartAnalyze={handleAnalyze}
              customAttire={customAttire}
              setCustomAttire={setCustomAttire}
              customHeadline={customHeadline}
              setCustomHeadline={setCustomHeadline}
              fastMode={fastMode}
              setFastMode={setFastMode}
            />

            {/* In-flight status indicator */}
            {state.isAnalyzing && statusMessage && (
              <div className="mt-3 text-center text-xs text-purple-300 animate-pulse font-medium">
                {statusMessage}
              </div>
            )}

            {/* Error Message */}
            {state.error && (
              <div className="mt-4 flex items-center gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs max-w-lg mx-auto text-left shadow-lg">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <div className="flex-1">
                  <span className="font-semibold block">{state.error}</span>
                  <button
                    onClick={() => setIsApiModalOpen(true)}
                    className="text-[11px] text-purple-300 underline font-semibold mt-1 block hover:text-white cursor-pointer"
                  >
                    API রোটেশন ম্যানেজারে নতুন কী যুক্ত বা পরিবর্তন করুন →
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Results Screen */}
        <AnimatePresence>
          {state.result && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-2"
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
                onApplyCustomization={handleApplyCustomization}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Usage Workflow Cards (inspired by NEXORA features) */}
        {!state.result && (
          <section className="mt-12 pt-8 border-t border-purple-500/15">
            <div className="text-center mb-8">
              <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400 block mb-1">
                Forensic Workflow
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                গ্রাফিক্স ডি-কনস্ট্রাকশন ও প্রম্পট ইঞ্জিনিয়ারিং কীভাবে কাজ করে
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-[#120f22]/70 border border-purple-500/20 rounded-3xl p-5 sm:p-6 text-center shadow-lg">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-3 font-bold text-sm shadow-inner">
                  ১
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">১. লাইটিং ও লাইট পাথ এক্সট্রাকশন</h4>
                <p className="text-xs text-purple-200/70 leading-relaxed">
                  আলো কোথা থেকে আসছে (উৎস), কোন কোণে নামছে (ভেক্টর) এবং কোথায় হাইলাইটস বা ছায়া ফেলছে তা নিখুঁতভাবে চিহ্নিত করে।
                </p>
              </div>

              <div className="bg-[#120f22]/70 border border-purple-500/20 rounded-3xl p-5 sm:p-6 text-center shadow-lg">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center mb-3 font-bold text-sm shadow-inner">
                  ২
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">২. টেক্সচার গ্রাইন্ডিং ও গ্রাফিক্স ম্যাপিং</h4>
                <p className="text-xs text-purple-200/70 leading-relaxed">
                  কোথায় বেশি গ্রাইন্ডিং, ফিল্ম গ্রেইন বা গ্রাঞ্জ আছে এবং কোথায় মসৃণ ভেক্টর ক্লিন সারফেস রয়েছে তা ম্যাপ করে হুবহু রেপ্লিকা বানায়।
                </p>
              </div>

              <div className="bg-[#120f22]/70 border border-purple-500/20 rounded-3xl p-5 sm:p-6 text-center shadow-lg">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-3 font-bold text-sm shadow-inner">
                  ৩
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">৩. অটো-ফেলওভার ও শেয়ার লিঙ্ক</h4>
                <p className="text-xs text-purple-200/70 leading-relaxed">
                  একটি এপিআই-এর লিমিট শেষ হলে সাথে সাথে পরবর্তী কী-তে অটোমেটিক সুইচ করে এবং যেকোনো ডিভাইসে দেখার জন্য শেয়ার লিঙ্ক দেয়।
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* API Rotation Manager Modal */}
      <ApiManagerModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        onKeysChanged={() => {}}
      />

      {/* History Drawer Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#100d1e] border border-purple-500/30 rounded-3xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">পূর্বের তৈরি প্রম্পট হিস্ট্রি ({history.length})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearHistory}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1"
                >
                  সব মুছুন
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
                  className="p-3.5 rounded-2xl bg-black/40 hover:bg-purple-900/20 border border-purple-500/15 hover:border-purple-500/40 cursor-pointer transition-all flex items-center gap-4 group"
                >
                  {item.imageThumbnail ? (
                    <img
                      src={item.imageThumbnail}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover border border-purple-500/20 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-purple-100 line-clamp-2 font-mono leading-relaxed">
                      {item.result.masterPrompt}
                    </p>
                    <span className="text-[10px] text-purple-300/60 mt-1 block">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ক্লিক করে ওপেন করুন
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#100d1e] border border-purple-500/30 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <span>কীভাবে ব্যবহার করবেন? (User Guide)</span>
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-purple-200/80 leading-relaxed">
              <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/15">
                <strong className="text-purple-300 block mb-1">১. মাল্টি-এপিআই অটো-রোটেশন:</strong>
                একাধিক API Key সেট করে রাখতে পারেন (Gemini, Friendli AI, OpenAI)। একটির রেট লিমিট শেষ হলে অন্যটি নিজে থেকেই কাজ করবে।
              </div>

              <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/15">
                <strong className="text-pink-300 block mb-1">২. গ্রাফিক্স ও লাইট ট্র্যাজেক্টরি:</strong>
                আলো কোথা থেকে আসছে, কোথায় পড়ছে এবং ডিজাইনের কোথায় বেশি গ্রাইন্ডিং/গ্রাঞ্জ আছে তা পুঙ্খানুপুঙ্খভাবে বের করে দেয়।
              </div>

              <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/15">
                <strong className="text-emerald-300 block mb-1">৩. শেয়ার লিঙ্ক (Share Link):</strong>
                যেকোনো প্রম্পটের ওপর "শেয়ার লিঙ্ক" বাটনে ক্লিক করে সরাসরি মোবাইল বা বন্ধুদের শেয়ার করতে পারেন।
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-5 border-t border-purple-500/15 text-center text-[11px] text-purple-300/50">
        PromptVision AI • Forensic Image & Graphic Prompt Engineering Engine
      </footer>
    </div>
  );
};

export default App;
