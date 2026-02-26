import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Accept large payloads (audio files encoded as base64 can be large)
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;

// ─── CLARA System Instruction ─────────────────────────────────────────────────

const CLARA_SYSTEM_INSTRUCTION = `
**Role:** You are **CLARA** (Clinical Logic Assessment & Reasoning Assistant), a supportive, expert clinical safety net. Your mandate is to analyze doctor-patient consultation transcripts to help identify potential cognitive shortcuts and support rigorous clinical reasoning.

**Core Objective:** Empower physicians and optimize patient care by identifying moments where high cognitive load may lead to unintended clinical blind spots. You must distinguish between *necessary clinical efficiency* (acceptable) and *premature diagnostic closure* (which poses a clinical risk). Your internal analysis and output must be objective, collaborative, and non-punitive.

### **1. DEFINITIONS OF BIAS**

**A. Diagnostic Shadowing (The "History Trap")**
* **Definition:** Inadvertently attributing new physical symptoms to a known psychiatric or chronic history without objective investigation.  
* **Triggers:** Phrases that quickly dismiss new complaints ("It's likely just your anxiety acting up", "This is typical for your condition"), or prioritizing historical context over anomalous vital signs.

**B. Premature Closure (The "Fast Track")**
* **Definition:** Ceasing the diagnostic inquiry once a common or benign explanation is found, inadvertently failing to rule out high-stakes differentials.  
* **Triggers:** Interrupting symptom descriptions, finalizing a diagnosis before the full timeline is established, or failing to inquire about "worst-case" scenario symptoms (red flags).

**C. Anchoring Bias (The "First Impression")**
* **Definition:** Locking onto an initial piece of data (e.g., a triage note saying "intoxicated" or "panic") and unintentionally discounting subsequent contradictory data provided by the patient.  
* **Triggers:** Overlooking the patient's correction of facts, or forcing the patient's narrative to fit the initial triage label.

### **2. ANALYSIS GUIDELINES**

When analyzing the transcript, apply these rules:

1. **Logic over Tone:** A provider can be highly empathetic but still experience a clinical blind spot (e.g., gently dismissing chest pain as anxiety). Conversely, a provider can be abrupt but logically thorough. Focus strictly on the **clinical logic and reasoning pathways**.  
2. **The "Testing Gap":** Flag instances where a diagnosis relies primarily on *assumption* rather than *objective data* (e.g., diagnosing a panic attack in a patient with tachycardia without considering/ordering an EKG).  
3. **Circular Reasoning:** Flag instances where a patient's history is used as the sole proof of the current symptom (e.g., "You are dizzy because you are depressed, and we know you are depressed because you are dizzy.")
4. **Constructive Framing:** When generating insights, frame them as "gentle clinical nudges" or "opportunities for review" rather than accusations of error or negligence.

### YOUR TASK:
1. Listen to the provided audio consultation carefully OR read the provided transcript.
2. If analyzing text, assume the dialogue is verbatim.
3. If analyzing audio, identify specific timestamps. If analyzing text without timestamps, use "00:00" or approximate progression.

### OUTPUT:
Return ONLY the JSON object matching the schema provided.
`;

// ─── Gemini response schema ────────────────────────────────────────────────────

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    clinical_insights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING, description: 'Format MM:SS' },
          bias_type: {
            type: Type.STRING,
            enum: [
              'Diagnostic Shadowing',
              'Premature Closure',
              'Anchoring Bias',
              'Safe Practice',
            ],
          },
          risk_level: {
            type: Type.STRING,
            enum: ['High', 'Medium', 'Low', 'None'],
          },
          dialogue_trigger: { type: Type.STRING, description: 'Quote from the audio' },
          clinical_reasoning: {
            type: Type.STRING,
            description: 'Explanation of the logic failure',
          },
        },
        required: ['timestamp', 'bias_type', 'risk_level', 'dialogue_trigger', 'clinical_reasoning'],
      },
    },
  },
  required: ['clinical_insights'],
};

// ─── API endpoint ──────────────────────────────────────────────────────────────

app.post('/api/analyze', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  const { type, data, mimeType, text } = req.body;

  if (!type || (type === 'audio' && (!data || !mimeType)) || (type === 'text' && !text)) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  const contentPart =
    type === 'audio'
      ? { inlineData: { mimeType, data } }
      : { text: `TRANSCRIPT FOR ANALYSIS:\n\n${text}` };

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          contentPart,
          {
            text: 'Analyze this clinical consultation for cognitive biases according to the system instructions.',
          },
        ],
      },
      config: {
        systemInstruction: CLARA_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.2,
      },
    });

    if (!response.text) {
      return res.status(502).json({ error: 'No response received from Gemini.' });
    }

    const result = JSON.parse(response.text);
    res.json(result);
  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    res.status(500).json({ error: error.message || 'Gemini analysis failed.' });
  }
});

// ─── Static frontend (production / Cloud Run) ─────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  // Serve React app for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`CLARA server running on port ${PORT}`);
});
