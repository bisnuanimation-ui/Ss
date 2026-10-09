import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, 
  Check, 
  Sparkles, 
  Sliders, 
  RefreshCw, 
  Layers, 
  Camera, 
  Sun, 
  Palette, 
  User, 
  ShieldAlert, 
  Tag, 
  Download,
  Building2,
  Compass,
  CheckCircle2,
  Share2,
  Wand2,
  Cpu,
  ArrowRight,
  FileText,
  FileDown,
  Loader2
} from 'lucide-react';
import { AnalysisResult, GraphicCustomization } from '../types';
import GraphicDeconstructionCard from './GraphicDeconstructionCard';
import ShareModal from './ShareModal';
import { exportAnalysisToPdf } from '../services/pdfExportService';

interface ResultsViewProps {
  result: AnalysisResult;
  onReset: () => void;
  imageUrl?: string | null;
  onApplyCustomization?: (customization: GraphicCustomization) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ 
  result, 
  onReset, 
  imageUrl,
  onApplyCustomization 
}) => {
  const [activeTab, setActiveTab] = useState<'master' | 'forensic' | 'midjourney' | 'swap' | 'style' | 'short'>('master');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  
  // Custom camera angle and realistic background modifiers
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('');
  const [selectedRealismBoost, setSelectedRealismBoost] = useState<string>('authentic real-world environment, real architectural textures, natural ambient daylight');

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      setPdfError(null);
      await exportAnalysisToPdf({
        result,
        imageUrl,
        activePrompt: getActivePrompt(),
        aspectRatio
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      setPdfError('পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const getActivePrompt = (): string => {
    let base = '';
    switch (activeTab) {
      case 'master':
        base = result.masterPrompt;
        break;
      case 'midjourney':
        base = `${result.masterPrompt} --ar ${aspectRatio} --v 6.1 --style raw --stylize 180`;
        break;
      case 'swap':
        base = result.subjectSwapPrompt;
        break;
      case 'style':
        base = result.styleTransferPrompt;
        break;
      case 'short':
        base = result.shortPrompt;
        break;
      default:
        base = result.masterPrompt;
    }

    const additions: string[] = [];
    if (selectedCameraAngle) {
      additions.push(selectedCameraAngle);
    }
    if (selectedRealismBoost) {
      additions.push(selectedRealismBoost);
    }

    if (additions.length > 0) {
      return `${base}, ${additions.join(', ')}`;
    }
    return base;
  };

  const downloadPromptTxt = () => {
    const fullText = `=== PROMPTVISION AI: REVERSE PROMPT REPORT ===
Generated on: ${new Date().toLocaleString()}
Provider Used: ${result.usedProvider || 'Multi-API Engine'}

[MASTER PROMPT (WITH OPTICS, LIGHT PATH & REAL-WORLD BACKGROUND)]
${getActivePrompt()}

[MIDJOURNEY V6.1 PROMPT]
${result.midjourneyPrompt}

[SHORT FAST PROMPT]
${result.shortPrompt}

[SUBJECT SWAP TEMPLATE]
${result.subjectSwapPrompt}

[STYLE TRANSFER PROMPT]
${result.styleTransferPrompt}

[LIGHT ORIGIN & TRAJECTORY]
Origin: ${result.lightTrajectory?.origin || 'Natural / Studio light'}
Path: ${result.lightTrajectory?.path || 'Direct path'}
Impact Zones: ${result.lightTrajectory?.impact || 'Subject highlights & drop shadow'}

[TEXTURE & GRINDING MAP]
Heavy Grinding: ${result.graphicDesign?.textureGrinding?.heavyGrindingZones || 'N/A'}
Smooth Zones: ${result.graphicDesign?.textureGrinding?.smoothZones || 'N/A'}
Texture Type: ${result.graphicDesign?.textureGrinding?.textureType || 'N/A'}

[NEGATIVE PROMPT (ANTI-CGI)]
${result.negativePrompt}

--- OPTICAL & ENVIRONMENTAL BREAKDOWN ---
Camera Angle & Optics: ${result.cameraAndComposition}
Subject & Attire: ${result.subjectAndAttire}
Lighting & Atmosphere: ${result.lightingAndAtmosphere}
Art Style: ${result.artStyle}
Color Palette: ${result.colorPalette.join(', ')} (${result.colorDescription})
Tags: ${result.suggestedTags.join(', ')}
`;

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PromptVision-AI-Report-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Top Bar with Provider Info, Share & Reset */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#120f24] border border-purple-500/20 shadow-md">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>প্রম্পট তৈরি সম্পন্ন</span>
          </div>

          {result.usedProvider && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/25 text-purple-200 text-xs">
              <Cpu className="w-3 h-3 text-purple-400" />
              <span>{result.usedProvider}</span>
              {result.generationDurationMs && (
                <span className="text-emerald-400 font-mono text-[11px]">⚡ {result.generationDurationMs}ms</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* PDF Export Button (Clean formatted PDF Document download) */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-60"
            title="সম্পূর্ণ রিপোর্ট ও প্রম্পট পিডিএফ ফাইলে ডাউনলোড করুন"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>পিডিএফ হচ্ছে...</span>
              </>
            ) : pdfSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>পিডিএফ ডাউনলোড সম্পন্ন!</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>পিডিএফ ডাউনলোড (PDF)</span>
              </>
            )}
          </button>

          {/* Share Button (User requested: "একটা তুমি শেয়ার লিঙ্ক দিবা") */}
          <button
            onClick={() => setIsShareOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>শেয়ার লিঙ্ক</span>
          </button>

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>নতুন ছবি</span>
          </button>
        </div>
      </div>

      {/* Main Prompt Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-b from-[#16122d]/95 to-[#0e0b1c]/95 border border-purple-500/30 rounded-3xl p-5 sm:p-8 backdrop-blur-2xl shadow-[0_15px_50px_rgba(139,92,246,0.18)] overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Feature Badges inspired by NEXORA card */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>১০০% বাস্তবসম্মত ব্যাকগ্রাউন্ড (Real-World DNA)</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Camera className="w-3.5 h-3.5" />
            <span>ডিএসএলআর ক্যামেরা ও লেন্স স্পেক্স</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-pink-500/15 text-pink-300 border border-pink-500/30">
            <Sun className="w-3.5 h-3.5" />
            <span>আলোর উৎস ও গতিপথ (Light Trajectory)</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-purple-500/20">
          {[
            { id: 'master', label: '🌟 মাস্টার প্রম্পট (Exact Replica)' },
            { id: 'forensic', label: '🔬 ফরেনসিক গ্রাফিক্স ও লাইট DNA' },
            { id: 'midjourney', label: '🎨 মিডজার্নি v6.1' },
            { id: 'short', label: '⚡ শর্ট প্রম্পট (Fast)' },
            { id: 'swap', label: '👥 ক্যারেক্টার সোয়াপ' },
            { id: 'style', label: '🪄 স্টাইল ট্রান্সফার' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-black/30 text-purple-200/80 hover:bg-black/50 hover:text-white border border-purple-500/15'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Midjourney Aspect Ratio Selector */}
        {activeTab === 'midjourney' && (
          <div className="mb-4 p-3 rounded-2xl bg-black/40 border border-purple-500/20 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-purple-200 font-semibold">অ্যাসপেক্ট রেশিও (Aspect Ratio):</span>
            <div className="flex items-center gap-1.5">
              {(['16:9', '9:16', '1:1', '4:5'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    aspectRatio === ratio
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  --ar {ratio}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Prompt Box or Forensic View */}
        {activeTab === 'forensic' ? (
          <GraphicDeconstructionCard
            result={result}
            onApplyCustomization={onApplyCustomization}
          />
        ) : (
          <div className="relative group">
            <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-purple-500/30 font-mono text-xs sm:text-sm text-purple-100/90 leading-relaxed max-h-[360px] overflow-y-auto selection:bg-purple-600 shadow-inner">
              {getActivePrompt()}
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2 mt-4">
              <span className="text-[11px] text-purple-300/70">
                এই প্রম্পটটি Midjourney, Flux.1, SDXL বা DALL-E 3 তে সরাসরি পেস্ট করুন
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => copyText(getActivePrompt(), 'active-prompt')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  {copiedKey === 'active-prompt' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'active-prompt' ? 'কপি সম্পন্ন!' : '১-ক্লিকে কপি করুন'}</span>
                </button>

                {/* PDF Download Button right in prompt actions */}
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="পিডিএফ ফরম্যাটে সম্পূর্ণ বিশ্লেষণ রিপোর্ট ডাউনলোড করুন"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>{isExportingPdf ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}</span>
                </button>

                <button
                  onClick={downloadPromptTxt}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="টেক্সট ফাইল ডাউনলোড করুন (.txt)"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Forensic Graphic DNA Accordion if not currently in forensic tab */}
      {activeTab !== 'forensic' && (
        <GraphicDeconstructionCard
          result={result}
          onApplyCustomization={onApplyCustomization}
        />
      )}

      {/* Optical & Photography Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Camera and Optics */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#120f22] border border-purple-500/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
            <Camera className="w-4 h-4 text-purple-400" />
            <span>ক্যামেরা অপটিক্স ও কম্পোজিশন (DSLR Gear):</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {result.cameraAndComposition}
          </p>
        </div>

        {/* Character, Attire & Interaction */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#120f22] border border-purple-500/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-pink-300">
            <User className="w-4 h-4 text-pink-400" />
            <span>চরিত্রের ভঙ্গিমা ও পোশাকের বিবরণ (Subject & Attire):</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {result.subjectAndAttire}
          </p>
        </div>
      </div>

      {/* Color Palette & Atmosphere */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#120f22] border border-purple-500/20 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
            <Palette className="w-4 h-4 text-pink-400" />
            <span>কালার প্যালেট ও কালার গ্রেডিং (Color DNA):</span>
          </div>
          <span className="text-[11px] text-purple-300/70">{result.colorDescription}</span>
        </div>

        {/* Palette Hex Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {result.colorPalette.map((color, i) => (
            <button
              key={i}
              onClick={() => copyText(color, `hex-${i}`)}
              className="p-2.5 rounded-2xl bg-black/40 border border-purple-500/20 flex items-center gap-2.5 hover:border-purple-400 transition-all cursor-pointer group"
            >
              <div 
                className="w-7 h-7 rounded-xl shadow-inner border border-white/20 shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="text-left">
                <span className="font-mono text-xs font-bold text-white block group-hover:text-purple-300">
                  {color}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {copiedKey === `hex-${i}` ? 'কপি!' : 'কপি করুন'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Negative Prompt & Suggested Tags */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#120f22] border border-purple-500/20 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>নেগেটিভ প্রম্পট (Anti-CGI / Anti-Slop Filter):</span>
          </div>
          <button
            onClick={() => copyText(result.negativePrompt, 'neg')}
            className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
          >
            {copiedKey === 'neg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>কপি নেগেটিভ</span>
          </button>
        </div>
        <p className="text-xs text-neutral-400 font-mono bg-black/40 p-3 rounded-xl border border-white/5">
          {result.negativePrompt}
        </p>

        {/* Tags */}
        <div className="pt-2 flex flex-wrap gap-1.5">
          {result.suggestedTags.map((tag, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-lg text-xs bg-purple-950/40 text-purple-300 border border-purple-500/20 font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Export & Download Center (User request: clean formatted PDF document download) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#171330] via-[#131026] to-[#120e24] border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <FileText className="w-3.5 h-3.5" />
              <span>পিডিএফ ডকুমেন্ট এক্সপোর্ট সেন্টার (Export Ready)</span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>সম্পূর্ণ এআই প্রম্পট ও ফরেনসিক অ্যানালিসিস রিপোর্ট</span>
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              আপলোডকৃত ছবির সম্পূর্ণ রিভার্স-ইঞ্জিনিয়ারিং স্পেসিফিকেশন, মাস্টার প্রম্পট, মিডজার্নি ভেরিয়েন্ট, আলোর গতিপথ (Light Trajectory), টেক্সচার গ্রাইন্ডিং ও কালার প্যালেট একটি চমৎকার A4 পিডিএফ ডকুমেন্টে ডাউনলোড করুন।
            </p>

            <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-emerald-300/90 font-medium">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20">✓ মূল ছবির প্রিভিউ ও কালার হেক্স</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20">✓ DSLR লেন্স ও ৩x৩ গ্রিড</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20">✓ ৪টি প্রম্পট ভেরিয়েন্ট</span>
            </div>

            {pdfError && (
              <p className="text-xs text-rose-400 font-semibold pt-1">
                {pdfError}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0 w-full md:w-auto">
            {/* Primary PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-60"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>পিডিএফ প্রস্তুত হচ্ছে...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-5 h-5 text-white" />
                  <span>ডাউনলোড সফল হয়েছে!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5 text-emerald-200" />
                  <span>ক্লিন PDF ডাউনলোড (.pdf)</span>
                </>
              )}
            </button>

            {/* Plain TXT File Button */}
            <button
              onClick={downloadPromptTxt}
              className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>টেক্সট ফাইল (.txt)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        result={result}
        imageUrl={imageUrl}
      />
    </div>
  );
};

export default ResultsView;
