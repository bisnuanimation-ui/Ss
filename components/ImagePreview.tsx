import React, { useRef, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sparkles, X, Wand2 } from 'lucide-react';

interface ImagePreviewProps {
  image: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectSample: (base64OrUrl: string, mimeType: string) => void;
  onRemove: () => void;
  isAnalyzing: boolean;
}

const SAMPLE_IMAGES = [
  {
    title: '3D Graphic Render',
    titleBn: '🎨 গ্রাফিক ডিজাইন রেন্ডার',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg'
  },
  {
    title: 'Cyberpunk Neon',
    titleBn: 'সাইবারপাংক নিয়ন',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg'
  },
  {
    title: 'Cinematic Portrait',
    titleBn: 'সিনেমাটিক পোর্ট্রেট',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg'
  },
  {
    title: 'Surreal Fantasy',
    titleBn: 'ফ্যান্টাসি আর্ট',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg'
  }
];

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  image,
  onUpload,
  onSelectSample,
  onRemove,
  isAnalyzing,
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
    <div className="w-full max-w-3xl mx-auto mb-10">
      {/* Container / Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !image && !isAnalyzing && fileInputRef.current?.click()}
        className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
          image
            ? 'border-white/20 bg-neutral-950/80 shadow-2xl p-4'
            : isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : 'border-white/10 bg-neutral-900/40 hover:border-white/25 hover:bg-neutral-900/70 cursor-pointer p-8 md:p-12'
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
            <div className="relative max-h-[420px] w-full rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center">
              <img
                src={image}
                alt="Source preview"
                className="max-h-[420px] w-auto max-w-full object-contain rounded-xl"
              />
              {!isAnalyzing && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-black/70 hover:bg-red-600 text-white backdrop-blur-md transition-all shadow-lg"
                  title="Remove image / ছবি সরান"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-between w-full mt-3 px-2 text-xs text-neutral-400">
              <span>✓ Image loaded (ছবি লোড হয়েছে)</span>
              {!isAnalyzing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-400 hover:text-blue-300 underline font-medium"
                >
                  Change Image (অন্য ছবি দিন)
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <Upload className="w-7 h-7" />
            </div>

            <h3 className="text-lg md:text-xl font-bold text-white mb-2">
              ছবি আপলোড করুন (Upload or Drop Image)
            </h3>
            <p className="text-xs md:text-sm text-neutral-400 max-w-md leading-relaxed mb-4">
              যেকোনো ছবি এখানে ড্র্যাগ করে ছাড়ুন অথবা ক্লিক করে বেছে নিন। পেস্ট করতে পারেন (Ctrl+V)।
              <br />
              <span className="text-neutral-500 text-xs">
                AI ছবিটি বিশ্লেষণ করে নিখুঁত প্রম্পট তৈরি করে দেবে যা দিয়ে অন্য ছবি জেনারেট করতে পারবেন।
              </span>
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span>JPG, PNG, WebP supported</span>
            </div>
          </div>
        )}
      </div>

      {/* Demo Sample Images */}
      {!image && (
        <div className="mt-4 pt-3 flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs text-neutral-500 flex items-center gap-1">
            <Wand2 className="w-3.5 h-3.5 text-neutral-400" /> অথবা ট্রাই করুন (Or try sample):
          </span>
          {SAMPLE_IMAGES.map((sample, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSampleClick(sample.url, sample.mimeType)}
              className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center gap-2"
            >
              <img src={sample.url} alt="" className="w-4 h-4 rounded object-cover" />
              <span>{sample.titleBn} ({sample.title})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
