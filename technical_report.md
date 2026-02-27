# CLARA — Technical Report

**Document Version:** 1.0  
**Date:** 2026-02-27  
**Project:** CLARA (Clinical Logic Assessment & Reasoning Assistant)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Frontend Application](#4-frontend-application)
5. [Backend Server](#5-backend-server)
6. [AI / LLM Integration](#6-ai--llm-integration)
7. [Type System & Data Model](#7-type-system--data-model)
8. [Build, Tooling & DevOps](#8-build-tooling--devops)
9. [Security Considerations](#9-security-considerations)
10. [Data Flow & Sequence of Operations](#10-data-flow--sequence-of-operations)
11. [UX & UI Design](#11-ux--ui-design)
12. [Strengths](#12-strengths)
13. [Weaknesses & Recommendations](#13-weaknesses--recommendations)
14. [Appendix — File Inventory](#14-appendix--file-inventory)

---

## 1. Executive Summary

CLARA is a web-based clinical decision-support tool that uses Google's **Gemini 3 Pro** large language model to analyze doctor–patient consultations for cognitive biases that can compromise patient safety. It targets three specific bias categories grounded in Dual Process Theory: **Diagnostic Shadowing**, **Premature Closure**, and **Anchoring Bias**.

The application accepts two input modalities:

- **Audio files** — uploaded MP3/WAV/AAC recordings (≤ 10 MB), base64-encoded on the client and forwarded to Gemini via a server-side proxy.
- **Text transcripts** — pre-loaded sample case studies shipped with the frontend.

Gemini returns structured JSON ("Clinical Insights"), which the frontend visualizes as a risk dashboard with per-event audit cards and a risk-distribution pie chart.

---

## 2. System Architecture

CLARA follows a **two-tier client–server architecture** with a thin Express relay between the React SPA and the external Gemini API.

```
┌──────────────┐         ┌──────────────────┐         ┌─────────────────┐
│              │  POST   │                  │  REST   │                 │
│  React SPA   │───────▶│  Express Server   │───────▶│  Gemini 3 Pro   │
│  (Vite)      │ /api/  │  (Node 20)       │         │  (Google AI)    │
│  Port 3000   │◀───────│  Port 3001       │◀───────│                 │
│              │  JSON   │                  │  JSON   │                 │
└──────────────┘         └──────────────────┘         └─────────────────┘
```

### Development Mode

- **Vite dev server** runs on port `3000`, serving the React SPA with HMR.
- **Express server** runs on port `3001`.
- Vite's `proxy` configuration forwards all `/api/*` requests to the Express server, providing a seamless single-origin development experience.
- Both processes are launched concurrently via `npm run dev` using the `concurrently` package.

### Production Mode

- Vite builds static assets into `dist/`.
- Express serves `dist/` as static files and handles API routes.
- A single `node server/index.js` process serves both frontend and backend on one port (default `8080`).
- Packaged in a multi-stage Docker image for deployment on Google Cloud Run.

---

## 3. Technology Stack

| Layer        | Technology                         | Version     |
| ------------ | ---------------------------------- | ----------- |
| Runtime      | Node.js                            | 20 (slim)   |
| Language     | TypeScript (frontend), JavaScript (server) | TS ~5.8 |
| UI Framework | React                              | ^19.2.1     |
| Bundler      | Vite                               | ^6.2.0      |
| Styling      | Tailwind CSS (CDN runtime)         | latest      |
| Icons        | lucide-react                       | ^0.556.0    |
| Charts       | Recharts                           | ^3.5.1      |
| HTTP Server  | Express                            | ^4.21.0     |
| AI SDK       | @google/genai                      | ^1.31.0     |
| Env Config   | dotenv                             | ^16.4.0     |
| Dev Toolkit  | concurrently                       | ^9.0.0      |
| Container    | Docker (multi-stage, node:20-slim) | —           |
| Deployment   | Google Cloud Run                   | managed     |

---

## 4. Frontend Application

### 4.1 Entry Point (`index.tsx`)

Standard React 19 bootstrap using `createRoot`. Mounts `<App />` inside `<React.StrictMode>` on the `#root` DOM node.

### 4.2 Root Component (`App.tsx` — 357 lines)

The entire application state is managed in a single `useState<AnalysisState>` hook within `App.tsx`. The component acts as both **state machine controller** and **page router** by conditionally rendering different UI sections based on `state.status`:

| Status        | Rendered View                                     |
| ------------- | ------------------------------------------------- |
| `idle`        | Landing page — file upload zone, sample cases, bias explainer cards |
| `uploading`   | Full-screen spinner with "Uploading Data Stream" label |
| `processing`  | Full-screen spinner with "Analyzing Clinical Logic" label |
| `complete`    | Results dashboard — alert banner, transcript viewer, audit cards list, risk chart sidebar |
| `error`       | Error card with message and reset button          |

**Key behaviors:**

- **File upload path:** `handleFileSelect` enforces a 10 MB limit, creates an `objectURL` for audio playback, converts the file to base64 via `fileToBase64()`, calls `analyzeConsultation()`.
- **Sample case path:** `handleSampleSelect` passes the hardcoded transcript text directly.
- **Reset:** Revokes any active `objectURL` and resets state to `idle`.
- Two sample cases are embedded inline: *"The Anxiety Label"* (contains bias) and *"Safety First"* (safe practice).

### 4.3 Components

#### `FileUpload.tsx`
A styled drag-area with a hidden `<input type="file" accept="audio/*">`. Uses a ref to trigger the native file picker on click. Purely presentational with callbacks for file selection. Supports disabled state while processing.

#### `AuditCard.tsx`
Renders a single `AuditFlag` item. Uses a color-coded left border and dynamic icon based on `RiskLevel`. Displays the timestamp, bias type badge, quoted dialogue trigger, and clinical reasoning. Styling is mapped via switch statements over the `RiskLevel` and `BiasType` enums.

#### `RiskChart.tsx`
Wraps a Recharts `<PieChart>` (donut variant with `innerRadius`). Aggregates flags by risk level into four color-coded slices. Displays total event count below the chart.

### 4.4 Service Layer (`services/geminiService.ts`)

A thin HTTP client that:

1. Sends a `POST /api/analyze` request containing either `{ type: 'audio', data, mimeType }` or `{ type: 'text', text }`.
2. Parses the JSON response as `AnalysisResponse`.
3. Exports `fileToBase64()` — reads a `File` via `FileReader`, strips the data-URL prefix, and returns the raw base64 string.

No direct Gemini SDK usage exists on the client — all LLM calls are proxied through the server.

---

## 5. Backend Server

### `server/index.js` (single file, ~150 lines, plain JavaScript)

#### 5.1 Configuration

- Loads environment variables via `dotenv`.
- Configures Express with `express.json({ limit: '15mb' })` to accommodate base64-encoded audio payloads.
- Default port: `3001` (dev) / `8080` (production, via `PORT` env var).

#### 5.2 API Endpoint — `POST /api/analyze`

1. **Validation:** Checks for `GEMINI_API_KEY` env var; validates request body structure based on `type` field.
2. **Content construction:** Builds a `contentPart` — either `inlineData` (base64 audio with MIME type) or `text` (prefixed transcript).
3. **Gemini invocation:** Instantiates `GoogleGenAI` per request, calls `ai.models.generateContent()` with:
   - Model: `gemini-3-pro-preview`
   - System instruction: `CLARA_SYSTEM_INSTRUCTION` (detailed clinical bias analysis prompt)
   - Response MIME type: `application/json`
   - Response schema: structured `responseSchema` enforcing the `AuditFlag` shape
   - Temperature: `0.2` (low creativity, high determinism)
4. **Response:** Parses JSON from `response.text` and forwards to the client.
5. **Error handling:** Catches exceptions and returns 500 with the error message.

#### 5.3 Static File Serving

In production (`NODE_ENV=production`), Express serves the built Vite assets from `dist/` and falls back all non-API routes to `index.html` for client-side routing.

---

## 6. AI / LLM Integration

### 6.1 Model

- **Model identifier:** `gemini-3-pro-preview`
- **SDK:** `@google/genai` v1.31+ (Google's official JavaScript SDK for Gemini)

### 6.2 System Prompt

The `CLARA_SYSTEM_INSTRUCTION` (~2,000 tokens) is a carefully crafted clinical analysis prompt that:

1. **Defines the role:** CLARA as a supportive, non-punitive clinical safety net.
2. **Specifies three bias types** with precise definitions and linguistic triggers:
   - Diagnostic Shadowing ("The History Trap")
   - Premature Closure ("The Fast Track")
   - Anchoring Bias ("The First Impression")
3. **Establishes analysis guidelines:**
   - Logic over tone — focus on reasoning pathways, not conversational affect.
   - "Testing Gap" detection — flags assumption-based diagnoses lacking objective investigation.
   - Circular reasoning detection.
   - Constructive framing — outputs must be "gentle clinical nudges," not accusations.
4. **Instructs output format:** JSON matching the provided schema.

### 6.3 Structured Output

Gemini's **structured output** feature is leveraged via `responseMimeType: 'application/json'` and a `responseSchema` using `@google/genai`'s `Type` enum. This forces the model to return a valid JSON object matching:

```json
{
  "clinical_insights": [
    {
      "timestamp": "MM:SS",
      "bias_type": "Diagnostic Shadowing | Premature Closure | Anchoring Bias | Safe Practice",
      "risk_level": "High | Medium | Low | None",
      "dialogue_trigger": "...",
      "clinical_reasoning": "..."
    }
  ]
}
```

### 6.4 Multimodal Input

Audio files are sent as `inlineData` blobs within the Gemini `contents` array, enabling the model to process raw consultation audio directly — not just transcripts. This is a key differentiator: CLARA can analyze tone, pauses, interruptions, and other paralinguistic cues in addition to verbal content.

---

## 7. Type System & Data Model

### `types.ts`

Defines the core domain model via TypeScript enums and interfaces:

| Type              | Kind       | Purpose                                        |
| ----------------- | ---------- | ---------------------------------------------- |
| `BiasType`        | `enum`     | Four categories: Diagnostic Shadowing, Premature Closure, Anchoring Bias, Safe Practice |
| `RiskLevel`       | `enum`     | Four levels: High, Medium, Low, None           |
| `AuditFlag`       | `interface`| Single analysis event with timestamp, bias type, risk level, dialogue trigger, and reasoning |
| `AnalysisResponse`| `interface`| Wrapper containing `clinical_insights: AuditFlag[]` |
| `AnalysisState`   | `interface`| UI state machine: status + optional error, result, fileName, audioUrl, transcript |

The type model is shared between the frontend service layer and the React components, but is **not** consumed by the server (which is plain JavaScript).

---

## 8. Build, Tooling & DevOps

### 8.1 TypeScript Configuration

- **Target:** ES2022
- **Module:** ESNext with `bundler` resolution
- **JSX:** `react-jsx` (automatic runtime)
- **Path aliases:** `@/*` → project root
- **`noEmit: true`** — TypeScript is used only for type checking; Vite/esbuild handles transpilation.

### 8.2 Vite Configuration

- Dev server on port `3000`, bound to `0.0.0.0`.
- Proxy: `/api` → `http://localhost:3001` (Express in dev).
- Plugin: `@vitejs/plugin-react`.
- Path alias: `@` → project root.

### 8.3 Docker

Multi-stage Dockerfile:

1. **Builder stage:** `node:20-slim`, `npm ci`, `npm run build` → produces `dist/`.
2. **Runner stage:** `node:20-slim`, installs production dependencies only (`npm ci --omit=dev`), copies `dist/` and `server/`.
3. Exposes port `8080`, runs `node server/index.js`.

### 8.4 Google Cloud Run Deployment

- **Source deploy:** `gcloud run deploy clara --source .` triggers Cloud Build to build the Docker image and deploy.
- **Environment variable:** `GEMINI_API_KEY` passed via `--set-env-vars` or optionally stored in Secret Manager.
- Unauthenticated access is allowed for the web UI.

### 8.5 Missing Tooling

- No linter (ESLint) configured.
- No formatter (Prettier) configured.
- No test framework or test files (unit, integration, or e2e).
- No CI/CD pipeline definition (GitHub Actions, Cloud Build triggers, etc.).
- No lock file committed (no `package-lock.json` visible in workspace listing).

---

## 9. Security Considerations

### 9.1 API Key Protection

The architecture correctly keeps the `GEMINI_API_KEY` server-side. The React frontend never imports the AI SDK directly — all LLM calls route through `POST /api/analyze` on the Express server. In production, the key can be further secured via Google Cloud Secret Manager.

### 9.2 Input Validation

- The client enforces a 10 MB file size limit before upload.
- The server validates the request body structure (checks `type`, and presence of `data`/`mimeType` or `text`).
- Express body parser is limited to 15 MB (`express.json({ limit: '15mb' })`).

### 9.3 Potential Vulnerabilities

| Risk | Description | Severity |
|------|-------------|----------|
| **No rate limiting** | The `/api/analyze` endpoint has no rate limiting or authentication. Any client can trigger expensive Gemini API calls. | High |
| **No CORS configuration** | Express does not set CORS headers. In production this is fine (same-origin), but there's no explicit restriction. | Low |
| **No input sanitization** | Base64 data and text content are forwarded directly to Gemini without validation for injection or size beyond the body parser limit. | Medium |
| **SDK instantiation per request** | `new GoogleGenAI({ apiKey })` is created on every request rather than once at startup. While not a security issue per se, it's wasteful and could leak resources under load. | Low |
| **Error message leakage** | Raw Gemini API error messages are forwarded to the client (`error.message`), which could expose internal details. | Medium |
| **Tailwind via CDN** | `index.html` loads Tailwind from `cdn.tailwindcss.com` — a third-party CDN dependency in production with no SRI hash. | Medium |
| **No CSP headers** | No Content Security Policy headers are configured on the Express server. | Medium |

---

## 10. Data Flow & Sequence of Operations

### Audio Upload Flow

```
User              React SPA                  Express Server              Gemini API
 │                    │                            │                         │
 │  Select audio file │                            │                         │
 │───────────────────▶│                            │                         │
 │                    │ Validate ≤10MB             │                         │
 │                    │ Create objectURL           │                         │
 │                    │ Convert to base64          │                         │
 │                    │                            │                         │
 │                    │ POST /api/analyze          │                         │
 │                    │ {type,data,mimeType}       │                         │
 │                    │───────────────────────────▶│                         │
 │                    │                            │ Validate body           │
 │                    │                            │ Build content parts     │
 │                    │                            │ generateContent()       │
 │                    │                            │────────────────────────▶│
 │                    │                            │                         │
 │                    │                            │◀────────────────────────│
 │                    │                            │ Parse JSON response     │
 │                    │◀───────────────────────────│                         │
 │                    │ Update state → 'complete'  │                         │
 │  Render dashboard  │                            │                         │
 │◀───────────────────│                            │                         │
```

### Sample Case Flow

Identical to above, except:
- No file validation or base64 encoding.
- `type: 'text'` is sent with the hardcoded transcript.
- No `audioUrl` is produced, so the audio player is hidden in results.

---

## 11. UX & UI Design

### 11.1 Visual Language

- **Dark theme** — deep navy background (`#0B1221`), slate/cyan accent palette.
- **Typography:** Roboto (body) + Roboto Mono (data/labels), loaded from Google Fonts.
- **Component aesthetic:** Glassmorphism (backdrop blur, semi-transparent surfaces), neon glow effects via Tailwind box-shadow utilities, subtle CSS animations for loading states.

### 11.2 Layout

- Sticky header with app branding.
- Single-column layout for idle/loading/error states.
- **3 + 1 grid** (75/25 split) for results: audit cards occupy 3 columns, risk chart occupies 1 column.
- Responsive: collapses to single-column on mobile via `md:` breakpoints.

### 11.3 Key UX Decisions

- **Immediate feedback:** Status transitions (idle → uploading → processing → complete) are reflected with distinct spinner and label states.
- **Color-coded risk:** Red (high), orange (medium), yellow (low), emerald (safe) — used consistently across audit cards, chart, and alert banners.
- **Audio playback:** Uploaded audio can be replayed in the results view (via HTML5 `<audio>` element with inverted styling to match the dark theme).
- **Sample cases:** Two contrasting clinical scenarios are built in, lowering the barrier to first interaction without needing real audio data.

---

## 12. Strengths

1. **Clean separation of concerns** — API key and LLM interaction are fully server-side; the frontend is a pure UI client.
2. **Multimodal capability** — Direct audio analysis through Gemini avoids lossy intermediate transcription.
3. **Structured output enforcement** — Using Gemini's `responseSchema` guarantees a parseable, typed response, eliminating fragile prompt-based JSON extraction.
4. **Low operational complexity** — Single-container deployment, no database, no background jobs, no auth infrastructure.
5. **Clinically grounded prompt** — The system instruction is detailed, evidence-based, and carefully frames output as supportive rather than punitive.
6. **Type safety** — Shared TypeScript enums and interfaces ensure frontend consistency between UI, service, and type layers.
7. **Docker multi-stage build** — Keeps production images small by excluding dev dependencies and build tools.
8. **Thoughtful sample cases** — The embedded bias/safe case pair serves as both onboarding UX and implicit documentation of the system's analytical capabilities.

---

## 13. Weaknesses & Recommendations

### 13.1 Architecture & Code Quality

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **Monolithic `App.tsx`** (357 lines) | Hard to maintain; mixing state management, business logic, inline data, and presentation. | Extract state machine to a custom hook (`useAnalysis`), move sample data to a constants file, and split the results dashboard into a separate component. |
| **Server is plain JS** | No type safety on the backend; schema and prompt are only validated at runtime. | Migrate `server/index.js` to TypeScript (share `types.ts` between client and server). |
| **No state management library** | Adequate now, but will not scale if features are added (e.g., history, user accounts). | Consider Zustand or React Context for state management as complexity grows. |
| **Inline Tailwind classes** | Some class strings exceed 200 characters, harming readability. | Extract repeated patterns into Tailwind `@apply` directives or component-level CSS modules. |
| **GoogleGenAI instantiated per request** | Unnecessary overhead; could degrade under load. | Instantiate the client once at server startup and reuse across requests. |

### 13.2 Testing & Quality Assurance

| Issue | Recommendation |
|-------|----------------|
| No unit tests | Add Vitest (Vite-native) for service and util functions. |
| No component tests | Add React Testing Library for component rendering and interaction tests. |
| No integration/e2e tests | Add Playwright or Cypress for end-to-end user flow coverage. |
| No CI pipeline | Add GitHub Actions workflow for lint, type-check, test, and Docker build. |

### 13.3 Security Hardening

| Issue | Recommendation |
|-------|----------------|
| No rate limiting on `/api/analyze` | Add `express-rate-limit` (e.g., 10 requests/min per IP). |
| No authentication | Add API key, session, or OAuth-based auth if exposed publicly. |
| Tailwind CDN in production | Install Tailwind as a PostCSS plugin and bundle it at build time. |
| Error message leakage | Sanitize error responses; return generic messages to the client in production. |
| No CSP/security headers | Add `helmet` middleware to Express for CSP, X-Frame-Options, etc. |

### 13.4 Performance & Scalability

| Issue | Recommendation |
|-------|----------------|
| Large base64 payloads in JSON body | Consider `multipart/form-data` upload with streaming to reduce memory pressure. |
| No caching | Identical transcripts will re-invoke Gemini. Add a hash-based cache layer for text inputs. |
| Synchronous Gemini call blocks Express event loop | For high-throughput, consider a job queue (e.g., Bull/BullMQ) with polling or WebSocket result delivery. |
| No health check endpoint | Add `GET /healthz` for Cloud Run liveness/readiness probes. |

### 13.5 Feature Gaps

| Gap | Description |
|-----|-------------|
| No export | Users cannot download or share the analysis report (PDF, JSON, or CSV). |
| No history | Each analysis is ephemeral; there is no persistence or session history. |
| No drag-and-drop | `FileUpload` uses click-to-select only; native HTML5 drag-and-drop events are not handled. |
| No accessibility audit | No ARIA labels, `role` attributes, or keyboard navigation tested. |
| No i18n | English only; no internationalization framework. |

---

## 14. Appendix — File Inventory

| File | Type | Lines | Role |
|------|------|-------|------|
| `index.html` | HTML | 30 | SPA shell — loads Tailwind CDN, Google Fonts, mounts Vite entry point |
| `index.tsx` | TSX | 16 | React bootstrap — `createRoot` on `#root` |
| `App.tsx` | TSX | 357 | Root component — state machine, layout, all page states |
| `types.ts` | TS | 34 | Domain model — enums (`BiasType`, `RiskLevel`) and interfaces (`AuditFlag`, `AnalysisResponse`, `AnalysisState`) |
| `services/geminiService.ts` | TS | 37 | HTTP client — `analyzeConsultation()` and `fileToBase64()` |
| `components/FileUpload.tsx` | TSX | 66 | File picker UI with decorative styling |
| `components/AuditCard.tsx` | TSX | 80 | Single bias event card with risk-coded styling |
| `components/RiskChart.tsx` | TSX | 68 | Recharts donut chart aggregating risk levels |
| `server/index.js` | JS | 150 | Express server — Gemini proxy, system prompt, structured output schema, static serving |
| `package.json` | JSON | 32 | Dependencies and scripts |
| `tsconfig.json` | JSON | 26 | TypeScript compiler options |
| `vite.config.ts` | TS | 20 | Vite dev server, proxy, and alias configuration |
| `Dockerfile` | Docker | 22 | Multi-stage build for Cloud Run |
| `metadata.json` | JSON | 5 | Project name and description metadata |
| `test_files/Case_A.wav` | WAV | — | Sample audio test file |
| `test_files/Case_B.wav` | WAV | — | Sample audio test file |

---

*End of report.*
