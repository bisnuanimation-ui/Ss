import React from 'react';
import { Sparkles, Wand2, Image as ImageIcon } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="py-8 px-6 text-center border-b border-white/[0.08] bg-black/40 backdrop-blur-2xl sticky top-0 z-40">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-semibold text-blue-300 tracking-wider uppercase">
            AI Image-to-Prompt Generator (ছবি থেকে প্রম্পট)
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
          PromptVision <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">AI</span>
        </h1>

        <p className="text-neutral-400 text-xs md:text-sm max-w-xl leading-relaxed">
          যেকোনো ছবি আপলোড করুন — AI সাথে সাথে এর শৈলী, আলো, চরিত্র ও ক্যামেরার সম্পূর্ণ প্রম্পট বের করে দেবে যেন আপনি Midjourney, Flux বা অন্য যেকোনো জায়গায় একই ধরণের ছবি তৈরি করতে পারেন।
        </p>
      </div>
    </header>
  );
};

export default Header;
