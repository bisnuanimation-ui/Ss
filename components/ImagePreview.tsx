import React, { useRef, useState, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  X, 
  Wand2, 
  Zap, 
  Type, 
  Scissors, 
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ImagePreviewProps {
  image: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectSample: (base64OrUrl: string, mimeType: string) => void;
  onRemove: () => void;
  isAnalyzing: boolean;
  onStartAnalyze: () => void;
  customAttire: string;
  setCustomAttire: (val: string) => void;
  customHeadline: string;
  setCustomHeadline: (val: string) => void;
  fastMode: boolean;
  setFastMode: (val: boolean) => void;
}

const SAMPLE_IMAGES = [
  {
    title: 'NEXORA Streetwear',
    titleBn: 'স্ট্রিটওয়্যার পোস্টার ও অ্যাপারেল',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
  },
  {
    title: 'Cyberpunk Graphic',
    titleBn: 'সাইবারপাংক নিয়ন গ্রাফিক্স',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
  },
  {
    title: 'Cinematic Editorial',
    titleBn: 'সিনেমাটিক হাই-ফ্যাশন পোর্ট্রেট',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
  },
];

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  image,
  onUpload,
  onSelectSample,
  onRemove,
  isAnalyzing,
  onStartAnalyze,
  customAttire,
  setCustomAttire,
  customHeadline,
  setCustomHeadline,
  fastMode,
  setFastMode,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Allow pasting an image from clipboard anywhere on page
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isAnalyzing) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              onSelectSample(base64, blob.type);
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isAnalyzing, onSelectSample]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAnalyzing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isAnalyzing) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          onSelectSample(base64, file.type);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSampleClick = async (sampleUrl: string, mimeType: string) => {
    try {
      const response = await fetch(sampleUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onSelectSample(base64, mimeType);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      {/* Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !image && !isAnalyzing && fileInputRef.current?.click()}
        className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
          image
            ? 'border-purple-500/40 bg-[#120f22]/90 shadow-[0_10px_40px_rgba(139,92,246,0.18)] p-4 sm:p-5'
            : isDragging
            ? 'border-purple-400 bg-purple-600/15 scale-[1.01]'
            : 'border-purple-500/25 bg-[#100d1e]/50 hover:border-purple-400/50 hover:bg-[#151128]/70 cursor-pointer p-6 sm:p-10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onUpload}
          className="hidden"
          disabled={isAnalyzing}
        />

        {image ? (
          <div className="relative group flex flex-col items-center">
            {/* Image Preview Window */}
            <div className="relative max-h-[380px] w-full rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center border border-purple-500/20">
              <img
                src={image}
                alt="Source preview"
                className="max-h-[380px] w-auto max-w-full object-contain rounded-xl"
              />
              {!isAnalyzing && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-rose-600 text-white backdrop-blur-md transition-all shadow-lg border border-white/10 cursor-pointer"
                  title="ছবি সরান"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Change button bar */}
            <div className="flex items-center justify-between w-full mt-3 px-1 text-xs text-purple-300/80">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ছবি লোড সম্পন্ন হয়েছে (Image Ready)
              </span>
              {!isAnalyzing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-purple-300 hover:text-white underline font-semibold transition-colors cursor-pointer"
                >
                  অন্য ছবি বেছে নিন
                </button>
              )}
            </div>

            {/* Micro Customization Inputs before Analysis */}
            <div className="w-full mt-4 p-3.5 rounded-2xl bg-black/40 border border-purple-500/20 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-purple-400" />
                  ঐচ্ছিক কাস্টম পোশাক ও গ্রাফিক্স টেক্সট (Optional Modifiers):
                </span>
                
                {/* Fast Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setFastMode(!fastMode)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                    fastMode
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-purple-900/30 border-purple-500/30 text-purple-300'
                  }`}
                >
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>{fastMode ? 'সুপারফাস্ট মোড অন' : 'ডিপ স্টুডিও মোড'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="text"
                    value={customAttire}
                    onChange={(e) => setCustomAttire(e.target.value)}
                    placeholder="পছন্দের পোশাক (যেমন: oversized graphic tee & cargo pants)"
                    disabled={isAnalyzing}
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-white text-xs focus:outline-none focus:border-purple-400 placeholder:text-neutral-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={customHeadline}
                    onChange={(e) => setCustomHeadline(e.target.value)}
                    placeholder="কাস্টম টেক্সট/ব্র্যান্ড নাম (যেমন: NEXORA Streetwear)"
                    disabled={isAnalyzing}
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-white text-xs focus:outline-none focus:border-purple-400 placeholder:text-neutral-500"
                  />
                </div>
              </div>
            </div>

            {/* Launch Big Analyze Button */}
            <div className="w-full mt-4">
              <button
                type="button"
                onClick={onStartAnalyze}
                disabled={isAnalyzing}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_35px_rgba(139,92,246,0.35)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI বিশ্লেষণ চলছে (অটো-ফেলওভার সক্রিয়)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-purple-200" />
                    <span>হুবহু গ্রাফিক্স ও প্রম্পট তৈরি করুন (Generate Master Prompt)</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <Upload className="w-7 h-7" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white mb-2">
              ছবি বা গ্রাফিক ডিজাইন আপলোড করুন (Upload Image)
            </h3>
            <p className="text-xs sm:text-sm text-purple-200/70 max-w-md leading-relaxed mb-4">
              যেকোনো গ্রাফিক্স বা ছবি এখানে ড্র্যাগ করুন অথবা ক্লিক করে নির্বাচন করুন। পেস্ট (Ctrl+V) করতে পারেন।
              <br />
              <span className="text-purple-300/50 text-[11px] block mt-1">
                AI আলোর পথ, টেক্সচার গ্রাইন্ডিং ও ক্যামেরা কোণ বিশ্লেষণ করে হুবহু মাস্টার প্রম্পট তৈরি করবে।
              </span>
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-purple-200">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>JPG, PNG, WebP সমর্থিত</span>
            </div>
          </div>
        )}
      </div>

      {/* Preset Demo Samples */}
      {!image && (
        <div className="mt-4 pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="text-xs text-purple-300/60 flex items-center gap-1">
            <Wand2 className="w-3.5 h-3.5 text-purple-400" /> স্যাম্পল ট্রাই করুন:
          </span>
          {SAMPLE_IMAGES.map((sample, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSampleClick(sample.url, sample.mimeType)}
              className="px-3 py-1.5 rounded-xl text-xs bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/20 text-purple-200 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <img src={sample.url} alt="" className="w-4 h-4 rounded-md object-cover" />
              <span>{sample.titleBn}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
