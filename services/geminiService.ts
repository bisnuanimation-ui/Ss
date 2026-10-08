import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeImage = async (
  base64Image: string,
  mimeType: string
): Promise<AnalysisResult> => {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY_INVALID');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const promptInstruction = `
You are an Elite Director of Photography (DoP) and Master AI Prompt Reverse-Engineer specializing in Midjourney v6, Flux.1, Stable Diffusion XL, and DALL-E 3.

CORE DIRECTIVE FROM THE USER:
1. "EXTREMELY PRECISE CAMERA ANGLES & OPTICS": The prompt MUST describe the exact camera angle, perspective, lens focal length, aperture, camera model, and framing with surgical precision.
2. "100% AUTHENTIC REAL-WORLD / REALISTIC BACKGROUND (NO ARTIFICIAL/CGI/PLASTIC LOOK)":
   The user explicitly noted that AI backgrounds often look "artificial, fake 3D, CGI, or synthetic".
   You MUST instruct the AI generator to build an AUTHENTIC, PHYSICAL, REAL-WORLD ENVIRONMENT. Real architectural details, tactile material textures (concrete grain, natural wood, real brick, genuine glass reflections, atmospheric dust motes, realistic real-estate interior or exterior textures, natural ambient light bounces, genuine environmental depth of field). NO plastic, NO CGI video game look, NO artificial sterile stock rendering!

Analyze the uploaded image in microscopic detail and construct the optimal prompts:

1. CAMERA SPECIFICATIONS & ANGLE (MANDATORY IN EVERY PROMPT):
   - Explicit Camera Angle: (e.g., "dramatic low-angle hero perspective", "intimate eye-level medium close-up", "cinematic wide three-quarter angle", "ground-level tilt", "overhead architectural perspective").
   - Camera & Lens Hardware: (e.g., "Captured on Hasselblad H6D-100c with 85mm f/1.4 prime lens", "Shot on Sony A7R V with 35mm G-Master anamorphic lens", "50mm f/1.2 at maximum aperture").
   - Optical Depth & Quality: "Shallow depth of field with organic creamy optical bokeh, razor-sharp focal plane, subtle natural optical vignette, realistic sensor noise grain".

2. AUTHENTIC REAL-WORLD BACKGROUND & REAL ESTATE REALISM:
   - Forbid artificial, cartoonish, 3D render, or plastic backdrops.
   - Describe real-world architectural and natural materials: "Real-world environmental backdrop, authentic architectural textures, realistic ambient daylight falloff, genuine spatial depth, physical real-estate environment with natural imperfect textures, real wall plaster, authentic wood grain, tactile physical surfaces".

3. PROMPT OUTPUTS:
   - "masterPrompt": Comprehensive, high-end master prompt (140-220 words) detailing the exact camera angle, lens optics, subject pose, clothing, and ultra-realistic real-world background.
   - "shortPrompt": Punchy 45-60 word prompt focusing on the key subject, camera angle, and real-world environment.
   - "midjourneyPrompt": Master prompt with optimal Midjourney v6 photorealism parameters: "--ar 16:9 --v 6.1 --style raw --stylize 180".
   - "subjectSwapPrompt": Formatted with "[Insert Subject / Character Here, e.g., a stylish young architect or a contemplative traveler]" in the same realistic camera angle and real-world background.
   - "styleTransferPrompt": The exact camera angle, lens, real-world lighting, and authentic environment without any specific character, ready to apply to any other image.
   - "subjectAndAttire": Microscopic breakdown of posture, gesture, expression, clothing fabric, stitching, and accessories.
   - "cameraAndComposition": Full optical breakdown (Angle, focal length, aperture f-stop, camera gear, framing ratio, leading lines, golden ratio).
   - "lightingAndAtmosphere": Natural light direction, key light, fill, bounce, ambient real-world illumination.
   - "colorPalette": 5 dominant and accent hex codes (#RRGGBB).
   - "colorDescription": Natural color science and grading (e.g., "Kodak Portra 400 natural warm tones").
   - "artStyle": "Authentic full-frame 35mm documentary photography, photorealistic real-world environment".
   - "negativePrompt": STRICT list of anti-artificial keywords: "cgi, 3d render, plastic textures, artificial fake background, cartoon, sterile stock 3d, video game graphics, airbrushed skin, oversaturated, deformed anatomy, blurry, bad optics, fake gaussian blur, watermark".
   - "suggestedTags": 6 to 10 high-value tags (e.g., "85mm f/1.4", "low-angle hero shot", "real-world architecture", "photorealistic", "natural ambient lighting", "kodak portra").

Return clean JSON strictly matching the schema.
`;

  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: promptInstruction },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            masterPrompt: { type: Type.STRING },
            shortPrompt: { type: Type.STRING },
            midjourneyPrompt: { type: Type.STRING },
            subjectSwapPrompt: { type: Type.STRING },
            styleTransferPrompt: { type: Type.STRING },
            subjectAndAttire: { type: Type.STRING },
            cameraAndComposition: { type: Type.STRING },
            lightingAndAtmosphere: { type: Type.STRING },
            colorPalette: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            colorDescription: { type: Type.STRING },
            artStyle: { type: Type.STRING },
            negativePrompt: { type: Type.STRING },
            suggestedTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "masterPrompt",
            "shortPrompt",
            "midjourneyPrompt",
            "subjectSwapPrompt",
            "styleTransferPrompt",
            "subjectAndAttire",
            "cameraAndComposition",
            "lightingAndAtmosphere",
            "colorPalette",
            "colorDescription",
            "artStyle",
            "negativePrompt",
            "suggestedTags",
          ],
        },
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text) as AnalysisResult;
    return parsed;
  } catch (error: any) {
    console.error("Gemini Image-to-Prompt Analysis Error:", error);
    if (error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    if (error?.status === 404 || error?.message?.includes('API_KEY_INVALID')) {
      throw new Error('API_KEY_INVALID');
    }
    throw error;
  }
};
