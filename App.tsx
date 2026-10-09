import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  LogIn, 
  LogOut, 
  Key, 
  Zap, 
  Crown, 
  Share2, 
  RefreshCw, 
  Clock, 
  AlertCircle,
  X,
  MessageCircle
} from 'lucide-react';
import Header from './components/Header';
import ImagePreview from './components/ImagePreview';
import ResultsView from './components/ResultsView';
import ApiManagerModal from './components/ApiManagerModal';
import PremiumModal from './components/PremiumModal';
import { analyzeWithMultiApi } from './services/visionAnalyzer';
import { apiManager } from './services/apiManager';
import { loadSharedAnalysis } from './services/shareService';
import { quotaService, FREE_DAILY_LIMIT, WHATSAPP_NUMBER, WHATSAPP_LINK } from './services/quotaService';
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

  // Modals state
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Quota & Premium state
  const [isPremium, setIsPremium] = useState<boolean>(() => quotaService.isPremium());
  const [remainingUses, setRemainingUses] = useState<number>(() => quotaService.getRemainingFreeUses());

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
      }, 5000);
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

    // 1. Check daily free limit (10 times per day)
    if (!quotaService.canGenerate()) {
      setIsPremiumModalOpen(true);
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    setStatusMessage('জেমিনি ৩.৮ ফ্ল্যাশ দ্বারা ছবি বিশ্লেষণ চলছে...');

    try {
      const result = await analyzeWithMultiApi(state.image, state.imageMimeType, {
        fastMode: true,
        onStatusUpdate: (msg) => setStatusMessage(msg),
      });

      // Update quota count
      quotaService.incrementUsage();
      setRemainingUses(quotaService.getRemainingFreeUses());

      setState(prev => ({ ...prev, result, isAnalyzing: false }));
      setStatusMessage('');

      // Save to recent history
      await saveAnalysis(result, state.image);
    } catch (err: any) {
      console.error('Multi-API Analysis execution failed:', err);
      const errMsg = err?.message || 'ছবি বিশ্লেষণ ব্যর্থ হয়েছে। অনুগ্রহ করে API Key বা নেটওয়ার্ক সংযোগ যাচাই করুন।';

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errMsg,
      }));
      setStatusMessage('');
    }
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

  const handlePremiumActivated = () => {
    setIsPremium(true);
    setRemainingUses(Infinity);
  };

  return (
    <div className="min-h-screen bg-[#070510] text-neutral-100 flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-x-hidden">
      {/* Background Radial Ambient Lighting (Inspired by Screenshot 1 & 2) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-purple-900/20 via-cyan-900/10 to-transparent blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="w-full border-b border-white/[0.08] bg-[#090714]/70 backdrop-blur-xl px-4 sm:px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1">
              PromptVision <span className="text-cyan-400">AI</span>
            </span>
          </div>

          {/* Right Controls - Clean and Minimal */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Daily Usage / VIP Status Badge */}
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isPremium
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : remainingUses > 0
                  ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300 hover:border-cyan-400'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300 animate-pulse'
              }`}
            >
              {isPremium ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>PRO VIP</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>বাকি: {remainingUses}/১০ বার</span>
                </>
              )}
            </button>

            {/* API Key Modal Button */}
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              title="API Key সেটিংস"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">API Key</span>
            </button>

            {/* Premium Upgrade Button */}
            {!isPremium && (
              <button
                onClick={() => setIsPremiumModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">প্রিমিয়াম নিন</span>
                <span className="sm:hidden">VIP</span>
              </button>
            )}

            {/* History Button if exists */}
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
                title="হিস্ট্রি দেখুন"
              >
                <Clock className="w-3.5 h-3.5 text-purple-400" />
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
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] p-3.5 rounded-2xl bg-amber-950/95 border border-amber-500/40 text-amber-200 shadow-[0_10px_35px_rgba(245,158,11,0.25)] backdrop-blur-xl flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <strong className="font-bold text-white block">
                  এপিআই অটো-সুইচ: {rotationToast.toName}
                </strong>
                <span className="text-[11px] text-amber-300/80">
                  {rotationToast.fromName}-এর লিমিট শেষ হওয়ায় পরবর্তী কী-তে সুইচ করা হয়েছে।
                </span>
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

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {!state.result && (
          <Header
            onOpenApiManager={() => setIsApiModalOpen(true)}
            onOpenPremium={() => setIsPremiumModalOpen(true)}
            isPremium={isPremium}
            remainingUses={remainingUses}
          />
        )}

        {/* Upload Screen */}
        {!state.result && (
          <section className="mt-2 mb-8">
            <ImagePreview
              image={state.image}
              onUpload={handleFileUpload}
              onSelectSample={handleSelectSample}
              onRemove={handleRemove}
              isAnalyzing={state.isAnalyzing}
              onStartAnalyze={handleAnalyze}
            />

            {/* In-flight status indicator */}
            {state.isAnalyzing && statusMessage && (
              <div className="mt-3 text-center text-xs text-cyan-300 animate-pulse font-medium">
                {statusMessage}
              </div>
            )}

            {/* Error Message */}
            {state.error && (
              <div className="mt-4 flex items-center gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs max-w-lg mx-auto text-left shadow-lg">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <div className="flex-1">
                  <span className="font-semibold block">{state.error}</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button
                      onClick={() => setIsApiModalOpen(true)}
                      className="text-[11px] text-cyan-300 underline font-semibold hover:text-white cursor-pointer"
                    >
                      API Key পরিবর্তন করুন →
                    </button>
                    <button
                      onClick={() => setIsPremiumModalOpen(true)}
                      className="text-[11px] text-amber-300 underline font-semibold hover:text-white cursor-pointer"
                    >
                      প্রিমিয়াম টোকেন সক্রিয় করুন →
                    </button>
                  </div>
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
      </main>

      {/* API Key Modal */}
      <ApiManagerModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        onKeysChanged={() => {}}
      />

      {/* Premium Upgrade Modal (WhatsApp 01332756124 & Token 152643) */}
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onActivated={handlePremiumActivated}
      />

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0e0c1a] border border-white/10 rounded-3xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">পূর্বের প্রম্পট হিস্ট্রি ({history.length})</h3>
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
                  className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setState({
                      image: item.imageThumbnail || null,
                      imageMimeType: 'image/jpeg',
                      isAnalyzing: false,
                      result: item.result,
                      error: null,
                    });
                    setShowHistory(false);
                  }}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all flex items-center gap-3 group"
                >
                  {item.imageThumbnail ? (
                    <img
                      src={item.imageThumbnail}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-neutral-500" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-200 line-clamp-2 font-mono leading-relaxed">
                      {item.result.masterPrompt}
                    </p>
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ক্লিক করে দেখুন
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clean Minimal Footer */}
      <footer className="mt-auto py-5 border-t border-white/[0.06] text-center text-[11px] text-neutral-500">
        PromptVision AI • Powered by Gemini 3.8 Flash • WhatsApp: {WHATSAPP_NUMBER}
      </footer>
    </div>
  );
};

export default App;
