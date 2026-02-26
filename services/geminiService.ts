// All Gemini API calls are handled server-side in server/index.js.
// The frontend communicates only with the /api/analyze endpoint.
import { AnalysisResponse } from "../types";

export type AnalysisInput =
  | { type: 'audio'; data: string; mimeType: string }
  | { type: 'text'; text: string };

export const analyzeConsultation = async (input: AnalysisInput): Promise<AnalysisResponse> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json() as Promise<AnalysisResponse>;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data url prefix (e.g., "data:audio/mp3;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};