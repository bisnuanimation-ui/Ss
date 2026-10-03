import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // Increase payload size limit to accept base64 image data
  app.use(express.json({ limit: '15mb' }));

  // Initialize server-side Gemini API client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // AI-driven reverse engineering endpoint
  app.post('/api/analyze', async (req, res) => {
    try {
      const { base64Image, mimeType } = req.body;
      if (!base64Image || !mimeType) {
        return res.status(400).json({ error: 'Image base64 data and mimeType are required' });
      }

      const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

      // System prompt for prompt engineering
      const systemInstruction = `
You are an expert prompt reverse-engineer and typography art director.
Analyze the following image description and generate a complete JSON prompt report matching this exact schema:

JSON Schema:
- "isGraphicDesign": boolean
- "masterPrompt": Detailed prompt (150-240 words)
- "graphicDesignPrompt": Prompt specifically designed to duplicate the layout and graphics
- "graphicDesignDetails": Details of typography, grids, layout, vectors
- "identifiedFonts": Specific or closest recommended font families and text styling
- "spatialPerspective": 3D depth, layered perspective planes
- "shortPrompt": Punchy 45-60 word prompt
- "midjourneyPrompt": Master prompt with flags ("--ar 16:9 --v 6.1 --style raw")
- "subjectSwapPrompt": Subject replacement template with [Insert Subject / Character Here]
- "styleTransferPrompt": Style, lighting, and palette prompt
- "exactPoseAndStance": Detailed anatomical posture and stance description
- "subjectAndAttire": Breakdown of clothes, materials, and character
- "cameraAndComposition": Camera elevation, angle, focal length, layout grid
- "lightingAndAtmosphere": Lighting vectors, key light, fill, rim glow
- "colorPalette": Array of 5 hex codes
- "colorDescription": Palette harmony description
- "artStyle": Medium description
- "negativePrompt": Quality exclusion keywords
- "suggestedTags": Array of 6 to 10 tags

Return ONLY valid raw JSON. No markdown backticks.
`;

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      };

      // Call Gemini 3.8 Flash model via Server-Side securely
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [imagePart, { text: "Reverse engineer this image and output the results as requested." }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        }
      });

      const textOutput = response.text || '';
      const cleanJsonText = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJsonText);
      return res.json(parsed);

    } catch (err: any) {
      console.error('Server-side Gemini processing failed:', err);
      return res.status(500).json({ 
        error: err.message || 'Gemini processing failed',
        details: err.stack || ''
      });
    }
  });

  // Serve static or Vite client
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const html = await vite.transformIndexHtml(url, `<!DOCTYPE html><html></html>`);
        // Let Vite serve our entrypoint index.html
        res.sendFile(path.resolve(__dirname, 'index.html'));
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production serving static built files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server-side Gemini engine listening on port ${port}`);
  });
}

startServer();
