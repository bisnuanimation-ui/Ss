import React from 'react';
import { Sparkles, Crown, Key, Zap } from 'lucide-react';
import { apiManager } from '../services/apiManager';

interface HeaderProps {
  onOpenApiManager?: () => void;
  onOpenPremium?: () => void;
  isPremium?: boolean;
  remainingUses?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenApiManager,
  onOpenPremium,
  isPremium = false,
  remainingUses = 10,
}) => {
  const activeKey = apiManager.getActiveKey();

  return (
    <header className="relative pt-6 pb-4 px-4 text-center overflow-hidden">
      {/* Celestial Glowing Neon Arch (Inspired by NEONE Screenshot) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[680px] sm:w-[920px] h-[240px] pointer-events-none">
        {/* Curved glowing neon horizon arch */}
        <div className="w-full h-full rounded-t-[100%] border-t-[2.5px] border-cyan-400/80 shadow-[0_-10px_45px_rgba(34,211,238,0.5),0_-2px_15px_rgba(168,85,247,0.8)] opacity-90" />
        {/* Radial ambient glow below the arch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-cyan-500/25 via-purple-600/20 to-transparent blur-[70px]" />
      </div>

      <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10 pt-2">
        {/* Top Badges */}
        <div className="flex items-center gap-2 flex-wrap justify-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold text-cyan-200 tracking-wider uppercase">
              Early Access • Gemini 3.8 Flash
            </span>
          </div>

          {/* Daily Limit / VIP status */}
          <button
            onClick={onOpenPremium}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
              isPremium
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-purple-900/30 border-purple-500/30 text-purple-200 hover:border-purple-400'
            }`}
          >
            {isPremium ? (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>PRO VIP (আনলিমিটেড • অ্যাড-মুক্ত)</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>ফ্রি লিমিট: {remainingUses}/১০ বার</span>
                <span className="text-[10px] text-amber-300 ml-0.5 underline">আপগ্রেড</span>
              </>
            )}
          </button>

          {/* API Key button */}
          {onOpenApiManager && (
            <button
              onClick={onOpenApiManager}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-black/40 hover:bg-purple-950/40 text-[11px] font-semibold text-purple-200 transition-all cursor-pointer"
            >
              <Key className="w-3 h-3 text-amber-400" />
              <span>{activeKey?.name || 'API Key'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </button>
          )}
        </div>

        {/* Main Title inspired by NEONE: clean, bold, atmospheric */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-2xl">
          Build Faster With <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-200 to-purple-400">
            Reverse Visual Prompts
          </span>
        </h1>

        <p className="text-purple-200/70 text-xs sm:text-sm max-w-lg leading-relaxed mt-2.5">
          যেকোনো গ্রাফিক্স বা ছবি আপলোড করুন — AI আলোর উৎস, কোণ ও টেক্সচার গ্রাইন্ডিং ডিকোড করে হুবহু মাস্টার প্রম্পট তৈরি করে দেবে।
        </p>
      </div>
    </header>
  );
};

export default Header;
