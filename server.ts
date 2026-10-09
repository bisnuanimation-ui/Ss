import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // Increase payload size limit to accept base64 image data
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // AI-driven reverse engineering endpoint
  app.post('/api/analyze', async (req, res) => {
    try {
      const { base64Image, mimeType, customKey, fastMode, customAttire, customHeadline } = req.body;
      if (!base64Image || !mimeType) {
        return res.status(400).json({ error: 'Image base64 data and mimeType are required' });
      }

      const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

      // Select API key candidates: try customKey first if provided, always have process.env.GEMINI_API_KEY as primary/fallback
      const serverEnvKey = process.env.GEMINI_API_KEY || '';
      const candidateKeys: string[] = [];
      if (customKey && customKey.trim().length > 10 && customKey.trim() !== 'SYSTEM_DEFAULT') {
        candidateKeys.push(customKey.trim());
      }
      if (serverEnvKey && !candidateKeys.includes(serverEnvKey)) {
        candidateKeys.push(serverEnvKey);
      }

      if (candidateKeys.length === 0) {
        return res.status(401).json({ error: 'API_KEY_MISSING', message: 'No Gemini API key available on server or client' });
      }

      const systemInstruction = `
You are an Elite Director of Photography, Senior Graphic Designer, and Master AI Image Prompt Reverse-Engineer specializing in Midjourney v6.1, FLUX.1, and DALL-E 3.

TASK:
Perform a microscopic deconstruction of the uploaded image to generate:
1. An EXACT Master Replica Prompt replicating the camera angle, lens optics, lighting vectors, attire, and real-world environment.
2. A complete Forensic Process Blueprint:
   - PRECISE LIGHT ORIGIN & TRAJECTORY (Where light originates, which angle/vector it travels, and where it hits & casts shadows).
   - GRAPHICS & TEXTURE GRINDING BREAKDOWN (Where heavy texture grinding/grain/noise/halftone dots are applied vs smooth surfaces).
   - CAMERA ANGLE, ELEVATION & 3x3 KEYPAD GRID (Knee level, eye level, prime lens focal length, 3x3 dial composition).
   - REALISTIC ENVIRONMENT & NO CGI SLOP (Physical real-world materials, strictly zero plastic CGI skin, zero mention of head hair).
${customAttire ? `   - USER CUSTOM ATTIRE: Integrates clothing: "${customAttire}".\n` : ''}
${customHeadline ? `   - CUSTOM GRAPHIC HEADLINE: Adapts headline to: "${customHeadline}".\n` : ''}

You MUST return ONLY a valid, parseable JSON object matching this schema:
{
  "masterPrompt": "string (150-250 words master prompt duplicating the visual DNA, camera, light trajectory, attire, and authentic backdrop)",
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
  }
}
`;

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      };

      // Resilient models list: prioritize gemini-3.7-flash & gemini-3.1-flash-lite for instant response, with gemini-3.8-flash & gemini-flash-latest
      const modelsToTry = [
        'gemini-3.7-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest'
      ];
      let lastErr: any = null;
      let textOutput = '';
      let usedModelName = 'gemini-3.8-flash';

      for (const currentKey of candidateKeys) {
        const ai = new GoogleGenAI({
          apiKey: currentKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        for (const model of modelsToTry) {
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              const response = await ai.models.generateContent({
                model,
                contents: [imagePart, { text: "Reverse engineer this image and output the results as JSON." }],
                config: {
                  systemInstruction,
                  responseMimeType: 'application/json',
                }
              });
              textOutput = response.text || '';
              if (textOutput) {
                usedModelName = model;
                break;
              }
            } catch (e: any) {
              lastErr = e;
              console.warn(`Model ${model} attempt ${attempt} failed:`, e?.message?.slice(0, 80) || e);
              if (attempt === 1) {
                await new Promise(r => setTimeout(r, 400));
              }
            }
          }
          if (textOutput) break;
        }

        if (textOutput) break;
      }

      if (!textOutput) {
        throw lastErr || new Error('No output from Gemini models');
      }

      const cleanJsonText = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJsonText);
      parsed.usedProvider = `${usedModelName} (Server)`;
      return res.json(parsed);

    } catch (err: any) {
      console.error('Server-side Gemini processing failed:', err);
      const errMsg = err?.message || 'Gemini processing failed';
      const status = err?.status || (errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED') ? 403 : 500);
      return res.status(status).json({ 
        error: errMsg,
        status: err?.status,
        code: err?.code,
      });
    }
  });

  // Serve static or Vite client using pure middleware function to bypass path-to-regexp path constraints
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    
    app.use(async (req, res, next) => {
      // Exclude /api routes
      if (req.path.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production serving static built files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use(async (req, res, next) => {
      // Exclude /api routes
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  // Strictly bind to Port 3000 on all interfaces as required by the environment
  app.listen(3000, '0.0.0.0', () => {
    console.log(`Server-side Gemini engine listening strictly on port 3000`);
  });
}

startServer();
