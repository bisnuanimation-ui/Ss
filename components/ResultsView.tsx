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
  Video
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface ResultsViewProps {
  result: AnalysisResult;
  onReset: () => void;
  imageUrl?: string | null;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ result, onReset, imageUrl }) => {
  const [activeTab, setActiveTab] = useState<'master' | 'midjourney' | 'swap' | 'style' | 'short'>('master');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
  
  // Custom camera angle and realistic background modifiers
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('');
  const [selectedRealismBoost, setSelectedRealismBoost] = useState<string>('authentic real-world environment, real architectural textures, natural ambient daylight');

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getActivePrompt = (): string => {
    let base = '';
    switch (activeTab) {
      case 'master':
        base = result.masterPrompt;
        break;
      case 'midjourney':
        base = `${result.masterPrompt} --ar ${aspectRatio} --v 6.1 --style raw`;
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

[MASTER PROMPT (WITH OPTICS & REAL-WORLD BACKGROUND)]
${getActivePrompt()}

[MIDJOURNEY PROMPT]
${result.midjourneyPrompt}

[SUBJECT SWAP TEMPLATE (Use with other subjects)]
${result.subjectSwapPrompt}

[STYLE TRANSFER PROMPT (Use with other scenes)]
${result.styleTransferPrompt}

[SHORT PROMPT]
${result.shortPrompt}

[NEGATIVE PROMPT (ANTI-CGI)]
${result.negativePrompt}

--- OPTICAL & ENVIRONMENTAL BREAKDOWN ---
Camera Angle & Optics: ${result.cameraAndComposition}
Subject & Attire: ${result.subjectAndAttire}
Lighting & Atmosphere: ${result.lightingAndAtmosphere}
Art Style & Medium: ${result.artStyle}
Color Palette: ${result.colorPalette.join(', ')} (${result.colorDescription})
Tags: ${result.suggestedTags.join(', ')}
`;

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PromptVision-AI-Prompt-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10">
      {/* Top Banner / Master Prompt Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-b from-neutral-900/90 to-neutral-950/95 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Realism & Camera Quality Badges */}
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Real-World Background (নো ফেক/CGI লুক)</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Camera className="w-3.5 h-3.5" />
            <span>নিখুঁত ক্যামেরা অ্যাঙ্গেল ও লেন্স স্পেসিফিকেশন</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Building2 className="w-3.5 h-3.5" />
            <span>Physical Architectural Realism</span>
          </div>
        </div>

        {/* Header & Main Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span>Generated Image Prompt</span>
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 mt-1">
              যেকোনো AI ইমেজ জেনারেটরে হুবহু একই কোয়ালিটি, বাস্তবসম্মত ব্যাকগ্রাউন্ড এবং নিখুঁত ক্যামেরা অ্যাঙ্গেল দিয়ে ছবি তৈরি করুন।
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => copyText(getActivePrompt(), 'main-prompt')}
              className="px-5 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 bg-white text-black hover:bg-neutral-200"
            >
              {copiedKey === 'main-prompt' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied! (কপি হয়েছে)</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Master Prompt</span>
                </>
              )}
            </button>

            <button
              onClick={downloadPromptTxt}
              title="Download Prompt Report as .txt"
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onReset}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Analyze New Image"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prompt Variant Selector Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveTab('master')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'master'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            🔥 Master Prompt (Universal)
          </button>
          <button
            onClick={() => setActiveTab('swap')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'swap'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            🔄 Subject Swap (অন্য চরিত্র/বিষয়ে ব্যবহার)
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'style'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            🎨 Style Transfer (আর্ট স্টাইল রিইউজ)
          </button>
          <button
            onClick={() => setActiveTab('midjourney')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'midjourney'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20'
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            ⚡ Midjourney v6 Format
          </button>
          <button
            onClick={() => setActiveTab('short')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'short'
                ? 'bg-neutral-700 text-white shadow-lg'
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            📝 Short Prompt
          </button>
        </div>

        {/* Tab Description Tip */}
        <div className="text-xs text-neutral-400 mb-3 flex items-center gap-1.5">
          {activeTab === 'swap' && (
            <span className="text-purple-300 font-medium">
              💡 Tip: Replace <code>[Insert Subject / Character Here]</code> with your desired character or object to recreate this scene!
            </span>
          )}
          {activeTab === 'style' && (
            <span className="text-indigo-300 font-medium">
              💡 Tip: Combine this style prompt with any other prompt to apply this image's exact lighting, camera, and art mood!
            </span>
          )}
          {activeTab === 'midjourney' && (
            <span className="text-sky-300 font-medium">
              💡 Formatted with Midjourney flags: <code>--ar {aspectRatio} --v 6.1 --style raw</code>
            </span>
          )}
          {activeTab === 'master' && (
            <span className="text-neutral-400 font-medium">
              💡 Complete detailed prompt with precise camera optics and authentic physical environment.
            </span>
          )}
        </div>

        {/* Prompt Output Box */}
        <div className="relative group">
          <div className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 md:p-6 text-neutral-200 font-mono text-sm leading-relaxed tracking-normal select-all overflow-x-auto min-h-[140px]">
            {getActivePrompt()}
          </div>
          <button
            onClick={() => copyText(getActivePrompt(), 'prompt-box')}
            className="absolute top-3 right-3 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all backdrop-blur-md opacity-80 group-hover:opacity-100"
            title="Copy this prompt"
          >
            {copiedKey === 'prompt-box' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Camera Angle & Background Realism Control Bars */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-4">
          {/* Camera Angle Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mr-2">
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Camera Angle (ক্যামেরা অ্যাঙ্গেল):</span>
            </span>
            {[
              { label: 'Low-Angle Hero (নিচু কোণ)', val: 'dramatic low-angle hero shot, upward perspective, grounded elevation' },
              { label: 'Eye-Level 85mm Portrait (আই-লেভেল)', val: 'eye-level medium close-up, 85mm prime lens f/1.4, shallow depth of field' },
              { label: 'Wide 24mm Cinematic (ওয়াইড)', val: '24mm cinematic wide-angle lens, environmental framing, golden ratio composition' },
              { label: 'Dutch Angle Tilt (ডাচ টিল্ট)', val: 'dutch angle tilt, dynamic tension framing, 35mm anamorphic' },
              { label: 'High-Angle Look-Down (উপরের কোণ)', val: 'high-angle perspective, elevated viewpoint looking slightly downward' },
            ].map((cam) => (
              <button
                key={cam.label}
                onClick={() =>
                  setSelectedCameraAngle(prev => (prev === cam.val ? '' : cam.val))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedCameraAngle === cam.val
                    ? 'bg-blue-500/25 text-blue-300 border border-blue-500/50 shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-white/5 hover:bg-white/10'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>

          {/* Background Realism Booster */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mr-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Realism Boost (বাস্তবসম্মত ব্যাকগ্রাউন্ড):</span>
            </span>
            {[
              { label: '✓ Real Architecture (খাঁটি পরিবেশ)', val: 'authentic real-world environment, real architectural textures, natural ambient daylight' },
              { label: '+ Physical Textures (দেয়াল/মেঝের টেক্সচার)', val: 'tactile physical textures, real plaster, weathered wood grain, authentic brickwork' },
              { label: '+ Natural Daylight Bounce (প্রাকৃতিক আলো)', val: 'natural sunlight bounces, atmospheric dust motes, soft ambient shadows, no plastic sheen' },
              { label: '+ Anti-CGI Guard (নো থ্রিডি লুক)', val: 'photorealistic documentary aesthetic, zero 3d render look, raw camera sensor fidelity' },
            ].map((boost) => (
              <button
                key={boost.label}
                onClick={() =>
                  setSelectedRealismBoost(prev => (prev === boost.val ? '' : boost.val))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedRealismBoost === boost.val
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-white/5 hover:bg-white/10'
                }`}
              >
                {boost.label}
              </button>
            ))}
          </div>

          {/* Aspect Ratio */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-neutral-400">Aspect Ratio:</span>
            {(['16:9', '9:16', '1:1', '4:5'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  aspectRatio === ratio
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-transparent'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Suggested Tags & Keywords */}
      {result.suggestedTags && result.suggestedTags.length > 0 && (
        <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 mr-2">
            <Tag className="w-3.5 h-3.5 text-blue-400" />
            <span>Keyword Tags:</span>
          </div>
          {result.suggestedTags.map((tag, idx) => (
            <button
              key={idx}
              onClick={() => copyText(tag, `tag-${idx}`)}
              className="px-3 py-1 rounded-full text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 group"
              title="Click to copy tag"
            >
              <span>{tag}</span>
              {copiedKey === `tag-${idx}` ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 opacity-40 group-hover:opacity-100" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Detailed Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Camera & Composition (Highlighted) */}
        <div className="bg-neutral-900/80 border border-blue-500/20 rounded-2xl p-5 hover:border-blue-500/40 transition-all flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Camera className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Camera Angle & Optics (নিখুঁত ক্যামেরা)
              </h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-mono">
              {result.cameraAndComposition}
            </p>
          </div>
          <button
            onClick={() => copyText(result.cameraAndComposition, 'card-camera')}
            className="mt-4 text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1.5 self-start transition-colors"
          >
            {copiedKey === 'card-camera' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Camera Specs</span>
          </button>
        </div>

        {/* Lighting & Real-World Atmosphere */}
        <div className="bg-neutral-900/80 border border-emerald-500/20 rounded-2xl p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sun className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Lighting & Atmosphere (বাস্তব আলো ও পরিবেশ)
              </h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {result.lightingAndAtmosphere}
            </p>
          </div>
          <button
            onClick={() => copyText(result.lightingAndAtmosphere, 'card-lighting')}
            className="mt-4 text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 self-start transition-colors"
          >
            {copiedKey === 'card-lighting' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Lighting</span>
          </button>
        </div>

        {/* Subject & Attire */}
        <div className="bg-neutral-900/70 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Subject & Attire (পোশাক ও ভঙ্গি)
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {result.subjectAndAttire}
            </p>
          </div>
          <button
            onClick={() => copyText(result.subjectAndAttire, 'card-attire')}
            className="mt-4 text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1.5 self-start transition-colors"
          >
            {copiedKey === 'card-attire' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Subject Details</span>
          </button>
        </div>

        {/* Art Style & Medium */}
        <div className="bg-neutral-900/70 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Art Style & Medium (আর্ট মিডিয়াম)
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {result.artStyle}
            </p>
          </div>
          <button
            onClick={() => copyText(result.artStyle, 'card-style')}
            className="mt-4 text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1.5 self-start transition-colors"
          >
            {copiedKey === 'card-style' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Art Style</span>
          </button>
        </div>

        {/* Color Palette */}
        <div className="bg-neutral-900/70 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Palette className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Color Palette (রঙের প্যালেট)
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed mb-3">
              {result.colorDescription}
            </p>
            {result.colorPalette && result.colorPalette.length > 0 && (
              <div className="flex items-center gap-2">
                {result.colorPalette.map((hex, i) => (
                  <button
                    key={i}
                    onClick={() => copyText(hex, `hex-${i}`)}
                    className="group relative flex-1 h-9 rounded-lg border border-white/20 transition-transform hover:scale-105"
                    style={{ backgroundColor: hex }}
                    title={`Click to copy ${hex}`}
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 text-[10px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none whitespace-nowrap">
                      {hex}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => copyText(result.colorPalette.join(', '), 'card-palette')}
            className="mt-4 text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 self-start transition-colors"
          >
            {copiedKey === 'card-palette' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Hex Codes</span>
          </button>
        </div>

        {/* Negative Prompt (Anti-CGI) */}
        <div className="bg-neutral-900/70 border border-red-500/20 rounded-2xl p-5 hover:border-red-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-300">
                Anti-CGI Negative Prompt (যা পরিহার করবেন)
              </h3>
            </div>
            <p className="text-xs text-neutral-400 font-mono leading-relaxed">
              {result.negativePrompt}
            </p>
          </div>
          <button
            onClick={() => copyText(result.negativePrompt, 'card-neg')}
            className="mt-4 text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1.5 self-start transition-colors"
          >
            {copiedKey === 'card-neg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Negative Prompt</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
