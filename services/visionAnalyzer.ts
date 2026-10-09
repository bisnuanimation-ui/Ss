import { GoogleGenAI } from '@google/genai';
import { AnalysisResult, GraphicCustomization } from '../types';
import { apiManager } from './apiManager';

interface AnalyzeOptions {
  fastMode?: boolean;
  customAttire?: string;
  customHeadline?: string;
  customPalette?: string;
  customGrinding?: 'none' | 'subtle' | 'heavy' | 'vintage';
  onStatusUpdate?: (statusText: string) => void;
}

const buildSystemPrompt = (options: AnalyzeOptions) => `
You are an Elite Director of Photography, Senior Graphic Designer, and Master AI Image Prompt Reverse-Engineer.

YOUR MISSION:
Perform a microscopic, forensic deconstruction of the uploaded image to generate:
1. An EXACT 100% Master Replica Prompt ("হুবুহু একটা জেনারেট করে দেবে") for Midjourney v6.1, FLUX.1, and DALL-E 3.
2. A complete Forensic Process Blueprint ("পুরা প্রসেস কোথা থেকে আসছে, কোথা থেকে বলছে"):
   - PRECISE LIGHT ORIGIN & TRAJECTORY (আলো কোথা থেকে আসছে এবং কোথায় যাচ্ছে - Light Path & Vector):
     * Exactly WHERE each light source originates (e.g. overhead festoon lights, rear softbox rim, golden 45° sun).
     * Which directional vector and trajectory it travels (downward diagonal, bounce off marble/floor, lens rim).
     * EXACT impact zones (where highlights, specular reflections hit, and where elongated shadows are cast).
   - GRAPHICS & TEXTURE GRINDING BREAKDOWN (কোথায় কোথায় বেশি গ্রাইন্ডিং, গ্রাঞ্জ বা নয়েজ করা হয়েছে):
     * Detailed map of where heavy texture grinding (গ্রাইন্ডিং), film grain, halftone dots, or distressed print textures are applied vs clean smooth zones.
     * Graphic element origin: vector frames, floating chips, typography badges, logo placement (like streetwear "NEXORA" style).
   - CAMERA ANGLE, ELEVATION & 3x3 KEYPAD GRID:
     * Camera height/elevation (knee-height low angle, eye level, waist level).
     * Optics: DSLR sensor character, prime lens focal length (e.g. 85mm f/1.4, 35mm f/1.8), creamy circular bokeh.
     * 3x3 Keypad Dial grid placement (Top-Left [1] to Bottom-Right [9]) of all subjects and graphic anchors.
   - REALISTIC ENVIRONMENT & NO CGI SLOP:
     * Describe real physical materials (authentic architecture, stone/wood/fabric textures).
     * STRICTLY ZERO plastic CGI skin, ZERO artificial fake rendering.
     * STRICTLY NO mention of head hair, and NO specific individual facial identities.
${options.customAttire ? `   - USER CUSTOM ATTIRE: The user commanded: "${options.customAttire}". Meticulously integrate this clothing.\n` : ''}
${options.customHeadline ? `   - CUSTOM GRAPHIC TEXT: The user wants to adapt the design headline to: "${options.customHeadline}".\n` : ''}
${options.customPalette ? `   - CUSTOM PALETTE: The user requested the color theme: "${options.customPalette}".\n` : ''}

You MUST return ONLY a valid, parseable JSON object matching this exact schema:
{
  "masterPrompt": "string (150-250 words master prompt replicating the complete visual DNA, camera, light trajectory, attire, and real-world backdrop)",
  "shortPrompt": "string (50-70 words fast direct prompt)",
  "midjourneyPrompt": "string (Master prompt with --ar 16:9 --v 6.1 --style raw --stylize 180)",
  "subjectSwapPrompt": "string (Template with [Insert Subject Here])",
  "styleTransferPrompt": "string (Style & optics only without specific characters)",
  "subjectAndAttire": "string (Detailed character interaction, stance, gestures, clothing fabric and folds)",
  "cameraAndComposition": "string (Exact camera elevation, lens focal length, aperture f-stop, 3x3 grid)",
  "lightingAndAtmosphere": "string (Atmosphere, ambient tones, Kelvin color temperature)",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "colorDescription": "string (Color grading and contrast tone curve)",
  "artStyle": "string (DSLR photography / Graphic streetwear apparel / editorial poster)",
  "negativePrompt": "string (anti-cgi, plastic skin, 3d render, watermark, deformed, blurry)",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "lightTrajectory": {
    "origin": "string (Exact origin points of all light sources, e.g. overhead festoon lights, rear rim)",
    "path": "string (Directional vector, angles, bounces)",
    "impact": "string (Impact zones on subject/environment, specular catchlights, cast shadows)"
  },
  "graphicDesign": {
    "isGraphicDesign": true,
    "elementOrigin": "string (Where graphic elements originated: typography badges, vector lines, distressed layers)",
    "textureGrinding": {
      "heavyGrindingZones": "string (Exact locations of heavy grinding, noise, distress, halftone grain)",
      "smoothZones": "string (Clean, crisp, untouched surfaces and vector planes)",
      "textureType": "string (e.g. vintage screen-print distressing, 35mm film grain, grunge overlay)"
    },
    "typographyStyle": "string (Font style, tracking, bold condensed gothic/serif, badge text)",
    "gridPlacement": "string (3x3 Keypad coordinates for subjects and graphics)"
  },
  "customization": {
    "customHeadline": "${options.customHeadline || ''}",
    "customPalette": "${options.customPalette || ''}",
    "customAttire": "${options.customAttire || ''}",
    "customGrinding": "${options.customGrinding || 'subtle'}",
    "modifiedMasterPrompt": "string (Re-engineered prompt incorporating user customizations while preserving camera, pose, and light trajectory)"
  }
}
`;

