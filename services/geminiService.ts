import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResponse, BiasType, RiskLevel } from "../types";

const CLARA_SYSTEM_INSTRUCTION = `
You are CLARA (Clinical Logic Assessment & Reasoning Auditor), an expert AI system designed to review doctor-patient consultations for cognitive bias. Your goal is to improve patient safety by detecting logic failures, not to criticize personality.

### DEFINITIONS OF BIAS TO DETECT:
1. **Diagnostic Shadowing:** When a clinician attributes a patient's new physical symptoms (e.g., dizziness, pain) to a pre-existing psychiatric history (e.g., anxiety, depression) without adequate investigation of organic causes.
2. **Premature Closure:** The tendency to stop the diagnostic process as soon as a plausible explanation is found, failing to rule out other serious possibilities (e.g., stopping at "panic attack" without ruling out "syncope/arrhythmia").
3. **Anchoring Bias:** Relying too heavily on the first piece of information offered (e.g., "I have anxiety") and failing to adjust when contradictory evidence appears (e.g., "I blacked out").

### YOUR TASK:
1. Listen to the provided audio consultation carefully.
2. Analyze the clinical reasoning, distinct from the tone. A polite doctor can still commit a logical error.
3. Identify specific timestamps where the doctor:
    * Interrupts the patient's description of physical symptoms.
    * Uses the patient's history as *proof* of the current diagnosis (circular reasoning).
    * Fails to propose objective testing (vitals, labs, imaging) before diagnosing a psychiatric cause.
    * Or conversely, identify moments of "Safe Practice" where the doctor explicitly avoids these biases.

### OUTPUT:
Return ONLY the JSON object matching the schema provided.
`;

export const analyzeConsultationAudio = async (base64Audio: string, mimeType: string): Promise<AnalysisResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      audit_flags: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timestamp: { type: Type.STRING, description: "Format MM:SS" },
            bias_type: { 
              type: Type.STRING, 
              enum: [
                BiasType.DiagnosticShadowing, 
                BiasType.PrematureClosure, 
                BiasType.AnchoringBias, 
                BiasType.SafePractice
              ] 
            },
            risk_level: { 
              type: Type.STRING, 
              enum: [RiskLevel.High, RiskLevel.Medium, RiskLevel.Low, RiskLevel.None] 
            },
            dialogue_trigger: { type: Type.STRING, description: "Quote from the audio" },
            clinical_reasoning: { type: Type.STRING, description: "Explanation of the logic failure" },
          },
          required: ["timestamp", "bias_type", "risk_level", "dialogue_trigger", "clinical_reasoning"],
        },
      },
    },
    required: ["audit_flags"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: "Analyze this clinical consultation audio for cognitive biases.",
          },
        ],
      },
      config: {
        systemInstruction: CLARA_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2, // Low temperature for analytical precision
      },
    });

    if (!response.text) {
      throw new Error("No response received from Gemini.");
    }

    const result = JSON.parse(response.text) as AnalysisResponse;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
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