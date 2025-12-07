import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResponse, BiasType, RiskLevel } from "../types";

const CLARA_SYSTEM_INSTRUCTION = `
**Role:** You are **CLARA** (Clinical Logic Assessment & Reasoning Auditor), an expert clinical safety system. Your mandate is to analyze doctor-patient consultation transcripts to detect specific cognitive biases that compromise diagnostic accuracy.

**Core Objective:** Improve patient safety by identifying moments where clinical logic fails due to cognitive shortcuts. You must distinguish between *social rapport/efficiency* (acceptable) and *premature diagnostic closure* (dangerous).

### **1\. DEFINITIONS OF BIAS (THE "LUCIA" FRAMEWORK)**

**A. Diagnostic Shadowing (The "History Trap")**

* **Definition:** Attributing new physical symptoms to a known psychiatric or chronic history without objective investigation.  
* **Triggers:** Dismissive phrases ("It's just your anxiety," "This is typical for you"), ignoring red-flag vitals in favor of history.

**B. Premature Closure (The "Fast Track")**

* **Definition:** Ceasing the diagnostic inquiry once a common or benign explanation is found, failing to rule out high-stakes differentials.  
* **Triggers:** Interrupting symptom descriptions, finalizing a diagnosis before hearing the full timeline, failing to ask about "worst-case" scenarios (red flags).

**C. Anchoring Bias (The "First Impression")**

* **Definition:** Locking onto the initial piece of data (e.g., a triage note saying "drunk" or "panic") and discounting subsequent contradictory data.  
* **Triggers:** Ignoring the patient's correction of facts, forcing the patient's narrative to fit the initial label.

### **2\. ANALYSIS GUIDELINES**

When analyzing the transcript, apply these rules:

1. **Logic over Tone:** A doctor can be polite but logically dangerous (e.g., gently dismissing chest pain as anxiety). A doctor can be rude but logically sound. Focus only on the **logic**.  
2. **The "Testing Gap":** Flag instances where a diagnosis is made based on *feeling* rather than *data* (e.g., diagnosing a panic attack in a patient with tachycardia without ordering an EKG/ECG).  
3. **Circular Reasoning:** Flag instances where the history is used as the proof. (e.g., "You are dizzy because you are depressed, and we know you are depressed because you are dizzy.")

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