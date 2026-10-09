import React, { useState } from 'react';
import { 
  Sparkles, 
  Sun, 
  Layers, 
  Compass, 
  Type, 
  Palette, 
  Sliders, 
  Copy, 
  Check, 
  Wand2, 
  ArrowRight,
  Maximize2,
  RefreshCw,
  Cpu,
  Scissors
} from 'lucide-react';
import { AnalysisResult, GraphicCustomization } from '../types';

interface GraphicDeconstructionCardProps {
  result: AnalysisResult;
  onApplyCustomization?: (customization: GraphicCustomization) => void;
  isRegenerating?: boolean;
}

export const GraphicDeconstructionCard: React.FC<GraphicDeconstructionCardProps> = ({
  result,
  onApplyCustomization,
  isRegenerating = false,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Customization studio state
  const [customHeadline, setCustomHeadline] = useState(result.customization?.customHeadline || '');
  const [customPalette, setCustomPalette] = useState(result.customization?.customPalette || 'Modern Lilac & Violet (বর্তমান থিম)');
  const [customAttire, setCustomAttire] = useState(result.customization?.customAttire || '');
  const [customGrinding, setCustomGrinding] = useState<'none' | 'subtle' | 'heavy' | 'vintage'>('subtle');
  const [modifiedPrompt, setModifiedPrompt] = useState<string>(
    result.customization?.modifiedMasterPrompt || result.masterPrompt
  );

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUpdateCustomPrompt = () => {
    let updated = result.masterPrompt;

    const modifications: string[] = [];
    if (customHeadline) {
      modifications.push(`featuring bold typography headline reading "${customHeadline}"`);
    }
    if (customPalette && customPalette !== 'Default') {
      modifications.push(`graded in ${customPalette} color harmony`);
    }
    if (customAttire) {
      modifications.push(`characters styled in ${customAttire}`);
    }
    if (customGrinding === 'heavy' || customGrinding === 'vintage') {
      modifications.push('heavy vintage screenprint grinding textures, distressed halftone grain and subtle grunge wear');
    } else if (customGrinding === 'none') {
      modifications.push('clean ultra-crisp polished graphic vectors and sleek modern finish without grunge grinding');
    }

    if (modifications.length > 0) {
      updated = `${updated}, customized with: ${modifications.join(', ')}`;
    }

    setModifiedPrompt(updated);

    onApplyCustomization?.({
      customHeadline,
      customPalette,
      customAttire,
      customGrinding,
      modifiedMasterPrompt: updated,
    });
  };

  const light = result.lightTrajectory || {
    origin: 'ওভারহেড স্টুডিও সফটবক্স ও রিয়ার রিম লাইট (Overhead softbox & rear rim spotlight)',
    path: 'ডাউনওয়ার্ড ডায়াগনাল ভেক্টর এবং লেন্সের দিকে ব্যাকলাইট হ্যালো (Downward diagonal vector & backlight rim)',
    impact: 'চেহারা ও পোশাকে সফট হাইলাইটস, ব্যাকগ্রাউন্ডে সূক্ষ্ম গভীর ছায়া (Soft highlights on subject, deep environmental drop shadows)',
  };

  const graphic = result.graphicDesign || {
    isGraphicDesign: true,
    elementOrigin: 'স্ট্রিটওয়্যার পোস্টার লেআউট, বোল্ড টাইপোগ্রাফি কার্ড, ভেক্টর গ্রাফিক ব্যাজ (Streetwear typography badges & vector chips)',
    textureGrinding: {
      heavyGrindingZones: 'পোস্টারের টেক্সট টাইটেল, ব্যাকগ্রাউন্ড ড্রপশ্যাডো এবং পোশাকের প্রিন্ট অংশে বিশেষ গ্রাইন্ডিং ও গ্রাঞ্জ (Heavy distressing & grain grinding on typography & shadow planes)',
      smoothZones: 'মডেলের ফেসিয়াল স্কিন টোন এবং ক্লিন ভেক্টর কার্ড সারফেস (Smooth clean subject skin & crisp badge containers)',
      textureType: '35mm ফিল্ম গ্রেইন এবং ভিন্টেজ স্ক্রিনপ্রিন্ট গ্রাইন্ডিং (Vintage screenprint & film noise)',
    },
    typographyStyle: 'বোল্ড কনডেন্সড সান্স-সেরিফ ও রাউন্ডেড পিল ব্যাজেস ("NEXORA - Define Your STYLE" নান্দনিকতা)',
    gridPlacement: '৩x৩ কিপ্যাড ডায়াল অনুযায়ী সেন্টারে মডেল এবং টপ ও বটমে গ্রাফিক্স ও টেক্সট কন্টেইনার',
  };

  return (
    <div className="space-y-4">
      {/* 1. Forensic Graphic DNA Cards */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#110e1d] border border-purple-500/25 shadow-[0_10px_35px_rgba(139,92,246,0.12)]">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-500/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                গ্রাফিক্স ও লাইটিং ডি-কনস্ট্রাকশন (Forensic DNA)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold uppercase">
                  হুবহু প্রসেস
                </span>
              </h3>
              <p className="text-[11px] text-purple-300/70">
                কোথা থেকে আলো আসছে, কোথা থেকে উপাদান তৈরি হয়েছে ও কোথায় গ্রাইন্ডিং করা হয়েছে
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Light Origin & Trajectory */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/15 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>আলো কোথা থেকে আসছে ও কোথায় পড়ছে (Light Vector)</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/10">
                <span className="text-purple-300 font-semibold block text-[11px]">১. আলোর উৎস (Origin):</span>
                <p className="text-neutral-300 leading-relaxed">{light.origin}</p>
              </div>

              <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/10">
                <span className="text-purple-300 font-semibold block text-[11px]">২. আলোর গতিপথ ও কোণ (Path & Vector):</span>
                <p className="text-neutral-300 leading-relaxed">{light.path}</p>
              </div>

              <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/10">
                <span className="text-purple-300 font-semibold block text-[11px]">৩. হাইলাইট ও ছায়ার জায়গা (Impact Zones):</span>
                <p className="text-neutral-300 leading-relaxed">{light.impact}</p>
              </div>
            </div>
          </div>

          {/* Texture & Grinding Breakdown */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/15 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-300">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span>টেক্সচার ও গ্রাইন্ডিং অ্যানালাইসিস (Texture & Grinding)</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded-xl bg-pink-950/20 border border-pink-500/10">
                <span className="text-pink-300 font-semibold block text-[11px]">১. বেশি গ্রাইন্ডিংয়ের জায়গা (Heavy Grinding Zones):</span>
                <p className="text-neutral-300 leading-relaxed">{graphic.textureGrinding?.heavyGrindingZones}</p>
              </div>

              <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/10">
                <span className="text-purple-300 font-semibold block text-[11px]">২. ক্লিন ও মসৃণ জায়গা (Clean Smooth Zones):</span>
                <p className="text-neutral-300 leading-relaxed">{graphic.textureGrinding?.smoothZones}</p>
              </div>

              <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/10">
                <span className="text-purple-300 font-semibold block text-[11px]">৩. গ্রাইন্ডিং ও গ্রেইনের ধরন (Texture Category):</span>
                <p className="text-neutral-300 leading-relaxed">{graphic.textureGrinding?.textureType}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3x3 Keypad and Typography */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5 pt-3.5 border-t border-purple-500/15">
          <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/10 text-xs">
            <span className="text-purple-300 font-bold block mb-1 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-purple-400" />
              টাইপোগ্রাফি ও উপাদানসমূহ (Typography & Elements):
            </span>
            <p className="text-neutral-300 leading-relaxed">{graphic.typographyStyle}</p>
            <p className="text-[11px] text-purple-300/70 mt-1">{graphic.elementOrigin}</p>
          </div>

          <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/10 text-xs">
            <span className="text-purple-300 font-bold block mb-1 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              ৩x৩ কিপ্যাড গ্রিড প্লেসমেন্ট (Keypad Composition):
            </span>
            <p className="text-neutral-300 leading-relaxed">{graphic.gridPlacement}</p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Graphic Customizer Studio */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#16122a] via-[#100d1e] to-[#0c0915] border border-purple-500/30 shadow-[0_10px_40px_rgba(139,92,246,0.18)]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                গ্রাফিক ডিজাইন পরিবর্তন স্টুডিও (Design Customizer)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold uppercase">
                  লাইভ এডিটর
                </span>
              </h3>
              <p className="text-[11px] text-purple-300/70">
                এই ডিজাইনের টেক্সট, কালার, পোশাক বা গ্রাইন্ডিং পরিবর্তন করে নতুন প্রম্পট তৈরি করুন
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Custom Text/Headline */}
          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1 flex items-center gap-1">
              <Type className="w-3 h-3 text-purple-400" />
              কাস্টম টেক্সট / ব্র্যান্ড হেডলাইন পরিবর্তন করুন:
            </label>
            <input
              type="text"
              value={customHeadline}
              onChange={(e) => setCustomHeadline(e.target.value)}
              placeholder="যেমন: VORTEX - Urban Future"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-500/25 text-white text-xs focus:outline-none focus:border-purple-400 placeholder:text-neutral-500"
            />
          </div>

          {/* Custom Color Palette */}
          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1 flex items-center gap-1">
              <Palette className="w-3 h-3 text-pink-400" />
              কালার প্যালেট ও থিম পরিবর্তন:
            </label>
            <select
              value={customPalette}
              onChange={(e) => setCustomPalette(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-500/25 text-white text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              <option value="Modern Lilac & Violet (বর্তমান থিম)">Modern Lilac & Lavender (বর্তমান পার্পল)</option>
              <option value="Cyberpunk Neon Cyan & Electric Purple">Cyberpunk Neon Cyan & Magenta</option>
              <option value="Vintage 90s Retro Warm Sepia & Goldenrod">Vintage 90s Retro Sepia & Amber</option>
              <option value="Monochrome Minimalist Black & White">Monochrome High-Contrast Black & White</option>
              <option value="Emerald Green & Champagne Gold Luxury">Emerald Green & Champagne Gold Luxury</option>
            </select>
          </div>

          {/* Custom Attire */}
          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1 flex items-center gap-1">
              <Scissors className="w-3 h-3 text-indigo-400" />
              পোশাক পরিবর্তন (Custom Clothing):
            </label>
            <input
              type="text"
              value={customAttire}
              onChange={(e) => setCustomAttire(e.target.value)}
              placeholder="যেমন: oversized lavender hoodie with graffiti art"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-500/25 text-white text-xs focus:outline-none focus:border-purple-400 placeholder:text-neutral-500"
            />
          </div>

          {/* Grinding Intensity */}
          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" />
              গ্রাইন্ডিং ও টেক্সচারের তীব্রতা (Grinding Level):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['none', 'subtle', 'heavy'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCustomGrinding(lvl)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    customGrinding === lvl
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                      : 'bg-black/30 text-purple-300 border-purple-500/20 hover:border-purple-500/40'
                  }`}
                >
                  {lvl === 'none' ? 'ক্লিন (Clean)' : lvl === 'subtle' ? 'সাবটল (Subtle)' : 'হেভি গ্রাঞ্জ (Heavy)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] text-purple-300/70">
            পরিবর্তনগুলো মূল ক্যামেরা অ্যাঙ্গেল ও লাইট পাথ অক্ষুণ্ণ রেখে প্রয়োগ হবে
          </span>
          <button
            onClick={handleUpdateCustomPrompt}
            disabled={isRegenerating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            মডিফাইড প্রম্পট রি-ক্যালকুলেট করুন
          </button>
        </div>

        {/* Modified Prompt Display */}
        <div className="mt-4 p-3.5 rounded-2xl bg-black/60 border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              পরিবর্তিত নতুন মাস্টার প্রম্পট (Modified Prompt):
            </span>
            <button
              onClick={() => copyToClipboard(modifiedPrompt, 'modified')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-semibold border border-purple-500/30 cursor-pointer"
            >
              {copiedKey === 'modified' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedKey === 'modified' ? 'কপি হয়েছে!' : 'কপি করুন'}
            </button>
          </div>
          <p className="text-xs text-neutral-300 font-mono leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5 selection:bg-purple-600">
            {modifiedPrompt}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GraphicDeconstructionCard;
