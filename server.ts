import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Increase body size limits for high-resolution base64 images
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Initialize Gemini on server
const getGeminiClient = (customKey?: string) => {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the server environment");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const parseResponse = (text: string) => {
  const sections = {
    layoutPosition: '',
    photoStyle: '',
    composition: '',
    effects: '',
    colorGuideline: '',
    typography: '',
    finalLook: '',
    masterPrompt: '',
    attireGuideline: '',
  };

  const lines = text.split('\n');
  let currentKey: string | null = null;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('LAYOUT_POSITION:')) {
      sections.layoutPosition = trimmedLine.replace('LAYOUT_POSITION:', '').trim();
      currentKey = 'layoutPosition';
    } else if (trimmedLine.startsWith('PHOTO_STYLE:')) {
      sections.photoStyle = trimmedLine.replace('PHOTO_STYLE:', '').trim();
      currentKey = 'photoStyle';
    } else if (trimmedLine.startsWith('ATTIRE:') || trimmedLine.startsWith('CLOTHING:')) {
      sections.attireGuideline = trimmedLine.replace(/^(ATTIRE|CLOTHING):/, '').trim();
      currentKey = 'attireGuideline';
    } else if (trimmedLine.startsWith('COMPOSITION:')) {
      sections.composition = trimmedLine.replace('COMPOSITION:', '').trim();
      currentKey = 'composition';
    } else if (trimmedLine.startsWith('EFFECTS:')) {
      sections.effects = trimmedLine.replace('EFFECTS:', '').trim();
      currentKey = 'effects';
    } else if (trimmedLine.startsWith('COLOR:')) {
      sections.colorGuideline = trimmedLine.replace('COLOR:', '').trim();
      currentKey = 'colorGuideline';
    } else if (
      trimmedLine.startsWith('TYPOGRAPHY:') || 
      trimmedLine.startsWith('GRAPHICS:') || 
      trimmedLine.startsWith('GRAPHICS_AND_TYPOGRAPHY:') ||
      trimmedLine.startsWith('GRAPHICS_DETAILS:')
    ) {
      sections.typography = trimmedLine.replace(/^(TYPOGRAPHY|GRAPHICS|GRAPHICS_AND_TYPOGRAPHY|GRAPHICS_DETAILS):/, '').trim();
      currentKey = 'typography';
    } else if (trimmedLine.startsWith('FINAL_LOOK:')) {
      sections.finalLook = trimmedLine.replace('FINAL_LOOK:', '').trim();
      currentKey = 'finalLook';
    } else if (trimmedLine.startsWith('PROMPT:')) {
      sections.masterPrompt = trimmedLine.replace('PROMPT:', '').trim();
      currentKey = 'masterPrompt';
    } else if (currentKey && trimmedLine) {
      const target = currentKey as keyof typeof sections;
      sections[target] += ' ' + trimmedLine;
    }
  });

  return sections;
};

// Helper for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper for Gemini calls with retry and model fallback
async function generateContentWithRetryAndFallback(ai: GoogleGenAI, contents: any[]) {
  // gemini-3.1-flash-lite is highly available and fast with minimal demand spikes,
  // backed by gemini-3.8-flash and gemini-flash-latest
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err);
        const status = err?.status || err?.code;
        const isTransient =
          status === 503 ||
          status === 429 ||
          errStr.includes("503") ||
          errStr.includes("UNAVAILABLE") ||
          errStr.includes("high demand") ||
          errStr.includes("overloaded") ||
          errStr.includes("RESOURCE_EXHAUSTED");

        console.warn(`Gemini call [Model: ${model}, Attempt: ${attempt}/2]: ${errStr.slice(0, 120)}`);

        // If non-transient auth/bad-request error, fail immediately
        if (errStr.includes("API key") || errStr.includes("API_KEY_INVALID") || status === 400 || status === 401) {
          throw err;
        }

        if (isTransient && attempt < 2) {
          await delay(500);
          continue;
        }
        // Move to next candidate model in fallback list
        break;
      }
    }
  }

  throw lastError;
}

