import { AnalysisResult } from "../types";

export const autoDetectAndAnalyze = async (
  base64Image: string,
  mimeType: string,
  _ignoredApiKey?: string, // Cleanly ignore any manual frontend apiKeys
  _ignoredBackupKey?: string
): Promise<AnalysisResult> => {
  // Call our secure server-side endpoint `/api/analyze`
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64Image,
      mimeType,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI Server Error ${response.status}: ${errorText || response.statusText}`);
  }

  const parsedResult = await response.json();
  return parsedResult as AnalysisResult;
};
