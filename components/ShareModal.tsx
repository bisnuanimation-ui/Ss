import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Sparkles, 
  Globe, 
  Smartphone,
  QrCode,
  Send,
  FileDown,
  Loader2
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { generateShareLink } from '../services/shareService';
import { exportAnalysisToPdf } from '../services/pdfExportService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult;
  imageUrl?: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  result,
  imageUrl,
}) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(true);
      generateShareLink(result, imageUrl)
        .then(({ shareUrl }) => {
          setShareUrl(shareUrl);
          setIsGenerating(false);
        })
        .catch(() => {
          setShareUrl(window.location.href);
          setIsGenerating(false);
        });
    }
  }, [isOpen, result, imageUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PromptVision AI: Master Image Prompt & Graphic DNA',
          text: `দেখুন এই ছবির রিভার্স-ইঞ্জিনিয়ারিং প্রম্পট ও গ্রাফিক্স ডিএনএ:\n"${result.shortPrompt.slice(0, 120)}..."`,
          url: shareUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      await exportAnalysisToPdf({
        result,
        imageUrl,
        activePrompt: result.masterPrompt,
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export PDF from modal:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-[#0f0d19] border border-purple-500/30 rounded-3xl shadow-[0_10px_40px_rgba(139,92,246,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                শেয়ার লিঙ্ক (Shareable Link)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold uppercase">
                  লাইভ লিঙ্ক
                </span>
              </h3>
              <p className="text-xs text-purple-300/70">
                এই লিঙ্কটি যেকোনো ডিভাইস বা মোবাইলে ওপেন করলে হুবহু প্রম্পটটি দেখা যাবে
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

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Link box */}
          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1.5">
              সরাসরি শেয়ার লিঙ্ক (Direct URL):
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-purple-500/30 text-xs font-mono text-purple-200 truncate select-all">
                {isGenerating ? 'লিঙ্ক তৈরি করা হচ্ছে...' : shareUrl}
              </div>
              <button
                onClick={handleCopy}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                {copied ? 'কপি হয়েছে!' : 'কপি লিঙ্ক'}
              </button>
            </div>
          </div>

          {/* Action Buttons: Native Share + PDF Download */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleNativeShare}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>মোবাইলে শেয়ার করুন (WhatsApp / Telegram / Messenger)</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>পিডিএফ তৈরি হচ্ছে...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>পিডিএফ ডাউনলোড সম্পন্ন!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-400" />
                  <span>ক্লিন PDF ডকুমেন্ট ডাউনলোড করুন (.pdf)</span>
                </>
              )}
            </button>

            {shareSuccess && (
              <p className="text-center text-xs text-emerald-400 mt-1.5">
                সফলভাবে শেয়ার করা হয়েছে!
              </p>
            )}
          </div>

          {/* Preview Card */}
          <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>লিঙ্কে যা যা দেখতে পাবে:</span>
            </div>
            <p className="text-xs text-neutral-300 line-clamp-3 font-mono bg-black/40 p-2 rounded-xl">
              "{result.masterPrompt}"
            </p>
            <div className="flex items-center gap-2 text-[11px] text-purple-300/80 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">✓ আলো ও লাইট পাথ</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">✓ টেক্সচার ও গ্রাইন্ডিং</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">✓ ক্যামেরা অ্যাঙ্গেল</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-purple-950/40 border-t border-purple-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
