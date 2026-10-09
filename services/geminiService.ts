import { AnalysisResult } from "../types";
import { analyzeWithMultiApi } from "./visionAnalyzer";

export const analyzeImage = async (
  base64Image: string,
  mimeType: string,
  options: { fastMode?: boolean; customAttire?: string; customHeadline?: string } = {}
): Promise<AnalysisResult> => {
  return analyzeWithMultiApi(base64Image, mimeType, options);
};