export const analyzeWithMultiApi = async (
  base64Image: string,
  mimeType: string,
  options: AnalyzeOptions = {}
): Promise<AnalysisResult> => {
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const imageMime = mimeType || 'image/jpeg';
  const dataUrl = `data:${imageMime};base64,${cleanBase64}`;

  const maxAttempts = Math.max(apiManager.getKeys().length, 3);
  let attempt = 0;
  let lastError: any = null;

  const startTime = performance.now();

  while (attempt < maxAttempts) {
    attempt++;
    const currentKey = apiManager.getActiveKey();

    if (!currentKey || !currentKey.key || currentKey.key.trim().length < 5) {
      throw new Error(
        'কোনো সক্রিয় API Key পাওয়া যায়নি (No active API Key configured). অনুগ্রহ করে উপরে "API রোটেশন ম্যানেজার" থেকে একটি Gemini, Friendli AI, অথবা OpenAI কী যুক্ত করুন।'
      );
    }

    options.onStatusUpdate?.(
      `বিশ্লেষণ চলছে: ${currentKey.name} (${currentKey.provider.toUpperCase()}) দিয়ে প্রসেস করা হচ্ছে...`
    );

    try {
      let resultText = '';

      if (currentKey.provider === 'gemini') {
        const ai = new GoogleGenAI({
          apiKey: currentKey.key.trim(),
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const modelToUse = options.fastMode
          ? 'gemini-3.1-flash-lite'
          : currentKey.model || 'gemini-3.8-flash';

        const response = await ai.models.generateContent({
          model: modelToUse,
          contents: [
            { text: buildSystemPrompt(options) },
            {
              inlineData: {
                mimeType: imageMime,
                data: cleanBase64,
              },
            },
          ],
        });

        resultText = response.text || '';
      } else if (currentKey.provider === 'friendli') {
        // Friendli AI OpenAI-compatible endpoint
        const endpoint = (currentKey.endpoint || 'https://api.friendli.ai/serverless/v1').replace(/\/+$/, '');
        const modelToUse = currentKey.model || 'meta-llama/Llama-3.2-11B-Vision-Instruct';

        const res = await fetch(`${endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentKey.key.trim()}`,
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: buildSystemPrompt(options) },
                  { type: 'image_url', image_url: { url: dataUrl } },
                ],
              },
            ],
            temperature: 0.2,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody?.error?.message || `Friendli AI HTTP ${res.status}`);
        }

        const data = await res.json();
        resultText = data?.choices?.[0]?.message?.content || '';
      } else if (currentKey.provider === 'openai') {
        // OpenAI standard Vision endpoint
        const endpoint = (currentKey.endpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
        const modelToUse = currentKey.model || 'gpt-4o-mini';

        const res = await fetch(`${endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentKey.key.trim()}`,
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: buildSystemPrompt(options) },
                  { type: 'image_url', image_url: { url: dataUrl } },
                ],
              },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody?.error?.message || `OpenAI HTTP ${res.status}`);
        }

        const data = await res.json();
        resultText = data?.choices?.[0]?.message?.content || '';
      }

      // Parse JSON from output
      let cleaned = resultText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      const parsed: AnalysisResult = JSON.parse(cleaned);

      apiManager.incrementUsage(currentKey.id);
      apiManager.updateKeyStatus(currentKey.id, 'active', undefined, Math.round(performance.now() - startTime));

      parsed.usedProvider = `${currentKey.name} (${currentKey.provider.toUpperCase()})`;
      parsed.generationDurationMs = Math.round(performance.now() - startTime);

      return parsed;
    } catch (err: any) {
      lastError = err;
      const errStr = String(err?.message || err);
      console.warn(`API call failed for [${currentKey.name}]:`, errStr);

      const isQuotaOrRateLimit =
        errStr.includes('429') ||
        errStr.includes('RESOURCE_EXHAUSTED') ||
        errStr.includes('Quota') ||
        errStr.includes('limit') ||
        errStr.includes('rate_limit');

      const isKeyInvalid =
        errStr.includes('API key') ||
        errStr.includes('401') ||
        errStr.includes('Unauthorized') ||
        errStr.includes('invalid_api_key');

      const reason = isQuotaOrRateLimit
        ? 'কোটা / রেট লিমিট শেষ (Quota Exhausted)'
        : isKeyInvalid
        ? 'ভুল বা মেয়াদোত্তীর্ণ কী (Invalid API Key)'
        : errStr.slice(0, 80);

      // Trigger automatic failover / rotation to next available key!
      options.onStatusUpdate?.(
        `⚠️ ${currentKey.name} লিমিট শেষ (${reason})! পরবর্তী এপিআই-তে অটোমেটিক সুইচ করা হচ্ছে...`
      );

      const nextKey = apiManager.rotateToNextKey(currentKey.id, reason);

      if (!nextKey) {
        // No more keys in pool
        break;
      }

      // Small pause before retrying with next key
      await new Promise(r => setTimeout(r, 600));
    }
  }

  throw lastError || new Error('সবগুলো API Key এর কোটা শেষ বা ব্যর্থ হয়েছে। অনুগ্রহ করে নতুন API Key যুক্ত করুন।');
};
