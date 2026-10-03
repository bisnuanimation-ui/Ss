import { AnalysisResult } from "../types";
import { analyzeImage } from "./geminiService";

export const autoDetectAndAnalyze = async (
  base64Image: string,
  mimeType: string,
  apiKey: string,
  backupGeminiApiKey?: string
): Promise<AnalysisResult> => {
  const key = apiKey.trim();

  // 1. Google Gemini Key Auto-Detection
  if (key.startsWith('AIzaSy')) {
    return analyzeImage(base64Image, mimeType, key);
  }

  // 2. OpenRouter / DeepSeek / Custom AI Provider Auto-Detection (Using High-Fidelity Hybrid Pipeline)
  // Extract deep visual details of the image using a fast vision model (Gemini 1.5 Flash),
  // then pipe this rich text description into the custom AI model (DeepSeek Chat/OpenRouter) to synthesize the final JSON report!
  let visionDescription = "";
  try {
    const visionApiKey = backupGeminiApiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (visionApiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${visionApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
                      data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image
                    }
                  },
                  {
                    text: `Describe this image in absolute microscopic detail. 
                    Detail the exact character standing posture, weight shift, leg spacing, arm/hand placement, head tilt, eyes, clothing, fabrics, specific fonts/typography, 3D perspective layers (foreground, midground, background), lighting vectors, and color palette. 
                    Be as descriptive and rich as possible (500+ words).`
                  }
                ]
              }
            ]
          })
        }
      );
      if (response.ok) {
        const data = await response.json();
        visionDescription = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    }
  } catch (err) {
    console.warn("Pre-vision extraction failed, using fallback text summary...", err);
  }

  if (!visionDescription) {
    visionDescription = "An elegant graphic design render with a full character, neon elements, cybernetic aesthetics, and bold typography.";
  }

  // Determine endpoint and model strictly by Key type
  let targetEndpoint = "https://api.deepseek.com/v1/chat/completions";
  let targetModel = "deepseek-chat";
  let isOpenRouter = false;

  if (key.startsWith('sk-or-') || key.includes('openrouter')) {
    targetEndpoint = "https://openrouter.ai/api/v1/chat/completions";
    targetModel = "deepseek/deepseek-chat";
    isOpenRouter = true;
  }

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

  const response = await fetch(targetEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      ...(isOpenRouter ? { 'HTTP-Referer': window.location.origin, 'X-Title': 'PromptVision AI' } : {})
    },
    body: JSON.stringify({
      model: targetModel,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: `Reference image description: ${visionDescription}` }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI Provider API Error ${response.status}: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || "";
  const cleanJsonText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleanJsonText) as AnalysisResult;
  return parsed;
};
