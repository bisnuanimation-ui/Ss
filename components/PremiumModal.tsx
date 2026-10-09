import React, { useState } from 'react';
import { 
  Crown, 
  Check, 
  MessageCircle, 
  X, 
  Sparkles, 
  Key, 
  ShieldCheck, 
  Zap, 
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { quotaService, WHATSAPP_NUMBER, WHATSAPP_LINK } from '../services/quotaService';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  onActivated,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    const res = quotaService.redeemToken(tokenInput);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        onActivated();
        onClose();
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-[#0e0c1a] border border-purple-500/30 rounded-3xl shadow-[0_15px_50px_rgba(139,92,246,0.3)] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Ambient Top Halo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-purple-500/20 blur-[90px] pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-6 text-center border-b border-purple-500/20 bg-gradient-to-b from-purple-950/40 to-transparent">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-600/30 mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-[#120f24] rounded-2xl flex items-center justify-center">
              <Crown className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            PromptVision <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-300 to-indigo-300">PRO VIP</span>
          </h3>
          <p className="text-xs sm:text-sm text-purple-200/70 mt-1 max-w-sm mx-auto">
            দৈনিক ১০ বারের ফ্রি লিমিট শেষ? আনলিমিটেড ব্যবহার ও অ্যাড-ফ্রি এক্সপেরিয়েন্স পেতে প্রিমিয়াম সক্রিয় করুন।
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Benefits list (Forma AI style cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/15 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-neutral-200">আনলিমিটেড ডেইলি ইউজ (No Limit)</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/15 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-neutral-200">১০০% নো-অ্যাড (Zero Ads)</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/15 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-neutral-200">জেমিনি ৩.৮ ফ্ল্যাশ সুপারফাস্ট স্পিড</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/15 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-neutral-200">লাইফটাইম ভিআইপি অ্যাক্সেস</span>
            </div>
          </div>

          {/* WhatsApp Direct Contact Button */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-2">
            <span className="text-xs text-emerald-300 font-bold block">
              টোকেন কোড পেতে সরাসরি হোয়াটসঅ্যাপে মেসেজ দিন:
            </span>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp এ যোগাযোগ করুন ({WHATSAPP_NUMBER})</span>
            </a>
            <span className="text-[11px] text-emerald-200/60 block">
              নম্বর: <strong className="text-emerald-300 font-mono">{WHATSAPP_NUMBER}</strong> (ক্লিক করলেই সরাসরি চ্যাট খুলবে)
            </span>
          </div>

          {/* Token Redemption Input Form */}
          <form onSubmit={handleRedeem} className="space-y-3 pt-2 border-t border-purple-500/15">
            <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                অ্যাক্টিভেশন টোকেন কোড থাকলে এখানে দিন:
              </span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="যেমন: 152643"
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-purple-500/30 text-white text-xs font-mono tracking-wider focus:outline-none focus:border-purple-400 placeholder:text-neutral-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer"
              >
                অ্যাক্টিভ করুন
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
