import React, { useState } from 'react';
import { Crown, Sparkles, ExternalLink, X, Shield, Info } from 'lucide-react';

interface AdBannerProps {
  isPremium: boolean;
  onUpgradeClick: () => void;
  placement?: 'top' | 'inline' | 'bottom';
}

const AD_ITEMS = [
  {
    title: 'RunPod Serverless GPU',
    tagline: 'Run FLUX.1 & Stable Diffusion with ultra-low latency.',
    cta: 'Learn More',
    badge: 'SPONSORED',
    link: 'https://runpod.io',
  },
  {
    title: 'Midjourney v6.1 Masterclass',
    tagline: 'Learn prompt engineering secrets and photorealistic lighting.',
    cta: 'Explore Course',
    badge: 'ADVERTISEMENT',
    link: 'https://midjourney.com',
  },
  {
    title: 'Vectorizer.AI Studio',
    tagline: 'Convert bitmap images and graphic sketches into clean SVG vectors.',
    cta: 'Try Free',
    badge: 'FEATURED AD',
    link: 'https://vectorizer.ai',
  },
];

export const AdBanner: React.FC<AdBannerProps> = ({
  isPremium,
  onUpgradeClick,
  placement = 'inline',
}) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // If user is Premium, ALL ADS ARE COMPLETELY BLOCKED AND HIDDEN
  if (isPremium) {
    return null;
  }

  const ad = AD_ITEMS[currentAdIndex % AD_ITEMS.length];

  if (placement === 'top') {
    return (
      <aside aria-label="Advertisement" className="w-full max-w-5xl mx-auto my-3 px-3">
        <div className="p-2.5 sm:p-3 rounded-2xl bg-[#110d22]/90 border border-purple-500/20 shadow-md flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-neutral-400 border border-white/10">
              {ad.badge}
            </span>
            <span className="font-bold text-white text-xs truncate max-w-[200px] sm:max-w-none">
              {ad.title}
            </span>
            <span className="text-neutral-400 text-xs hidden md:inline">
              — {ad.tagline}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={ad.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-semibold border border-purple-500/30 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>{ad.cta}</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={onUpgradeClick}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer hover:opacity-90"
              title="বিজ্ঞাপন বন্ধ করতে প্রিমিয়াম নিন"
            >
              <Crown className="w-3 h-3 text-amber-200" />
              <span className="hidden sm:inline">অ্যাড বন্ধ করুন (PRO)</span>
              <span className="sm:hidden">অ্যাড বন্ধ</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Inline Card Ad (Between panels or under results)
  return (
    <aside aria-label="Advertisement" className="w-full max-w-2xl mx-auto my-6 px-3">
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#140f28]/80 via-[#100d20]/80 to-[#0c0918]/80 border border-purple-500/25 shadow-[0_10px_35px_rgba(139,92,246,0.12)] relative overflow-hidden backdrop-blur-xl">
        {/* Subtle Ambient glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none" />

        <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-500/15 text-[10px] text-neutral-400">
          <span className="font-mono tracking-wider font-semibold uppercase flex items-center gap-1">
            <Info className="w-3 h-3 text-purple-400" />
            {ad.badge} • ফ্রি ইউজার স্পন্সর
          </span>
          <button
            onClick={onUpgradeClick}
            className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Crown className="w-3 h-3 text-amber-400" />
            <span>অ্যাড সরাতে প্রিমিয়াম কোড ব্যবহার করুন</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap pt-1">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm sm:text-base font-bold text-white mb-1 truncate">
              {ad.title}
            </h4>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {ad.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={ad.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-xs font-bold border border-purple-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{ad.cta}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onUpgradeClick}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>PRO আনলক</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdBanner;
