import { AnalysisResult } from '../types';
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
You are an Elite Director of Photography, Senior Graphic Designer, and Master AI Image Prompt Reverse-Engineer specializing in Midjourney v6.1, FLUX.1, and DALL-E 3.

TASK:
Perform a microscopic deconstruction of the uploaded image to generate:
1. An EXACT 100% Master Replica Prompt ("হুবুহু একটা জেনারেট করে দেবে").
2. A complete Forensic Process Blueprint:
   - PRECISE LIGHT ORIGIN & TRAJECTORY (Where light originates, which directional vector it travels, and where highlights & shadows land).
   - GRAPHICS & TEXTURE GRINDING BREAKDOWN (Where heavy texture grinding/noise/grunge/halftone dots are applied vs smooth surfaces).
   - CAMERA ANGLE, ELEVATION & 3x3 KEYPAD GRID (Knee level, eye level, focal length, aperture f-stop, 3x3 dial composition).
   - REALISTIC ENVIRONMENT & NO CGI SLOP (Physical real-world textures, strictly zero plastic CGI skin, zero mention of head hair).
${options.customAttire ? `   - USER CUSTOM ATTIRE: "${options.customAttire}".\n` : ''}
${options.customHeadline ? `   - CUSTOM GRAPHIC HEADLINE: "${options.customHeadline}".\n` : ''}

You MUST return ONLY valid JSON matching this schema:
{
  "masterPrompt": "string (150-250 words master prompt replicating the visual DNA, camera, light trajectory, attire, and real-world backdrop)",
  "shortPrompt": "string (45-65 words punchy direct prompt)",
  "midjourneyPrompt": "string (Master prompt with --ar 16:9 --v 6.1 --style raw --stylize 180)",
  "subjectSwapPrompt": "string (Template with [Insert Subject / Character Here])",
  "styleTransferPrompt": "string (Style, lighting, and optics without specific character)",
  "subjectAndAttire": "string (Detailed character interaction, stance, gestures, clothing fabric and folds)",
  "cameraAndComposition": "string (Exact camera elevation, lens focal length, aperture f-stop, 3x3 grid)",
  "lightingAndAtmosphere": "string (Atmosphere, ambient tones, Kelvin color temperature)",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "colorDescription": "string (Color grading and contrast tone curve)",
  "artStyle": "string (DSLR photography / Graphic streetwear apparel / editorial poster)",
  "negativePrompt": "string (anti-cgi, plastic skin, 3d render, watermark, deformed, blurry)",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "lightTrajectory": {
    "origin": "string (Origin points of all light sources, e.g. overhead festoon lights, rear rim)",
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

  const startTime = performance.now();
  let attempt = 0;
  let lastError: any = null;

  // 1. PRIMARY ROUTE: Server-side Gemini 3.8 Flash proxy (bypasses browser CORS & 403 PERMISSION_DENIED)
  try {
    options.onStatusUpdate?.('জেমিনি ৩.৮ ফ্ল্যাশ সার্ভার প্রসেসিং শুরু হচ্ছে...');

    const serverRes = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image: cleanBase64,
        mimeType: imageMime,
        fastMode: options.fastMode,
        customAttire: options.customAttire,
        customHeadline: options.customHeadline,
      }),
    });

    if (serverRes.ok) {
      const data = await serverRes.json();
      data.usedProvider = data.usedProvider || 'Gemini 3.8 Flash (Server)';
      data.generationDurationMs = Math.round(performance.now() - startTime);

      // Track usage in apiManager if active key exists
      const activeKey = apiManager.getActiveKey();
      if (activeKey) {
        apiManager.incrementUsage(activeKey.id);
        apiManager.updateKeyStatus(activeKey.id, 'active', undefined, data.generationDurationMs);
      }

      return data as AnalysisResult;
    } else {
      const errBody = await serverRes.json().catch(() => ({}));
      console.warn('Server-side Gemini returned non-OK status:', serverRes.status, errBody);
      lastError = new Error(errBody?.error || `Server HTTP ${serverRes.status}`);
    }
  } catch (err: any) {
    console.warn('Direct server /api/analyze call error, falling back to multi-key rotation:', err);
    lastError = err;
  }

  // 2. MULTI-KEY FAILOVER: If server-side key had an issue or user has custom keys (Friendli / OpenAI / Custom Gemini)
  const maxAttempts = Math.max(apiManager.getKeys().length, 3);

  while (attempt < maxAttempts) {
    attempt++;
    const currentKey = apiManager.getActiveKey();

    if (!currentKey || !currentKey.key || currentKey.key.trim().length < 5) {
      break;
    }

    options.onStatusUpdate?.(
      `বিকল্প এপিআই দিয়ে চেষ্টা করা হচ্ছে: ${currentKey.name} (${currentKey.provider.toUpperCase()})...`
    );

    try {
      let resultText = '';

      if (currentKey.provider === 'gemini') {
        // Try server endpoint with customKey parameter
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Image: cleanBase64,
            mimeType: imageMime,
            customKey: currentKey.key.trim(),
            fastMode: options.fastMode,
            customAttire: options.customAttire,
            customHeadline: options.customHeadline,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody?.error || `Gemini API HTTP ${res.status}`);
        }

        const data = await res.json();
        data.usedProvider = `${currentKey.name} (Gemini 3.8 Flash)`;
        data.generationDurationMs = Math.round(performance.now() - startTime);
        apiManager.incrementUsage(currentKey.id);
        apiManager.updateKeyStatus(currentKey.id, 'active', undefined, data.generationDurationMs);
        return data as AnalysisResult;
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
      console.warn(`Key ${currentKey.name} failed:`, errStr);

      const isQuota =
        errStr.includes('429') ||
        errStr.includes('RESOURCE_EXHAUSTED') ||
        errStr.includes('quota') ||
        errStr.includes('limit');

      const reason = isQuota
        ? 'কোটা / লিমিট শেষ (Quota Exhausted)'
        : errStr.slice(0, 80);

      options.onStatusUpdate?.(
        `⚠️ ${currentKey.name} লিমিট শেষ (${reason})! পরবর্তী কী-তে অটোমেটিক সুইচ করা হচ্ছে...`
      );

      const nextKey = apiManager.rotateToNextKey(currentKey.id, reason);
      if (!nextKey) break;
      await new Promise(r => setTimeout(r, 600));
    }
  }

  throw lastError || new Error('ছবি বিশ্লেষণ ব্যর্থ হয়েছে। অনুগ্রহ করে API Key কনফিগারেশন চেক করুন।');
};
