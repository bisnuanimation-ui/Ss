export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'user' | 'admin';
  dailyGenerations?: number;
  lastGenerationDate?: string;
  subscription?: {
    status: 'free' | 'premium';
    expiresAt: number;
    token: string;
  };
}

export type ApiProvider = 'gemini' | 'friendli' | 'openai';

export type KeyStatus = 'active' | 'standby' | 'exhausted' | 'error' | 'testing';

export interface ApiKeyConfig {
  id: string;
  name: string;
  provider: ApiProvider;
  key: string;
  endpoint?: string;
  model?: string;
  status: KeyStatus;
  lastChecked?: number;
  latencyMs?: number;
  errorMessage?: string;
  usageCount: number;
  isSystem?: boolean;
}

export interface LightTrajectory {
  origin: string; // কোথা থেকে আলো আসছে (e.g. Overhead festoons, rear softbox, golden sun at 45°)
  path: string;   // কোন দিকে যাচ্ছে (Angle, directional vector, bounce)
  impact: string; // কোথায় আলো পড়ছে এবং ছায়া ফেলছে (Highlights, catchlights, shadow placement)
}

export interface TextureGrindingDetail {
  heavyGrindingZones: string; // কোথায় কোথায় বেশি গ্রাইন্ডিং/গ্রাঞ্জ/নয়েজ করা হয়েছে
  smoothZones: string;        // কোথায় মসৃণ বা ক্লিন সারফেস
  textureType: string;        // Film grain, halftone dots, distressed print, vintage wash
}

export interface GraphicDesignBreakdown {
  isGraphicDesign: boolean;
  elementOrigin: string; // উপাদানগুলো কোথা থেকে এসেছে (Vector shapes, badges, typography hierarchy)
  textureGrinding: TextureGrindingDetail;
  typographyStyle: string; // ফন্ট স্টাইল ও ব্যাজ টেক্সট
  gridPlacement: string;  // 3x3 কিপ্যাড গ্রিড অনুযায়ী উপাদানসমূহ
}

export interface GraphicCustomization {
  customHeadline?: string;
  customPalette?: string;
  customAttire?: string;
  customBackground?: string;
  customGrinding?: 'none' | 'subtle' | 'heavy' | 'vintage';
  modifiedMasterPrompt?: string;
}

export interface AnalysisResult {
  masterPrompt: string;
  shortPrompt: string;
  midjourneyPrompt: string;
  subjectSwapPrompt: string;
  styleTransferPrompt: string;
  subjectAndAttire: string;
  cameraAndComposition: string;
  lightingAndAtmosphere: string;
  colorPalette: string[];
  colorDescription: string;
  artStyle: string;
  negativePrompt: string;
  suggestedTags: string[];
  // Advanced Graphic & Optical Deep DNA
  lightTrajectory?: LightTrajectory;
  graphicDesign?: GraphicDesignBreakdown;
  customization?: GraphicCustomization;
  aspectRatioHint?: string;
  usedProvider?: string;
  generationDurationMs?: number;
}

export interface SavedAnalysis {
  id: string;
  timestamp: number;
  imageThumbnail: string;
  result: AnalysisResult;
  shareId?: string;
}

export interface AppState {
  image: string | null;
  imageMimeType: string | null;
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
  activeProviderName?: string;
}
