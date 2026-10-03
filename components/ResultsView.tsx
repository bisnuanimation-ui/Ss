import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, 
  Check, 
  Sparkles, 
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
  CheckCircle2,
  Accessibility,
  PenTool,
  Type,
  Maximize2,
  Box,
  Compass
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface ResultsViewProps {
  result: AnalysisResult;
  onReset: () => void;
  imageUrl?: string | null;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ result, onReset, imageUrl }) => {
  const [activeTab, setActiveTab] = useState<'master' | 'graphic' | 'perspective' | 'fonts' | 'pose' | 'swap' | 'style' | 'midjourney' | 'short'>(
    result.isGraphicDesign ? 'graphic' : 'master'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
  
  // Custom modifiers
  const [selectedGraphicBoost, setSelectedGraphicBoost] = useState<string>('');
  const [selectedPerspectiveBoost, setSelectedPerspectiveBoost] = useState<string>('');
  const [selectedFontBoost, setSelectedFontBoost] = useState<string>('');
  const [selectedPoseLock, setSelectedPoseLock] = useState<string>('');

  useEffect(() => {
    if (result.isGraphicDesign) {
      setActiveTab('graphic');
      setSelectedGraphicBoost('3D Octane render, modern graphic design layout, floating vector elements, crisp typography');
      setSelectedPerspectiveBoost('deep three-point forced perspective, character breaking out of frame, layered depth planes');
    } else {
      setActiveTab('master');
      setSelectedPerspectiveBoost('ground-level upward perspective, natural vanishing lines, expansive depth');
    }
  }, [result]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getActivePrompt = (): string => {
    let base = '';
    switch (activeTab) {
      case 'graphic':
        base = result.graphicDesignPrompt || result.masterPrompt;
        break;
      case 'master':
        base = result.masterPrompt;
        break;
      case 'perspective':
        base = `Dramatic low-angle ground perspective, ${result.spatialPerspective}, ${result.masterPrompt}`;
        break;
      case 'fonts':
        base = `Graphic poster design featuring typography styles: ${result.identifiedFonts}, ${result.graphicDesignDetails}, ${result.masterPrompt}`;
        break;
      case 'pose':
        base = `Character standing in this exact pose: ${result.exactPoseAndStance}, ${result.cameraAndComposition}, ${result.isGraphicDesign ? 'modern 3D graphic design render' : 'authentic real-world background, photorealistic 8k'}`;
        break;
      case 'swap':
        base = result.subjectSwapPrompt;
        break;
      case 'style':
        base = result.styleTransferPrompt;
        break;
      case 'midjourney':
        base = `${result.isGraphicDesign ? result.graphicDesignPrompt : result.masterPrompt} --ar ${aspectRatio} --v 6.1 --style raw`;
        break;
      case 'short':
        base = result.shortPrompt;
        break;
    }

    const additions: string[] = [];
    if (selectedGraphicBoost) additions.push(selectedGraphicBoost);
    if (selectedPerspectiveBoost) additions.push(selectedPerspectiveBoost);
    if (selectedFontBoost) additions.push(selectedFontBoost);
    if (selectedPoseLock) additions.push(selectedPoseLock);

    if (additions.length > 0) {
      return `${base}, ${additions.join(', ')}`;
    }
    return base;
  };

  const downloadPromptTxt = () => {
    const fullText = `=== PROMPTVISION AI: REVERSE PROMPT REPORT ===
Generated on: ${new Date().toLocaleString()}
Type: ${result.isGraphicDesign ? 'GRAPHIC DESIGN & RENDER REPLICATION' : 'PHOTOREALISTIC CAPTURE'}

[GRAPHIC DESIGN RENDER DUPLICATE PROMPT (হুবহু গ্রাফিক্স ও ক্যারেক্টার কপি)]
${result.graphicDesignPrompt}

[MASTER PROMPT (WITH FULL CHARACTER, PERSPECTIVE & FONTS)]
${getActivePrompt()}

[FULL CHARACTER STANDING POSE & POSTURE (মাথা থেকে পা পর্যন্ত ফুল ক্যারেক্টার)]
${result.exactPoseAndStance}

[IDENTIFIED FONTS & TYPOGRAPHY BREAKDOWN (ব্যবহৃত সুনির্দিষ্ট ফন্ট ও টেক্সট স্টাইল)]
${result.identifiedFonts}

[GROUND / DEEP FORCED PERSPECTIVE & LAYERING (গ্রাউন্ড/গভীর পার্সপেক্টিভ ও ভ্যানিশিং পয়েন্ট)]
${result.spatialPerspective}

[GRAPHIC ELEMENTS & RENDER DETAILS]
${result.graphicDesignDetails}

[MIDJOURNEY PROMPT]
${result.midjourneyPrompt}

[SUBJECT SWAP TEMPLATE (Use with other subjects/products)]
${result.subjectSwapPrompt}

[STYLE TRANSFER PROMPT (Use with other scenes)]
${result.styleTransferPrompt}

[SHORT PROMPT]
${result.shortPrompt}

[NEGATIVE PROMPT]
${result.negativePrompt}

--- BREAKDOWN ---
Subject & Attire: ${result.subjectAndAttire}
Art Style & Medium: ${result.artStyle}
Camera Angle & Composition: ${result.cameraAndComposition}
Lighting & Atmosphere: ${result.lightingAndAtmosphere}
Color Palette: ${result.colorPalette.join(', ')} (${result.colorDescription})
Tags: ${result.suggestedTags.join(', ')}
`;

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PromptVision-AI-${result.isGraphicDesign ? 'Graphic-Render' : 'Prompt'}-${Date.now()}.txt`;
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

        {/* Quality Badges */}
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <PenTool className="w-3.5 h-3.5 text-cyan-400" />
            <span>🎨 ফুল ক্যারেক্টারসহ গ্রাফিক্স রেন্ডার কপি মোড</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Box className="w-3.5 h-3.5 text-indigo-400" />
            <span>গ্রাউন্ড / গভীর ৩ডি পার্সপেক্টিভ লক</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>ব্যবহৃত সুনির্দিষ্ট ফন্ট ডিটেইলস</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Accessibility className="w-3.5 h-3.5" />
            <span>শারীরিক ভঙ্গি ও পোজ লক</span>
          </div>
        </div>

        {/* Header & Main Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span>{result.isGraphicDesign ? 'Graphic Render & Full Character Prompt' : 'Generated Image Prompt'}</span>
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 mt-1">
              ডিজাইনে থাকা সম্পূর্ণ ক্যারেক্টারের দাঁড়ানোর পোজ, গভীর গ্রাউন্ড ৩ডি পার্সপেক্টিভ, এবং ব্যবহৃত সুনির্দিষ্ট ফন্ট সহ হুবহু প্রম্পট প্রস্তুত।
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
              title="Download Complete Report as .txt"
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
            onClick={() => setActiveTab('graphic')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'graphic'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/40'
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-cyan-300" />
            <span>🎨 Graphic Render Duplicate (ফুল ক্যারেক্টার ও রেন্ডার কপি)</span>
          </button>

          <button
            onClick={() => setActiveTab('perspective')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'perspective'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-300" />
            <span>📐 Ground Perspective (গভীর পার্সপেক্টিভ)</span>
          </button>

          <button
            onClick={() => setActiveTab('fonts')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'fonts'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-amber-300" />
            <span>🔤 Font Specs (ব্যবহৃত ফন্ট ও স্টাইল)</span>
          </button>

          <button
            onClick={() => setActiveTab('pose')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'pose'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20'
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            🧍 Full Character Pose (দাঁড়ানোর ভঙ্গি)
          </button>

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
            🔄 Subject Swap (একই ডিজাইনে অন্য ক্যারেক্টার)
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
        </div>

        {/* Tab Description Tip */}
        <div className="text-xs text-neutral-400 mb-3 flex items-center gap-1.5">
          {activeTab === 'graphic' && (
            <span className="text-cyan-300 font-medium">
              💡 Graphic Render Mode: Replicates the complete character head-to-toe, deep 3D perspective layers, specific font typography, and render finish!
            </span>
          )}
          {activeTab === 'perspective' && (
            <span className="text-indigo-300 font-medium">
              💡 Deep Perspective Mode: Low-angle upward ground elevation, dynamic vanishing lines, and multi-plane depth!
            </span>
          )}
          {activeTab === 'fonts' && (
            <span className="text-amber-300 font-medium">
              💡 Typography Mode: Integrates specific font names (e.g. Bebas Neue, Futura Bold, Space Grotesk) and 3D extruded lettering!
            </span>
          )}
          {activeTab === 'pose' && (
            <span className="text-pink-300 font-medium">
              💡 Tip: Locks the character's exact standing posture, foot angle, torso orientation, and hand placements!
            </span>
          )}
          {activeTab === 'swap' && (
            <span className="text-purple-300 font-medium">
              💡 Tip: Replace <code>[Insert Subject / Character Here]</code> with your desired character or product — keeping the exact same graphic layout, 3D depth, and fonts!
            </span>
          )}
          {activeTab === 'midjourney' && (
            <span className="text-sky-300 font-medium">
              💡 Formatted with Midjourney flags: <code>--ar {aspectRatio} --v 6.1 --style raw</code>
            </span>
          )}
          {activeTab === 'master' && (
            <span className="text-neutral-400 font-medium">
              💡 Complete detailed prompt with full character pose, camera optics, 3D perspective, and complete visual layout.
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

        {/* Controls Bar: Graphic Render & Perspective & Fonts & Pose */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-4">
          {/* Deep 3D Perspective Boosters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mr-2">
              <Box className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ground / Deep Perspective (গভীর পার্সপেক্টিভ):</span>
            </span>
            {[
              { label: '✓ Ground-Level Forced Perspective', val: 'dramatic ground-level upward forced perspective, expansive vanishing point lines, dynamic depth' },
              { label: '+ Frame Break Pop-Out (ফ্রেম ভেঙে বের হওয়া)', val: 'character breaking through 2D poster frame into 3D foreground space, depth pop-out' },
              { label: '+ Multi-Layer Floating Assets (লেয়ার্ড উপাদান)', val: 'foreground floating glassmorphism panels, midground character focus, background receding grid' },
              { label: '+ Worm\'s-Eye Hero Angle (হিরো অ্যাঙ্গেল)', val: 'low-angle hero perspective looking upward with expansive spatial headroom' },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() =>
                  setSelectedPerspectiveBoost(prev => (prev === p.val ? '' : p.val))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedPerspectiveBoost === p.val
                    ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/50 shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-white/5 hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Typography & Font Boosters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mr-2">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>Font Styles (ফন্ট স্টাইল):</span>
            </span>
            {[
              { label: 'Bebas Neue / Futura Bold (বোল্ড সান্স)', val: 'bold grotesque display sans-serif typography like Bebas Neue or Futura Bold, heavy tracking, all-caps' },
              { label: '3D Chrome Lettering (ক্রোম থ্রিডি টেক্সট)', val: '3D extruded chrome metallic text with beveled edges and specular highlights' },
              { label: 'Cyberpunk Neon Glow (নিয়ন গ্লো টেক্সট)', val: 'neon tube typography with outer cyan/magenta backlight glow and inner shadow' },
              { label: 'Space Grotesk Modern (মডার্ন ক্লিন ফন্ট)', val: 'clean geometric modern sans-serif typography like Space Grotesk, precise letter-spacing' },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() =>
                  setSelectedFontBoost(prev => (prev === f.val ? '' : f.val))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedFontBoost === f.val
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-white/5 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Graphic Design Boosters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mr-2">
              <PenTool className="w-3.5 h-3.5 text-cyan-400" />
              <span>Graphic Render Boosters (গ্রাফিক্স রেন্ডার):</span>
            </span>
            {[
              { label: '✓ 3D Octane Render (অকটান থ্রিডি)', val: '3D Octane render, raytraced subsurface scattering, clean glossy render finish' },
              { label: '+ Modern Glassmorphism (গ্লাস মরফিজম)', val: 'floating frosted glassmorphism UI panels, blurred backdrop overlays, modern transparent cards' },
              { label: '+ Floating Vector Shapes (ফ্লোটিং ভেক্টর উপাদান)', val: 'floating geometric shapes, plus icons, circle badges, vector pattern grid overlays' },
              { label: '+ Gradient Mesh & Glow (নিয়ন গ্রেডিয়েন্ট গ্লো)', val: 'vibrant neon gradient mesh, subtle edge glows, dynamic chromatic lighting' },
            ].map((g) => (
              <button
                key={g.label}
                onClick={() =>
                  setSelectedGraphicBoost(prev => (prev === g.val ? '' : g.val))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedGraphicBoost === g.val
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-white/5 hover:bg-white/10'
                }`}
              >
                {g.label}
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
        {/* Identified Fonts & Typography (Hero Card) */}
        <div className="bg-neutral-900/80 border border-amber-500/30 rounded-2xl p-5 hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Type className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Identified Fonts & Typography (ব্যবহৃত সুনির্দিষ্ট ফন্ট ও স্টাইল)
              </h3>
            </div>
            <p className="text-xs text-neutral-200 leading-relaxed font-mono">
              {result.identifiedFonts || 'Analyzing typography, font families, and letter styling...'}
            </p>
          </div>
          <button
            onClick={() => copyText(result.identifiedFonts, 'card-fonts')}
            className="mt-4 text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1.5 self-start transition-colors font-medium"
          >
            {copiedKey === 'card-fonts' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Font Specifications (ফন্ট কপি করুন)</span>
          </button>
        </div>

        {/* Spatial Perspective & 3D Layering (Hero Card) */}
        <div className="bg-neutral-900/80 border border-indigo-500/30 rounded-2xl p-5 hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Box className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Ground / Deep Forced Perspective (গভীর পার্সপেক্টিভ ও ভ্যানিশিং পয়েন্ট)
              </h3>
            </div>
            <p className="text-xs text-neutral-200 leading-relaxed font-mono">
              {result.spatialPerspective || 'Analyzing 3D spatial perspective, vanishing points, and depth planes...'}
            </p>
          </div>
          <button
            onClick={() => copyText(result.spatialPerspective, 'card-perspective')}
            className="mt-4 text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 self-start transition-colors font-medium"
          >
            {copiedKey === 'card-perspective' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Perspective Specs (পার্সপেক্টিভ কপি করুন)</span>
          </button>
        </div>

        {/* Full Character Standing Pose & Posture */}
        <div className="bg-neutral-900/80 border border-pink-500/30 rounded-2xl p-5 hover:border-pink-500/50 transition-all flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <Accessibility className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-pink-300">
                Full Character Pose (মাথা থেকে পা পর্যন্ত ফুল ক্যারেক্টার)
              </h3>
            </div>
            <p className="text-xs text-neutral-200 leading-relaxed font-mono">
              {result.exactPoseAndStance}
            </p>
          </div>
          <button
            onClick={() => copyText(result.exactPoseAndStance, 'card-pose')}
            className="mt-4 text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1.5 self-start transition-colors font-medium"
          >
            {copiedKey === 'card-pose' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Full Character Pose (ক্যারেক্টার পোজ কপি করুন)</span>
          </button>
        </div>

        {/* Graphic Design Elements & Render */}
        <div className="bg-neutral-900/80 border border-cyan-500/30 rounded-2xl p-5 hover:border-cyan-500/50 transition-all flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <PenTool className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Graphic Elements & Layout (গ্রাফিক্স ও লেআউট)
              </h3>
            </div>
            <p className="text-xs text-neutral-200 leading-relaxed font-mono">
              {result.graphicDesignDetails || 'Analyzing graphic design composition, badges, and render materials...'}
            </p>
          </div>
          <button
            onClick={() => copyText(result.graphicDesignDetails, 'card-graphics')}
            className="mt-4 text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 self-start transition-colors font-medium"
          >
            {copiedKey === 'card-graphics' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Graphic Elements Only</span>
          </button>
        </div>

        {/* Camera & Composition */}
        <div className="bg-neutral-900/80 border border-blue-500/20 rounded-2xl p-5 hover:border-blue-500/40 transition-all flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Camera className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Camera Angle & Optics (ক্যামেরা ও লেন্স)
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

        {/* Lighting & Atmosphere */}
        <div className="bg-neutral-900/80 border border-emerald-500/20 rounded-2xl p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sun className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Lighting & Atmosphere (আলো ও পরিবেশ)
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
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Subject & Attire (পোশাক ও বিষয়)
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {result.subjectAndAttire}
            </p>
          </div>
          <button
            onClick={() => copyText(result.subjectAndAttire, 'card-attire')}
            className="mt-4 text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1.5 self-start transition-colors"
          >
            {copiedKey === 'card-attire' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Attire Details</span>
          </button>
        </div>

        {/* Color Palette */}
        <div className="bg-neutral-900/70 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
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
            className="mt-4 text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1.5 self-start transition-colors"
          >
            {copiedKey === 'card-palette' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Hex Codes</span>
          </button>
        </div>

        {/* Negative Prompt */}
        <div className="bg-neutral-900/70 border border-red-500/20 rounded-2xl p-5 hover:border-red-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-300">
                Negative Prompt (যা পরিহার করবেন)
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
