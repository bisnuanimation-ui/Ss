import React from 'react';
import { Sparkles, Zap, Shield, Key, Sparkle, RefreshCw } from 'lucide-react';
import { apiManager } from '../services/apiManager';

interface HeaderProps {
  onOpenApiManager?: () => void;
  fastMode?: boolean;
  onToggleFastMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenApiManager,
  fastMode = true,
  onToggleFastMode,
}) => {
  const activeKey = apiManager.getActiveKey();

  return (
    <header className="py-6 px-4 text-center border-b border-purple-500/20 bg-gradient-to-b from-[#140f28]/90 via-[#0e0a1b]/80 to-[#08060f]/90 backdrop-blur-2xl sticky top-0 z-40">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* Top Badges in Style of NEXORA */}
        <div className="flex items-center gap-2 flex-wrap justify-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-semibold text-purple-200 tracking-wider uppercase">
              Graphic & Streetwear DNA Deconstruction
            </span>
          </div>

          {onToggleFastMode && (
            <button
              onClick={onToggleFastMode}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-semibold transition-all cursor-pointer ${
                fastMode
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'border-purple-500/30 bg-purple-900/30 text-purple-300'
              }`}
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>{fastMode ? '🚀 সুপারফাস্ট মোড সক্রিয়' : '🔬 ডিপ স্টুডিও মোড'}</span>
            </button>
          )}

          {onOpenApiManager && (
            <button
              onClick={onOpenApiManager}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/50 text-[11px] font-semibold text-purple-200 transition-all cursor-pointer"
            >
              <Key className="w-3 h-3 text-amber-400" />
              <span>{activeKey?.name || 'এপিআই রোটেশন'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </button>
          )}
        </div>

        {/* Main Title inspired by NEXORA design: "Define Your STYLE", "Own Your WORLD" */}
        <div className="flex flex-col items-center justify-center my-1">
          <div className="text-[12px] font-black uppercase tracking-[0.3em] text-purple-300/80 mb-0.5">
            NEXORA VISION STUDIO
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Define Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300">STYLE</span>, Own Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-400">WORLD</span>
          </h1>
        </div>

        <p className="text-purple-200/70 text-xs sm:text-sm max-w-xl leading-relaxed mt-1.5">
          যেকোনো গ্রাফিক্স বা ছবি দিন — AI আলোর গতিপথ, টেক্সচার গ্রাইন্ডিং ও নিখুঁত ক্যামেরা অ্যাঙ্গেল বের করে দিয়ে হুবহু প্রম্পট তৈরি করবে।
        </p>
      </div>
    </header>
  );
};

export default Header;
