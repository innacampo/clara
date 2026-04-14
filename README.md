# **CLARA: AI's Life-Saving Intervention**

**Clinical Logic Assessment & Reasoning Assistant**

CLARA is a multimodal AI safety net dedicated to supporting clinical reasoning and helping identify diagnostic shadowing to optimize patient care.

## **The Problem: Cognitive Load & System Strain**

* Diagnostic error impacts **12 million Americans annually** \[1\].  
* In women's health, the crisis is more severe: women are diagnosed an average **4 years later than men** \[2\].  
* A major factor is **Diagnostic Shadowing** \[3\]: the tendency to inadvertently attribute physical symptoms to psychiatric history.  
* This is a recognized systemic issue-it's the result of **Dual Process Theory** being strained under immense clinical pressure.  
  * Physicians operating under high cognitive load are forced to rely on **System 1** (fast/heuristic thinking) just to keep up.  
  * The analytical **System 2** can be inadvertently bypassed, allowing necessary cognitive shortcuts to occasionally result in unintended clinical blind spots \[4\].

## **The Solution: A Cognitive Support Strategy**

CLARA is built as an **"External System 2"**-a background AI ally powered by **Gemini 3 Pro**.

* **Not just a scribe.** Rather than merely transcribing conversations, CLARA supports the **reasoning process** behind the encounter.  
* Functions as a **safety net**, continuously running in the background to reduce physician cognitive burden.  
* Highlights **potential diagnostic blind spots** and offers gentle clinical nudges for review prior to patient discharge.  
* Helps physicians maintain their highest standard of clinical accuracy, even when their mental bandwidth is exhausted.

## **Methodology & Impact**

* Developed with **Google AI Studio**.  
* Processes consented consultation audio and outputs standardized **"Clinical Insights" (JSON)**.  
* Converts subjective reports of being dismissed into objective, actionable data for the care team.  
* Empowers equitable patient care while reducing cognitive fatigue and systemic risk for providers.

## **Getting Started**

### **Prerequisites**

* Node.js (latest LTS recommended)

### Local Setup

1. Clone the repository and navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example and set your Google Cloud project details:
   ```bash
   cp .env.example .env
   ```
   ```env
   GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   ```
4. Authenticate locally with Application Default Credentials (ADC):
   ```bash
   gcloud auth application-default login
   ```
5. Run the development server (Vite on `:3000` + Express on `:3001`):
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploying to Google Cloud Run

The app is packaged as a single Docker container: the Express server serves the
built Vite frontend and proxies all Gemini calls server-side, utilizing
Application Default Credentials (ADC) to authenticate with Vertex AI.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed locally
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated
- A Google Cloud project with billing enabled

### One-command deploy (source deploy — no local Docker needed)

```bash
gcloud run deploy clara \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id \
  --set-env-vars GOOGLE_CLOUD_LOCATION=us-central1
```

Cloud Run builds the container using the `Dockerfile`, then deploys it. The
deployed service relies on the default compute service account for Application
Default Credentials. Ensure that the service account has the **Vertex AI User** role.

### Manual build & push (optional)

```bash
# Build
docker build -t gcr.io/YOUR_PROJECT_ID/clara .

# Push
docker push gcr.io/YOUR_PROJECT_ID/clara

# Deploy
gcloud run deploy clara \
  --image gcr.io/YOUR_PROJECT_ID/clara \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id \
  --set-env-vars GOOGLE_CLOUD_LOCATION=us-central1
```

---

## References

1. Singh H et al. *BMJ Qual Saf* 2014.  
2. Westergaard D et al. *Nat Commun* 2019.  
3. Reiss S et al. *Am J Ment Defic* 1982.  
4. Trimble M *UMJ* 2015.

---

_For more information or contributions, see the codebase and issues on GitHub._
