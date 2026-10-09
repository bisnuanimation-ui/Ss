import React, { useRef, useState, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  X, 
  Wand2, 
  ArrowRight,
  Zap
} from 'lucide-react';

interface ImagePreviewProps {
  image: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectSample: (base64OrUrl: string, mimeType: string) => void;
  onRemove: () => void;
  isAnalyzing: boolean;
  onStartAnalyze: () => void;
}

const SAMPLE_IMAGES = [
  {
    title: 'Cyberpunk Neon',
    titleBn: 'সাইবারপাংক নিয়ন গ্রাফিক্স',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
  },
  {
    title: 'Streetwear Graphic',
    titleBn: 'স্ট্রিটওয়্যার পোস্টার ও আর্ট',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
  },
  {
    title: 'Cinematic Portrait',
    titleBn: 'সিনেমাটিক পোর্ট্রেট',
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
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="w-full max-w-2xl mx-auto mb-6">
      {/* Dropzone Container - Clean Glassmorphism */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !image && !isAnalyzing && fileInputRef.current?.click()}
        className={`relative rounded-3xl border transition-all duration-300 overflow-hidden ${
          image
            ? 'border-cyan-500/30 bg-[#0d0a1b]/90 shadow-[0_10px_40px_rgba(6,182,212,0.12)] p-4 sm:p-5'
            : isDragging
            ? 'border-cyan-400 bg-cyan-600/10 scale-[1.01]'
            : 'border-white/10 bg-[#0c0a17]/60 hover:border-cyan-500/30 hover:bg-[#110d22]/80 cursor-pointer p-8 sm:p-12 shadow-2xl backdrop-blur-xl'
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
          <div className="flex flex-col items-center">
            {/* Image Preview Window */}
            <div className="relative max-h-[380px] w-full rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center border border-white/10">
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
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/80 hover:bg-rose-600 text-white backdrop-blur-md transition-all shadow-lg border border-white/10 cursor-pointer"
                  title="ছবি সরান"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Change button bar */}
            <div className="flex items-center justify-between w-full mt-3 px-1 text-xs text-purple-300/80">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                ছবি লোড সম্পন্ন হয়েছে
              </span>
              {!isAnalyzing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-cyan-400 hover:text-cyan-300 underline font-semibold transition-colors cursor-pointer"
                >
                  অন্য ছবি দিন
                </button>
              )}
            </div>

            {/* Launch Big Analyze Button */}
            <div className="w-full mt-4">
              <button
                type="button"
                onClick={onStartAnalyze}
                disabled={isAnalyzing}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 shadow-[0_10px_35px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>জেমিনি ৩.৮ ফ্ল্যাশ প্রম্পট তৈরি করছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-cyan-200" />
                    <span>প্রম্পট তৈরি করুন (Generate AI Prompt)</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(6,182,212,0.2)]">
              <Upload className="w-7 h-7" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white mb-2">
              ছবি আপলোড করুন (Upload Image)
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed mb-4">
              যেকোনো ছবি এখানে ড্র্যাগ করে ছাড়ুন অথবা ক্লিক করে বেছে নিন (Ctrl+V দিয়ে পেস্ট করতে পারেন)।
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>JPG, PNG, WebP সমর্থিত</span>
            </div>
          </div>
        )}
      </div>

      {/* Preset Demo Samples */}
      {!image && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-neutral-500 flex items-center gap-1">
            <Wand2 className="w-3.5 h-3.5 text-neutral-400" /> স্যাম্পল ট্রাই করুন:
          </span>
          {SAMPLE_IMAGES.map((sample, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSampleClick(sample.url, sample.mimeType)}
              className="px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm"
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
