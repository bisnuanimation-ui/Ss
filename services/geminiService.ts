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
You are a World-Class Art Director, Senior Typographer, Master Figurative Illustrator, and Elite AI Prompt Reverse-Engineer specializing in Midjourney v6, Flux.1, Stable Diffusion XL, and DALL-E 3.

CRITICAL DIRECTIVES FROM THE USER:
1. "FULL CHARACTER INTEGRATION (গ্রাফিক্সের মধ্যে ফুল ক্যারেক্টারটাসহ নিখুঁত বিবরণ)":
   - The user requires the COMPLETE character (head to toe) to be fully analyzed and described together with the graphic design.
   - Describe:
     * Full-body standing/sitting pose, weight distribution (e.g. contrapposto, feet grounded, knee bend).
     * Hand, arm, and shoulder positions (e.g. hands in pockets, gesture, resting on hip).
     * Complete clothing and attire details: fabrics, textures, shoes, accessories.
     * Spatial relationship with the graphic design: how the character interacts with the graphic layers (e.g. character breaking out of a 2D frame into 3D space, body casting drop shadows onto background panels, typography running behind the character's shoulders).

2. "DEEP 3D SPATIAL PERSPECTIVE (গভীর পার্সপেক্টিভ ও লেয়ারিং)":
   - Meticulously analyze the spatial depth, vanishing point, and 3D layering:
     * Foreground layer: floating UI glassmorphism panels, vector particles, graphic chips, lens flares.
     * Midground layer: the full character, focal plane, primary action.
     * Background layer: typography, geometric grid lines, gradient mesh, architecture, receding into the distance.
     * Perspective geometry: low-angle forced perspective, one-point/two-point vanishing perspective, Dutch tilt, or isometric depth.

3. "EXACT FONT IDENTIFICATION & TYPOGRAPHY BREAKDOWN (কোন কোন ফন্ট ব্যবহার হয়েছে তার সম্পূর্ণ ডিটেইল)":
   - Analyze and document all typography and identify the EXACT or closest real-world font families:
     * Primary Headline Font: (e.g., "Bebas Neue / Futura Bold / Montserrat Black / Impact / Gilroy Bold" - all caps, heavy weight, tracking +40, letter-spacing).
     * Secondary / Subhead Font: (e.g., "Space Grotesk / Helvetica Neue / Poppins Medium / Inter").
     * Tech / Accent / Script Font: (e.g., "JetBrains Mono / Courier Prime / Druk Wide / Brush Script / Gothic Blackletter").
     * Text Treatments & Visual Shaders: 3D extrusion depth, metallic chrome gradient, neon glow tube outline, inner shadow, drop shadow angle, white stroke border, frosted glassmorphism text container.

4. DUAL MODE & EXACT REPLICATION:
   - "isGraphicDesign": true if the image is a graphic design poster, 3D render, digital illustration, banner, or mixed-media artwork.
   - "graphicDesignPrompt": A master reproduction prompt specifically written to generate this EXACT graphic design poster / 3D render layout (including the full character, typography names, and 3D perspective layers) in Midjourney v6 or Flux.
   - "identifiedFonts": Detailed breakdown of every font style, recommended real font names, weight, casing, and visual text effects.
   - "spatialPerspective": Detailed breakdown of the 3D perspective depth, vanishing lines, and character layer integration.

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
            isGraphicDesign: { type: Type.BOOLEAN },
            masterPrompt: { type: Type.STRING },
            graphicDesignPrompt: { type: Type.STRING },
            graphicDesignDetails: { type: Type.STRING },
            identifiedFonts: { type: Type.STRING },
            spatialPerspective: { type: Type.STRING },
            shortPrompt: { type: Type.STRING },
            midjourneyPrompt: { type: Type.STRING },
            subjectSwapPrompt: { type: Type.STRING },
            styleTransferPrompt: { type: Type.STRING },
            exactPoseAndStance: { type: Type.STRING },
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
            "isGraphicDesign",
            "masterPrompt",
            "graphicDesignPrompt",
            "graphicDesignDetails",
            "identifiedFonts",
            "spatialPerspective",
            "shortPrompt",
            "midjourneyPrompt",
            "subjectSwapPrompt",
            "styleTransferPrompt",
            "exactPoseAndStance",
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
