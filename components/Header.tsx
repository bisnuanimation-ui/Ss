import React from 'react';
import { Sparkles, Cpu, Layers } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="py-12 md:py-16 text-center relative overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-900/60 to-transparent border border-white/5 p-6 mb-8">
      {/* Background glow flares */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 left-1/4 w-64 h-64 bg-purple-600/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-3xl mx-auto flex flex-col items-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 mb-5 shadow-[0_0_25px_rgba(59,130,246,0.15)] animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] font-bold text-blue-300 tracking-widest uppercase">
            Image-to-Prompt Engineering Studio (ছবি থেকে প্রম্পট)
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4 leading-none">
          PromptVision <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-[0_0_30px_rgba(129,140,248,0.2)]">AI</span>
        </h1>

        <p className="text-neutral-400 text-xs md:text-sm max-w-xl leading-relaxed">
          যেকোনো ইমেজ বা গ্রাফিক্স আর্ট এখানে দিন — আমাদের হাই-এন্ড ভিশন ইঞ্জিন ক্যারেক্টার পোজ, লেআউট, ৩ডি পার্সপেক্টিভ এবং টাইপোগ্রাফি ফন্ট বিশ্লেষণ করে হুবহু রেপ্লিকেশন প্রম্পট তৈরি করে দেবে।
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-neutral-300 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" /> Auto-Detect API
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-neutral-300 flex items-center gap-1">
            <Layers className="w-3 h-3 text-pink-400" /> 3D Perspective Lock
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-neutral-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> High-Fidelity Prompts
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
