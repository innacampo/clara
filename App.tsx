import React, { useState } from 'react';
import { BrainCircuit, Loader2, Play, AlertOctagon, RotateCcw, FileText, ArrowRight } from 'lucide-react';
import { AnalysisState, BiasType, RiskLevel } from './types';
import { analyzeConsultation, fileToBase64 } from './services/geminiService';
import FileUpload from './components/FileUpload';
import AuditCard from './components/AuditCard';
import RiskChart from './components/RiskChart';

const SAMPLE_CASES = [
  {
    id: 'bias',
    title: 'Case Study: "The Anxiety Label"',
    description: 'Patient presents with dizziness and syncope. History of Generalized Anxiety Disorder.',
    badge: 'Contains Bias',
    badgeColor: 'bg-red-900/30 text-red-400 border border-red-800/50',
    text: `Dr: Good morning Elena. I see you're here for dizziness?
Elena: Yes doctor, it's been happening for a week. I was at the grocery store yesterday and I actually had to grab the shelf because the room started spinning. My heart was pounding out of my chest.
Dr: Mhm. And looking at your chart here, I see we've been managing your generalized anxiety disorder for a few years now. Have you been taking your meds?
Elena: Yes, I take them every day. But this feels different. It wasn't like a panic attack. I wasn't anxious before it happened. I just stood up and...
Dr: You know, anxiety can manifest in really physical ways Elena. Even if you don't feel worried in the moment, your body holds on to stress. Have things been stressful at work?
Elena: Well, sure, work is busy but I actually blacked out for a second. That's never happened with my anxiety before.
Dr: Palpitations and lightheadedness are classic signs of a panic spiral. When we hyperventilate, we get dizzy. I think what's happening here is a flare up of the GAD.
Elena: So you don't think it's my heart?
Dr: I think if we get your anxiety back under control, the dizziness will stop. Let's bump up your dosage and try some breathing exercises. If you're still feeling this way in a month, give us a call.`
  },
  {
    id: 'safe',
    title: 'Case Study: "Safety First"',
    description: 'Same patient presentation, but handled with objective investigation.',
    badge: 'Safe Practice',
    badgeColor: 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50',
    text: `Dr: Good morning Elena. I see you're here for some dizziness?
Elena: Yes doctor. It's been happening for a week. I was at the grocery store yesterday and I actually had to grab the shelf because the room started spinning. My heart was pounding out of my chest.
Dr: That sounds frightening. Did you lose consciousness completely or did it just feel like you might?
Elena: I think I blacked out for just a second. I don't remember hitting the floor, but I was definitely out of it.
Dr: Okay. I see in your chart you have a history of generalized anxiety disorder. I know palpitations can sometimes be part of that. Does this feel like your usual panic attacks?
Elena: No, that's the thing. I wasn't anxious. I just reached for a box of cereal and boom, down I went.
Dr: Hmm. Okay. While anxiety can certainly cause physical symptoms, losing consciousness, what we call syncope, needs to be investigated on its own first.
Elena: So you don't think it's just stress?
Dr: We can't assume that yet. Passing out isn't a typical panic symptom without hyperventilating first. I want to do an ECG right now to check your heart rhythm, and we're going to check your blood pressure while you're laying down and standing up.
Elena: Okay, that makes me feel better.
Dr: Let's rule out the physical causes. If the heart and blood work come back clear, then we can discuss if stress is playing a role. But safety first.`
  }
];

