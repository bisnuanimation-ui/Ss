import React, { useState, useCallback } from 'react';
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
  ArrowRight
} from 'lucide-react';
import Header from './components/Header';
import ImagePreview from './components/ImagePreview';
import ResultsView from './components/ResultsView';
import { analyzeImage } from './services/geminiService';
import { AppState, AnalysisResult } from './types';
import { useFirebase } from './components/FirebaseProvider';

const App: React.FC = () => {
  const { user, history, signIn, logout, saveAnalysis, clearHistory } = useFirebase();
  const [state, setState] = useState<AppState>({
    image: null,
    imageMimeType: null,
    isAnalyzing: false,
    result: null,
    error: null,
  });

  const [showHistory, setShowHistory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const result = await analyzeImage(state.image, state.imageMimeType);
      setState(prev => ({ ...prev, result, isAnalyzing: false }));

      // Save to recent history
      await saveAnalysis(result, state.image);
    } catch (err: any) {
      console.error("Analysis execution failed:", err);
      let errorMessage = 'ছবি বিশ্লেষণ ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন (Analysis failed. Please try again).';

      if (err.message?.includes('QUOTA_EXCEEDED') || err.message?.includes('RESOURCE_EXHAUSTED') || err.status === 429) {
        errorMessage = 'কোটা শেষ হয়েছে (Quota Exceeded): অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।';
      } else if (err.message?.includes('API_KEY_INVALID')) {
        errorMessage = 'API Key ত্রুটি: Gemini API সংযোগ যাচাই করুন।';
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
                <span className="text-xs text-neutral-300 hidden sm:inline max-w-[100px] truncate">
                  {user.displayName}
                </span>
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
                    <span>ছবি বিশ্লেষণ হচ্ছে... (Extracting Prompts)</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>প্রম্পট তৈরি করুন (Generate AI Prompt)</span>
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

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-white/5 text-center text-[11px] text-neutral-600">
        PromptVision AI • Reverse Image Prompt Engineering for Midjourney, Flux, SDXL & DALL-E
      </footer>
    </div>
  );
};

export default App;