// API Endpoint for secure Server-Side Gemini Analysis
app.post("/api/analyze", async (req, res) => {
  try {
    const { image, mimeType, customKey, targetStyle, targetFocus, customAttire } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: "Missing image parameters" });
    }

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const ai = getGeminiClient(customKey);

    let promptInstruction = `
      TASK: Perform an ultra-high-end Graphic Design, Camera, and Visual Reproduction Analysis based on the user's explicit instructions.
      
      Analyze the provided reference image and extract its complete visual DNA for an exact master reproduction. You MUST strictly obey all of the user's mandatory rules:

      USER'S MANDATORY CONSTITUTION & REPLICATION RULES (ব্যবহারকারীর কঠোর নিয়মাবলী):

      1. HYPER-REALISTIC BACKGROUND ARCHITECTURE (একদম বাস্তবসম্মত নিখুঁত ব্যাকগ্রাউন্ড):
         - The background MUST be rendered and described with complete physical realism ("একদম রিয়েলিস্টিক")—never vague, synthetic, or generic.
         - Detail the exact real-world environment and depth planes:
           * Street scenes: multi-story buildings, architectural balconies, visible street electrical cables overhead, realistic storefront signboards, neon glows, asphalt road texture, streetlights receding into atmospheric distance.
           * Temple / Puja mandap / Pandal: ornate carved pillars, architectural arches, hand-sculpted clay Durga idols with intricate ornamentation, floral garlands, brass lamps, chandeliers, natural wear on white marble/stone stairs.
           * Natural / Graphic environments: realistic terrain, tree lines, clouds, physical props (e.g. wooden crates, chains, falling leaves).
         - Detail how light and shadow physically interact with the background (cast shadows on stairs/road, surface reflections, atmospheric perspective).

      2. PRECISE LIGHT ORIGIN & TRAJECTORY (আলো কোথা থেকে আসছে এবং কোথায় যাচ্ছে - Light Path & Vector):
         - Meticulously analyze and explicitly document the LIGHT TRAJECTORY for every light source:
           * WHERE IT ORIGINATES (From where): e.g., "overhead festoon light string hung 2.5 meters above and slightly in front", "golden chandeliers positioned directly behind the subjects on the temple ceiling", "low-angle natural sun from the camera-left horizon at 45 degrees".
           * HOW IT TRAVELS (Direction & Angle): e.g., "traveling diagonally downward across the subjects' faces", "streaming forward directly towards the camera lens creating an intense backlight rim halo", "bouncing upward off reflective marble steps".
           * WHERE IT HITS & CASTS SHADOWS (To where / Impact Zone): e.g., "illuminates foreheads, noses, and shoulders; casts soft elongated shadows backward onto the steps; creates sharp specular catchlights in the eyes".

      3. EXACT CAMERA ANGLE, ELEVATION & GEOMETRY (ক্যামেরা অ্যাঙ্গেল ও ক্যামেরা পজিশন):
         - Explicitly define the camera's spatial placement:
           * Camera elevation/height: e.g. "positioned at knee-height (low-angle looking up the stairs at a 20-degree upward tilt)", "chest-level eye-line perspective", "waist-height level shot".
           * Perspective & lens geometry: focal length (e.g. 85mm portrait compression separating subjects from background, or 35mm wide-angle capturing full environmental architecture).
           * Camera roll/tilt: perfectly level horizon, slight Dutch tilt, or cinematic framing.

      4. DETAILED CHARACTER POSITIONS & MUTUAL INTERACTION (ক্যারেক্টারগুলো কীভাবে আছে - Positions, Stance & Interaction):
         - Meticulously map out the exact placement and interaction of all characters:
           * Relative spatial coordinates: who is on the left, who is on the right, distance between them, seating tiers (e.g. "seated side-by-side on the third marble step", "standing closely together under overhead street lights").
           * Physical posture & gestures: body orientation (facing forward, turned 45 degrees towards each other), torso tilt, shoulder alignment, arm and hand positions (e.g. "male subject's right arm extended gently cupping the female subject's cheek", "female subject seated with hands resting gracefully on her lap", "couple exchanging a candid romantic glance with subtle smiles").
           * Mutual gaze & head tilt: exact head tilt angles, eye contact line.

      5. CLOTHING SPECIFICATION (পোশাকের উল্লেখ থাকবে কিন্তু ব্যবহারকারীর ইচ্ছামতো পোশাক হবে):
         ${customAttire ? `
         - USER'S SPECIFIED CUSTOM ATTIRE (ব্যবহারকারীর নির্বাচিত নির্দিষ্ট পোশাক): The user has explicitly commanded: "${customAttire}".
         - YOU MUST EXPLICITLY MENTION, STYLIZE, AND INTEGRATE THIS EXACT CHOSEN CLOTHING in the character descriptions, ATTIRE section, and the master PROMPT ("পোশাকের উল্লেখিত থাকবে কিন্তু আমি যেই পোশাকটা চাই সেই পোশাকটা থাকবে")!
         - Describe the fabric texture, colors, embroidery, drapery folds, and how the scene's lighting interacts with it (e.g. how chandeliers or festoon lights highlight the fabric sheen and weave).
         - Completely replace whatever clothes were in the original reference photo with THIS user-chosen attire!
         ` : `
         - ATTIRE INTEGRATION (পোশাকের বিবরণ থাকবে): Clothing MUST be mentioned and styled in the analysis and master prompt ("পোশাকের উল্লেখিত থাকবে"). Describe a high-end, elegant attire specification harmonized with the scene (e.g. traditional festive attire matching the Durga Puja pandal ambiance, or modern chic aesthetic matching the street night vibe), detailing fabric drape, color coordination with the ambient lighting, and texture, without copying unwanted specific outfits from the reference photo.
         `}

      6. STRICTLY NO HEAD HAIR (মাথার চুল কপি করবে না):
         - Meticulously AVOID analyzing, describing, mentioning, or copying ANY hair, hairstyles, haircuts, hair length, hair color, or hair textures.
         - Completely omit all hair descriptors in all sections and in the master PROMPT.

      7. NO FACIAL IDENTITY (মুখের বিবরণ থাকবে না):
         - Meticulously avoid describing specific individual facial features, facial identity, eye colors, nose details, beard, mustache, or glasses.

      8. DSLR CAMERA SPECIFICATIONS & DEPTH (কত ডিএসএলআর এর মত থাকবে & ক্যামেরা উল্লেখিত থাকবে):
         - Professional DSLR / mirrorless camera aesthetic (sensor size look, sharpness, optical glass character).
         - Lens focal length & aperture (e.g., 85mm f/1.4 portrait prime, 50mm f/1.8, 35mm f/1.4 wide, or telephoto compression).
         - Detailed blur mapping: exactly WHERE foreground/background blur and creamy circular bokeh discs occur.

      9. KEYPAD / GRID COMPOSITION SYSTEM (যে ফটোতে যেই কিপ্যাডার সিস্টেম করা থাকবে সেই ফটোতে সেরকম সিস্টেম থাকবে):
         - Map out the exact 3x3 Keypad / dial composition grid (Top-Left [1], Top-Center [2], Top-Right [3], Center-Left [4], Center [5], Center-Right [6], Bottom-Left [7], Bottom-Center [8], Bottom-Right [9]).
         - Detail where each character and visual anchor is positioned within this keypad system.
         - Replicate the exact aspect ratio (1:1, 4:5, 9:16, 16:9), framing boundaries, safe margins, horizon line, and visual balance.

      10. GRAPHICS & TEXTURE GRINDING DETAILS (আর যদি গ্রাফিক্স ফোটো গ্রাফিক্সের ফটো সেগুলো ডিটেইল থাকবে কোথায় কোথায় বেশি গ্রাইন্ডিং করা আছে কোথায় কোথায় করা হয়েছে সবকিছুই কপি করবে):
          * If the image is a graphic design, poster, digital art, or stylized illustration:
            - Analyze in exhaustive detail where heavy texture grinding (গ্রাইন্ডিং), film grain, grunge distressing, noise, halftone dots, or brushwork textures are applied, and where surfaces remain clean/smooth.
            - Detail all background micro-elements, floating design chips (like falling leaves, chain links, birds), geometric vector frames, badges, particles, typography overlays, and composite layers.
          * If clean photography with no graphics or text, specify 'none'.

      11. CARTOON TO REALISTIC HUMAN CONVERSION:
          * If the uploaded reference is a cartoon, sketch, anime, or 3D illustration, the master prompt (PROMPT) MUST explicitly instruct the generator to produce a "realistic, life-like human being in a modern real-world professional DSLR photography style", preserving the exact target camera angle, layout, pose, blur mapping, authentic lighting effects, and background graphics.
    `;

    if (targetStyle || targetFocus) {
      promptInstruction += `
      
      GOOGLE FORMS STYLE INSPIRATION (গুগল ফর্ম অনুরোধ):
      The user submitted a specific custom design inquiry for this image. Meticulously merge and adapt this analysis to match these requirements:
      ${targetStyle ? `- Target Art Style/Era Accent: "${targetStyle}"` : ''}
      ${targetFocus ? `- Thematic Focus/Sub-components: "${targetFocus}"` : ''}
      
      Please modify and blend the PHOTO_STYLE, EFFECTS, COLOR, and final PROMPT to perfectly reflect this art style and focal details while keeping the exact pose, body stance, camera angle, blur mapping, lighting effects, and keypad layout from the reference image.
      `;
    }

    promptInstruction += `

      Return the analysis ONLY in the following exact multi-line format with these exact prefixes:

      LAYOUT_POSITION: [Describe the characters' exact spatial coordinates, relative placement (e.g. couple interaction, seated on stairs / standing close, arm/hand gestures, eye contact line, head tilt), exact camera angle (elevation/height, tilt), and 3x3 keypad grid coordinates. STRICTLY NO hair mentions.]
      ATTIRE: [Describe the character(s)' specified clothing and styling in detail—fabric type, colors, embroidery, drapery, and lighting interaction.]
      PHOTO_STYLE: [Professional DSLR/Optical camera fidelity: sensor format (35mm full-frame), prime lens model & focal length, aperture f-stop, camera elevation/distance, and detailed BLUR MAPPING (foreground/background blur, authentic circular bokeh discs). STRICTLY zero plastic AI skin, zero head hair.]
      COMPOSITION: [Hyper-Realistic Background Architecture & Environment: exhaustively detail the real-world physical surroundings (street architecture, buildings, overhead cables, temple pillars, carved stairs, idol backdrop, depth planes), plus 3x3 keypad composition grid, aspect ratio, and framing balance.]
      EFFECTS: [Precise Light Origin, Trajectory & Hit Zones: detail WHERE light originates (e.g. overhead festoons, rear chandeliers, low-angle sun), WHICH PATH it travels (direction, angle), and EXACTLY WHERE it hits (highlights, catchlights) and casts shadows, with color temperature in Kelvin.]
      COLOR: [Color grading, tone curves, contrast, color temperature, palette accents, and saturation levels.]
      TYPOGRAPHY: [Graphic art details, texture grinding mapping (where heavy grinding/grain/grunge/halftone is applied vs clean areas), floating vector chips, typography, and badges. If clean photo with no graphics/text, specify 'none'.]
      FINAL_LOOK: [Comprehensive visual summary copying all visual DNA, hyper-realistic background architecture, light trajectory, camera angle, specified attire, and character interactions, strictly excluding hair.]
      PROMPT: [Single master professional AI image generation prompt combining: high-end DSLR camera specs & lens (e.g. Sony A7R V with 85mm f/1.4 GM lens, knee-height low angle), exact character positions & physical gestures/interaction, the specified clothing/attire, hyper-realistic real-world background architecture, precise light trajectory (where light originates, travels, and hits), blur & bokeh zones, keypad grid composition, and graphic grinding/textures. ZERO generic AI slop, and ZERO mention of head hair.]
    `;

    const response = await generateContentWithRetryAndFallback(ai, [
      { text: promptInstruction },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      }
    ]);

    const text = response.text || '';
    const parsedResult = parseResponse(text);

    return res.json(parsedResult);
  } catch (err: any) {
    console.error("Gemini server error after retries:", err);
    const errMessage = err?.message || String(err);
    if (err.status === 429 || errMessage.includes("RESOURCE_EXHAUSTED")) {
      return res.status(429).json({ error: "QUOTA_EXCEEDED" });
    }
    if (errMessage.includes("API key") || errMessage.includes("API_KEY_INVALID")) {
      return res.status(401).json({ error: "API_KEY_INVALID" });
    }
    if (err.status === 503 || errMessage.includes("503") || errMessage.includes("UNAVAILABLE") || errMessage.includes("high demand")) {
      return res.status(503).json({ error: "SERVICE_BUSY", message: "The AI service is currently experiencing high demand. Please try again in a moment." });
    }
    return res.status(500).json({ error: errMessage || "An unexpected error occurred" });
  }
});

// Vite Middleware & Static Fallbacks
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production static server mounted");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server live on http://0.0.0.0:${PORT}`);
  });
}

startServer();
