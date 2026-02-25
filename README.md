# CLARA: AI's Life-Saving Intervention

**Clinical Logic Assessment & Reasoning Auditor**

CLARA is a multimodal AI safety net dedicated to safeguarding clinical reasoning and detecting diagnostic shadowing before it harms patient care.

---

## The Problem: Cognitive Load & System Strain

- Diagnostic error impacts **12 million Americans annually** [1].
- In women's health, the crisis is more severe: women are diagnosed an average **4 years later than men** [2].
- A major factor is **Diagnostic Shadowing** [3]: the tendency to attribute physical symptoms to psychiatric history.
- This isn't typically negligence—it's the result of **Dual Process Theory** breaking down under pressure.
  - Physicians under high cognitive load default to **System 1** (fast/heuristic thinking).  
  - The analytical **System 2** is bypassed, allowing harmless shortcuts to evolve into dangerous biases [4].

---

## The Solution: A Cognitive Forcing Strategy

CLARA is built as an **"External System 2"**—a background AI agent powered by **Gemini 3 Pro**.

- **Not a scribe.** Rather than transcribing conversations, CLARA audits the **logic** of the encounter.
- Functions as a **safety net**, continuously running behind the scenes.
- Flags **high‑risk reasoning patterns** for review prior to patient discharge.
- Helps physicians maintain clinical accuracy even when their mental bandwidth is exhausted.

---

## Methodology & Impact

- Developed with **Google AI Studio**.
- Processes consented consultation audio and outputs standardized **"Audit Flags" (JSON)**.
- Converts subjective reports of being dismissed into objective, actionable data.
- Protects patients from gender‑based bias while reducing medico‑legal risk for providers.

---

## Getting Started

### Prerequisites
- Node.js (latest LTS recommended)

### Local Setup

1. Clone the repository and navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file and set your Gemini API key:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.


---

## References

1. Singh H et al. *BMJ Qual Saf* 2014.  
2. Westergaard D et al. *Nat Commun* 2019.  
3. Reiss S et al. *Am J Ment Defic* 1982.  
4. Trimble M *UMJ* 2015.

---

_For more information or contributions, see the codebase and issues on GitHub._