function App() {
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
  });

  const handleFileSelect = async (file: File) => {
    try {
      const audioUrl = URL.createObjectURL(file);
      setState({ 
        status: 'uploading', 
        fileName: file.name,
        audioUrl,
        transcript: undefined
      });

      // Prepare file for API
      const base64 = await fileToBase64(file);
      
      setState(prev => ({ ...prev, status: 'processing' }));

      // Call Gemini API with audio
      const result = await analyzeConsultation({ type: 'audio', data: base64, mimeType: file.type });
      
      setState(prev => ({ 
        ...prev, 
        status: 'complete',
        result
      }));

    } catch (error: any) {
      console.error(error);
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error.message || "An unexpected error occurred during analysis."
      }));
    }
  };

  const handleSampleSelect = async (sample: typeof SAMPLE_CASES[0]) => {
    try {
      setState({ 
        status: 'processing', 
        fileName: sample.title,
        audioUrl: undefined,
        transcript: sample.text
      });

      // Call Gemini API with text
      const result = await analyzeConsultation({ type: 'text', text: sample.text });
      
      setState(prev => ({ 
        ...prev, 
        status: 'complete',
        result
      }));

    } catch (error: any) {
      console.error(error);
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error.message || "An unexpected error occurred during analysis."
      }));
    }
  };

  const handleReset = () => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    setState({ status: 'idle' });
  };

  // Safe accessor for stats
  const highRiskCount = state.result?.audit_flags.filter(f => f.risk_level === RiskLevel.High).length || 0;
  const totalIssues = state.result?.audit_flags.length || 0;
  
  return (
    <div className="min-h-screen bg-[#0B1221] text-slate-100 pb-20 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <header className="bg-[#0B1221]/80 backdrop-blur-md border-b border-cyan-900/30 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/10 border border-cyan-500/50 p-2 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <BrainCircuit className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-50 leading-none tracking-tight">CLARA</h1>
              <p className="text-[10px] text-cyan-400 font-mono tracking-[0.2em] uppercase mt-1 opacity-80">Clinical Logic Auditor</p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="bg-slate-900/50 border border-cyan-900/50 text-cyan-400 px-3 py-1 rounded-full text-xs font-mono">
               v1.0.0_BETA
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro / Empty State */}
        {state.status === 'idle' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white tracking-tight">Cognitive Bias Detection for Patient Safety</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light">
                Upload a consultation recording to detect <span className="text-cyan-400 font-medium">Diagnostic Shadowing</span>, <span className="text-cyan-400 font-medium">Premature Closure</span>, and <span className="text-cyan-400 font-medium">Anchoring Bias</span> in clinical reasoning.
              </p>
            </div>
            
            <FileUpload onFileSelect={handleFileSelect} disabled={false} />

            {/* Sample Cases */}
            <div className="border-t border-slate-800/50 pt-8">
               <h3 className="text-xs font-bold text-slate-500 font-mono uppercase tracking-widest mb-6 text-center">System Calibration // Sample Cases</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SAMPLE_CASES.map((sample) => (
                    <button 
                      key={sample.id}
                      onClick={() => handleSampleSelect(sample)}
                      className="text-left bg-slate-900/40 backdrop-blur-sm p-5 rounded-xl border border-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[10px] uppercase font-mono tracking-wider font-bold px-2 py-1 rounded ${sample.badgeColor}`}>
                          {sample.badge}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-slate-200 mb-1 group-hover:text-cyan-300 transition-colors">{sample.title}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{sample.description}</p>
                    </button>
                  ))}
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
                <div className="w-10 h-10 bg-purple-900/20 border border-purple-500/30 rounded-lg flex items-center justify-center mb-4">
                  <span className="font-bold font-mono text-purple-400">DS</span>
                </div>
                <h3 className="font-semibold text-slate-200 mb-2">Diagnostic Shadowing</h3>
                <p className="text-sm text-slate-400">Detects when physical symptoms are misattributed to psychiatric history.</p>
              </div>
              <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
                <div className="w-10 h-10 bg-rose-900/20 border border-rose-500/30 rounded-lg flex items-center justify-center mb-4">
                  <span className="font-bold font-mono text-rose-400">PC</span>
                </div>
                <h3 className="font-semibold text-slate-200 mb-2">Premature Closure</h3>
                <p className="text-sm text-slate-400">Identifies when a diagnosis is made before ruling out serious alternatives.</p>
              </div>
              <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
                <div className="w-10 h-10 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-center justify-center mb-4">
                  <span className="font-bold font-mono text-blue-400">AB</span>
                </div>
                <h3 className="font-semibold text-slate-200 mb-2">Anchoring Bias</h3>
                <p className="text-sm text-slate-400">Flags reliance on initial information despite contradictory evidence.</p>
              </div>
            </div>
          </div>
        )}

        {/* Processing States */}
        {(state.status === 'uploading' || state.status === 'processing') && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
            <div className="relative">
              <div className="w-24 h-24 border-t-2 border-l-2 border-cyan-500/80 rounded-full animate-spin"></div>
              <div className="w-24 h-24 border-b-2 border-r-2 border-cyan-900/30 rounded-full animate-spin absolute inset-0 reverse-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className="w-10 h-10 text-cyan-400 animate-pulse drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-100 tracking-wide">
                {state.status === 'uploading' ? 'UPLOADING DATA STREAM...' : 'ANALYZING CLINICAL LOGIC...'}
              </h3>
              <p className="text-cyan-400/70 font-mono text-sm">
                System is parsing dialogue for logical fallacies
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.status === 'error' && (
          <div className="max-w-2xl mx-auto mt-12 bg-red-950/20 border border-red-500/50 rounded-xl p-8 text-center backdrop-blur-sm">
            <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
            <h3 className="text-lg font-bold text-red-400 mb-2 tracking-wide uppercase">Analysis Failed</h3>
            <p className="text-red-300/80 mb-6 font-mono text-sm">{state.error}</p>
            <button 
              onClick={handleReset}
              className="inline-flex items-center gap-2 bg-red-900/20 border border-red-500/50 text-red-400 px-6 py-2 rounded-lg font-medium hover:bg-red-900/40 hover:text-red-300 transition-all uppercase tracking-wider text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset System
            </button>
          </div>
        )}

        {/* Results Dashboard */}
        {state.status === 'complete' && state.result && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Control Bar */}
            <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-cyan-900/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/30">
                   {state.audioUrl ? (
                     <Play className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                   ) : (
                     <FileText className="w-5 h-5 text-cyan-400" />
                   )}
                </div>
                <div>
                  <h3 className="font-medium text-slate-200 truncate max-w-[500px]">{state.fileName}</h3>
                  <p className="text-[10px] uppercase font-mono text-cyan-400/70 tracking-wider">Analysis Complete</p>
                </div>
                {state.audioUrl && (
                  <audio controls className="h-8 ml-4 w-64 hidden md:block opacity-80 invert hue-rotate-180" src={state.audioUrl} />
                )}
              </div>
              
              <div className="flex gap-3">
                 <button 
                  onClick={handleReset}
                  className="text-xs font-mono text-slate-400 hover:text-cyan-400 uppercase tracking-widest px-3 py-2 transition-colors border border-transparent hover:border-cyan-900/50 rounded"
                >
                  Analyze New File
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-6">
                
                {/* High Level Alert */}
                {highRiskCount > 0 ? (
                   <div className="bg-red-950/20 border border-red-500/40 rounded-xl p-6 flex items-start gap-4 shadow-[0_0_20px_rgba(239,68,68,0.1)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                      <AlertOctagon className="w-8 h-8 text-red-500 flex-shrink-0 mt-1 relative z-10" />
                      <div className="relative z-10">
                        <h3 className="text-lg font-bold text-red-400 tracking-tight">High Risk Bias Detected</h3>
                        <p className="text-red-200/70 mt-1 font-light">
                          CLARA identified <span className="font-mono font-bold text-red-400">{highRiskCount}</span> high-risk logical failures that may impact patient safety. 
                          Immediate review of the consultation timeline is recommended.
                        </p>
                      </div>
                   </div>
                ) : (
                  <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-6 flex items-start gap-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <BrainCircuit className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-bold text-emerald-400 tracking-tight">Reasoning appears robust</h3>
                        <p className="text-emerald-200/70 mt-1 font-light">
                          No high-risk cognitive biases were detected in this sample.
                        </p>
                      </div>
                   </div>
                )}
                
                {/* Transcript Viewer for Samples */}
                {state.transcript && (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                    <h3 className="text-xs font-bold text-cyan-500/70 uppercase tracking-widest mb-4 flex items-center gap-2 font-mono">
                      <FileText className="w-4 h-4" />
                      Consultation Transcript
                    </h3>
                    <div className="bg-black/30 p-4 rounded-lg text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-slate-800 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {state.transcript}
                    </div>
                  </div>
                )}

                {/* Audit Stream */}
                <div>
                  <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-3">
                    Audit Log
                    <span className="bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">{totalIssues} Events</span>
                  </h3>
                  <div className="space-y-4">
                    {state.result.audit_flags.map((flag, idx) => (
                      <AuditCard key={idx} flag={flag} />
                    ))}
                  </div>
                </div>

              </div>

              {/* Sidebar */}
              <div className="md:col-span-1 space-y-6">
                 <RiskChart flags={state.result.audit_flags} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;