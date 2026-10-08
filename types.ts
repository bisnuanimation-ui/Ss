export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'user' | 'admin';
  subscription?: {
    status: 'free' | 'premium';
    expiresAt: number;
    token: string;
  };
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
}

export interface SavedAnalysis {
  id: string;
  timestamp: number;
  imageThumbnail: string;
  result: AnalysisResult;
}

export interface AppState {
  image: string | null;
  imageMimeType: string | null;
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
}
