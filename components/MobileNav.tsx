import React from 'react';
import { 
  Scan, 
  Key, 
  Palette, 
  History, 
  Share2, 
  Zap,
  ShieldCheck
} from 'lucide-react';
import { apiManager } from '../services/apiManager';

interface MobileNavProps {
  activeTab: 'scanner' | 'studio' | 'history';
  onTabChange: (tab: 'scanner' | 'studio' | 'history') => void;
  onOpenApiManager: () => void;
  hasResult: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  onOpenApiManager,
  hasResult,
}) => {
  const activeKey = apiManager.getActiveKey();

  return (
    <>
      {/* Top Mobile Pill Bar */}
      <div className="w-full px-4 py-2 flex items-center justify-between text-xs bg-[#0b0a12]/90 backdrop-blur-xl border-b border-purple-500/15 sticky top-0 z-30">
        <div 
          onClick={onOpenApiManager}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/40 border border-purple-500/30 hover:border-purple-400 cursor-pointer transition-all shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-purple-200 text-[11px] truncate max-w-[170px] sm:max-w-none">
            {activeKey?.name || 'API Key নির্বাচন করুন'}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
            {activeKey?.provider.toUpperCase() || 'GEMINI'}
          </span>
        </div>

        <button
          onClick={onOpenApiManager}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[11px] font-semibold transition-all cursor-pointer"
        >
          <Key className="w-3 h-3 text-purple-400" />
          <span>রোটেশন কী</span>
        </button>
      </div>

      {/* Bottom Floating Mobile Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0b16]/95 backdrop-blur-2xl border-t border-purple-500/20 px-3 py-2 sm:hidden safe-area-pb">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          <button
            onClick={() => onTabChange('scanner')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'scanner'
                ? 'text-white bg-purple-600/30 font-bold'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Scan className="w-4 h-4 mb-0.5 text-purple-400" />
            <span className="text-[10px]">স্ক্যানার</span>
          </button>

          <button
            onClick={() => {
              if (hasResult) {
                onTabChange('studio');
              } else {
                onTabChange('scanner');
              }
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'studio'
                ? 'text-white bg-purple-600/30 font-bold'
                : hasResult
                ? 'text-purple-300/70 hover:text-white'
                : 'text-neutral-500 opacity-60'
            }`}
          >
            <Palette className="w-4 h-4 mb-0.5 text-pink-400" />
            <span className="text-[10px]">গ্রাফিক্স</span>
          </button>

          <button
            onClick={onOpenApiManager}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl text-purple-300/70 hover:text-white transition-all cursor-pointer"
          >
            <Key className="w-4 h-4 mb-0.5 text-amber-400" />
            <span className="text-[10px]">এপিআই ({apiManager.getKeys().filter(k => k.key).length})</span>
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'text-white bg-purple-600/30 font-bold'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 mb-0.5 text-indigo-400" />
            <span className="text-[10px]">হিস্ট্রি</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileNav;
