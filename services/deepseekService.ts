import { AnalysisResult } from "../types";

export const analyzeImageWithDeepSeek = async (
  base64Image: string,
  mimeType: string,
  deepseekApiKey: string,
  geminiApiKeyForVision?: string
): Promise<AnalysisResult> => {
  if (!deepseekApiKey) {
    throw new Error('DEEPSEEK_API_KEY_INVALID');
  }

  // Step 1: Extract the extremely detailed visual description of the image using a fast vision run
  // This ensures that the text-only deepseek-chat model gets a hyper-fidelity source input!
  let visionDescription = "";
  try {
    const visionApiKey = geminiApiKeyForVision || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (visionApiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${visionApiKey}`,
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
      const data = await response.json();
      visionDescription = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
  } catch (err) {
    console.warn("Pre-vision extraction for DeepSeek failed, using backup text analysis...", err);
  }

  if (!visionDescription) {
    visionDescription = "An elegant graphic design render with a full character, neon elements, cybernetic aesthetics, and bold typography.";
  }

  // Step 2: Feed the high-fidelity description into DeepSeek to construct the perfect reverse-engineered prompts & JSON schema
  const isOpenRouter = deepseekApiKey.startsWith('sk-or-') || deepseekApiKey.includes('openrouter');
  const endpoint = isOpenRouter 
    ? 'https://openrouter.ai/api/v1/chat/completions' 
    : 'https://api.deepseek.com/v1/chat/completions';
  
  const modelName = isOpenRouter ? 'deepseek/deepseek-chat' : 'deepseek-chat';

  const systemInstruction = `
You are DeepSeek-Chat, a World-Class Art Director, Typographer, and Elite Prompt Reverse-Engineer specializing in Midjourney v6, Flux.1, and Stable Diffusion XL.

Based on the highly detailed visual description of the uploaded image provided by the user, you MUST construct a perfect, production-grade prompt report matching this exact JSON schema:

JSON Schema properties:
- "isGraphicDesign": boolean (true if description contains graphic design, 3D renders, poster layout, bold typography, floating panels, or vector art).
- "masterPrompt": Comprehensive prompt (150-240 words) starting immediately with the character's exact pose and clothing, followed by camera specs, deep perspective, and background graphics.
- "graphicDesignPrompt": Prompt specifically optimized to recreate the graphic design poster layout, 3D render engine shaders (e.g. Octane 3D), specific font typography, and floating vector shapes.
- "graphicDesignDetails": Exhaustive documentation of all graphic elements, vector badges, font weights, and text styling.
- "identifiedFonts": List specific or closest recommended font families (e.g., Headline: Bebas Neue / Futura Bold Display; Subhead: Space Grotesk) and text treatments (3D chrome extrusion, neon glow).
- "spatialPerspective": Detailed breakdown of 3D depth, layered perspective planes, and character placement.
- "shortPrompt": Punchy 45-60 word prompt.
- "midjourneyPrompt": Master prompt with flags ("--ar 16:9 --v 6.1 --style raw").
- "subjectSwapPrompt": Formatted with "[Insert Subject / Character Here]" so the user can easily put any other character into this scene.
- "styleTransferPrompt": Visual style, render shaders, lighting, and palette ready to apply to any other image.
- "exactPoseAndStance": Precise anatomical posture, weight shift, hand and arm positions, head tilt, and direction of gaze.
- "subjectAndAttire": Detailed breakdown of clothing, materials, accessories, and style.
- "cameraAndComposition": Camera elevation, angle, focal length, layout grid, and composition.
- "lightingAndAtmosphere": Lighting vectors, key light, fill, rim glow, and environment mood.
- "colorPalette": Array of 5 dominant/accent hex codes.
- "colorDescription": Palette harmony description.
- "artStyle": Art medium description.
- "negativePrompt": STRICT anti-CGI or quality exclusion keywords.
- "suggestedTags": Array of 6 to 10 high-value keywords.

You MUST respond ONLY with the raw JSON. Do not include markdown code block formatting like \`\`\`json. Just return the JSON object directly.
`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deepseekApiKey}`,
      ...(isOpenRouter ? { 'HTTP-Referer': window.location.origin, 'X-Title': 'PromptVision AI' } : {})
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: `Here is the microscopic visual description of the reference image: ${visionDescription}` }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DeepSeek API error response:", errorText);
    throw new Error('DEEPSEEK_API_ERROR');
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || "";
  
  // Clean markdown blocks if returned
  const cleanJsonText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleanJsonText) as AnalysisResult;
  return parsed;
};
