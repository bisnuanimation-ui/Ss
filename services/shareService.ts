import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AnalysisResult } from '../types';

export interface SharedDataPayload {
  shareId: string;
  result: AnalysisResult;
  imageUrl?: string;
  createdAt: number;
}

export const generateShareLink = async (
  result: AnalysisResult,
  imageUrl?: string | null
): Promise<{ shareUrl: string; shareId: string }> => {
  const shareId = `pv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const baseUrl = window.location.origin + window.location.pathname;

  try {
    // 1. Try to persist to Firestore public collection
    const shareRef = doc(db, 'sharedAnalyses', shareId);
    await setDoc(shareRef, {
      masterPrompt: result.masterPrompt.slice(0, 9500),
      shortPrompt: result.shortPrompt.slice(0, 2900),
      graphicDesignDetails: JSON.stringify(result.graphicDesign || {}).slice(0, 4900),
      createdAt: Date.now(),
      payload: JSON.stringify({
        result,
        imageUrl: imageUrl ? imageUrl.slice(0, 150000) : undefined, // Truncate huge thumbs to fit document size
      }),
    });

    const shareUrl = `${baseUrl}?share=${shareId}`;
    return { shareUrl, shareId };
  } catch (err) {
    console.warn('Firestore share fallback to direct encoded link:', err);
    // 2. Safe URL encoding fallback
    const compact = {
      p: result.masterPrompt,
      s: result.shortPrompt,
      mj: result.midjourneyPrompt,
      art: result.artStyle,
      lt: result.lightTrajectory,
      gd: result.graphicDesign,
    };
    const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(compact)))));
    const shareUrl = `${baseUrl}?share_data=${encoded}`;
    return { shareUrl, shareId: 'offline' };
  }
};

export const loadSharedAnalysis = async (
  shareId: string | null,
  shareData: string | null
): Promise<AnalysisResult | null> => {
  if (shareId) {
    try {
      const shareRef = doc(db, 'sharedAnalyses', shareId);
      const snap = await getDoc(shareRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.payload) {
          const parsed = JSON.parse(data.payload);
          return parsed.result as AnalysisResult;
        }
        return {
          masterPrompt: data.masterPrompt || '',
          shortPrompt: data.shortPrompt || '',
          midjourneyPrompt: (data.masterPrompt || '') + ' --ar 16:9 --v 6.1',
          subjectSwapPrompt: data.masterPrompt || '',
          styleTransferPrompt: data.masterPrompt || '',
          subjectAndAttire: 'Shared prompt analysis',
          cameraAndComposition: 'DSLR professional camera specs',
          lightingAndAtmosphere: 'Natural cinematic lighting',
          colorPalette: ['#8b5cf6', '#a855f7', '#6366f1', '#ec4899', '#0f172a'],
          colorDescription: 'Vibrant modern palette',
          artStyle: 'High-end streetwear / editorial',
          negativePrompt: 'blurry, cgi, bad anatomy, low quality',
          suggestedTags: ['streetwear', 'dslr', 'realistic', 'lighting'],
        };
      }
    } catch (err) {
      console.warn('Could not fetch shared doc:', err);
    }
  }

  if (shareData) {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(shareData)))));
      return {
        masterPrompt: decoded.p || '',
        shortPrompt: decoded.s || '',
        midjourneyPrompt: decoded.mj || '',
        subjectSwapPrompt: decoded.p || '',
        styleTransferPrompt: decoded.p || '',
        subjectAndAttire: 'Restored shared prompt',
        cameraAndComposition: 'Precision camera specs',
        lightingAndAtmosphere: 'Authentic lighting',
        colorPalette: ['#8b5cf6', '#a855f7', '#6366f1', '#3b82f6', '#1e1b4b'],
        colorDescription: 'Editorial tone',
        artStyle: decoded.art || 'Graphic & DSLR Photography',
        negativePrompt: 'cgi, fake, plastic, blurry',
        suggestedTags: ['master-prompt', 'dslr', 'share'],
        lightTrajectory: decoded.lt,
        graphicDesign: decoded.gd,
      };
    } catch (err) {
      console.warn('Could not decode share_data:', err);
    }
  }

  return null;
};
