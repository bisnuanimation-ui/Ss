import { AnalysisResult } from '../types';
import { apiManager } from './apiManager';
import { optimizeImageForFastAnalysis } from './imageOptimizer';

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
  const startTime = performance.now();
  let attempt = 0;
  let lastError: any = null;

  options.onStatusUpdate?.('ছবি অপ্টিমাইজ ও লাইটওয়েট প্রসেস করা হচ্ছে...');
  const { optimizedBase64, mimeType: optMime } = await optimizeImageForFastAnalysis(base64Image, 1024, 0.85);

  const cleanBase64 = optimizedBase64.includes(',') ? optimizedBase64.split(',')[1] : optimizedBase64;
  const imageMime = optMime || mimeType || 'image/jpeg';
  const dataUrl = `data:${imageMime};base64,${cleanBase64}`;

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
      data.usedProvider = data.usedProvider || 'Gemini 3.7 / 3.1 Flash (Server)';
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
      const rawMsg = errBody?.error || `Server HTTP ${serverRes.status}`;
      lastError = new Error(rawMsg);
    }
  } catch (err: any) {
    console.warn('Direct server /api/analyze call error, falling back to multi-key rotation:', err);
    lastError = err;
  }

  // 2. MULTI-KEY FAILOVER: If user has custom keys (Custom Gemini / Friendli / OpenAI)
  const allKeys = apiManager.getKeys();
  const customKeys = allKeys.filter(k => k.key && k.key.trim().length > 5 && k.key !== 'SYSTEM_DEFAULT');

  if (customKeys.length > 0) {
    for (const currentKey of customKeys) {
      if (currentKey.status === 'exhausted' || currentKey.status === 'error') continue;

      options.onStatusUpdate?.(
        `বিকল্প এপিআই দিয়ে চেষ্টা করা হচ্ছে: ${currentKey.name} (${currentKey.provider.toUpperCase()})...`
      );

      try {
        let resultText = '';

        if (currentKey.provider === 'gemini') {
          // Try server endpoint with user's custom Gemini key
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
          data.usedProvider = `${currentKey.name} (Custom Key)`;
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
        console.warn(`Key ${currentKey.name} failed:`, err);
        apiManager.updateKeyStatus(currentKey.id, 'error', String(err?.message || err).slice(0, 80));
      }
    }
  }

  // Friendly human readable error message
  const rawErrStr = String(lastError?.message || lastError || '');
  if (rawErrStr.includes('429') || rawErrStr.includes('RESOURCE_EXHAUSTED') || rawErrStr.includes('quota')) {
    throw new Error('গুগল জেমিনির ফ্রি লিমিট সাময়িকভাবে শেষ হয়েছে (Daily Quota Limit Exceeded)। অনুগ্রহ করে আপনার নিজস্ব ফ্রি API Key যুক্ত করুন বা পুনরায় চেষ্টা করুন।');
  }
  if (rawErrStr.includes('404')) {
    throw new Error('মডেল কানেকশন রিফ্রেশ করা প্রয়োজন। অনুগ্রহ করে আবার "প্রম্পট তৈরি করুন" বাটনে ক্লিক করুন।');
  }

  throw lastError || new Error('ছবি বিশ্লেষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
};
