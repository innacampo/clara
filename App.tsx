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
    badgeColor: 'bg-red-100 text-red-700',
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
    badgeColor: 'bg-emerald-100 text-emerald-700',
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">CLARA</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">CLINICAL LOGIC AUDITOR</p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
               v1.0.0 Beta
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro / Empty State */}
        {state.status === 'idle' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-slate-900">Cognitive Bias Detection for Patient Safety</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Upload a consultation recording to detect Diagnostic Shadowing, Premature Closure, and Anchoring Bias in clinical reasoning.
              </p>
            </div>
            
            <FileUpload onFileSelect={handleFileSelect} disabled={false} />

            {/* Sample Cases */}
            <div className="border-t border-slate-200 pt-8">
               <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6 text-center">Or test with a sample case</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SAMPLE_CASES.map((sample) => (
                    <button 
                      key={sample.id}
                      onClick={() => handleSampleSelect(sample)}
                      className="text-left bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${sample.badgeColor}`}>
                          {sample.badge}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">{sample.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{sample.description}</p>
                    </button>
                  ))}
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <span className="font-bold text-purple-600">DS</span>
                </div>
                <h3 className="font-semibold mb-2">Diagnostic Shadowing</h3>
                <p className="text-sm text-slate-500">Detects when physical symptoms are misattributed to psychiatric history.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                  <span className="font-bold text-rose-600">PC</span>
                </div>
                <h3 className="font-semibold mb-2">Premature Closure</h3>
                <p className="text-sm text-slate-500">Identifies when a diagnosis is made before ruling out serious alternatives.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="font-bold text-blue-600">AB</span>
                </div>
                <h3 className="font-semibold mb-2">Anchoring Bias</h3>
                <p className="text-sm text-slate-500">Flags reliance on initial information despite contradictory evidence.</p>
              </div>
            </div>
          </div>
        )}

        {/* Processing States */}
        {(state.status === 'uploading' || state.status === 'processing') && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 text-indigo-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800">
                {state.status === 'uploading' ? 'Uploading Audio...' : 'Analyzing Clinical Reasoning...'}
              </h3>
              <p className="text-slate-500 mt-2">
                CLARA is listening for logical fallacies. This may take a moment.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.status === 'error' && (
          <div className="max-w-2xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Analysis Failed</h3>
            <p className="text-red-600 mb-6">{state.error}</p>
            <button 
              onClick={handleReset}
              className="inline-flex items-center gap-2 bg-white border border-red-200 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Results Dashboard */}
        {state.status === 'complete' && state.result && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Control Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="bg-indigo-50 p-2 rounded-full">
                   {state.audioUrl ? (
                     <Play className="w-5 h-5 text-indigo-600 fill-indigo-600" />
                   ) : (
                     <FileText className="w-5 h-5 text-indigo-600" />
                   )}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 truncate max-w-[200px]">{state.fileName}</h3>
                  <p className="text-xs text-slate-500">Analysis Complete</p>
                </div>
                {state.audioUrl && (
                  <audio controls className="h-8 ml-4 w-64 hidden md:block" src={state.audioUrl} />
                )}
              </div>
              
              <div className="flex gap-3">
                 <button 
                  onClick={handleReset}
                  className="text-sm text-slate-500 hover:text-indigo-600 font-medium px-3 py-2"
                >
                  Analyze New File
                </button>
                 <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Export PDF Report
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-6">
                
                {/* High Level Alert */}
                {highRiskCount > 0 ? (
                   <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
                      <AlertOctagon className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-bold text-red-800">High Risk Bias Detected</h3>
                        <p className="text-red-700 mt-1">
                          CLARA identified {highRiskCount} high-risk logical failures that may impact patient safety. 
                          Immediate review of the consultation timeline is recommended.
                        </p>
                      </div>
                   </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
                      <BrainCircuit className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-bold text-green-800">Reasoning appears robust</h3>
                        <p className="text-green-700 mt-1">
                          No high-risk cognitive biases were detected in this sample.
                        </p>
                      </div>
                   </div>
                )}
                
                {/* Transcript Viewer for Samples */}
                {state.transcript && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Consultation Transcript
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-slate-200">
                      {state.transcript}
                    </div>
                  </div>
                )}

                {/* Audit Stream */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    Audit Log
                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{totalIssues} Events</span>
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
                 
                 <div className="bg-indigo-900 text-white p-6 rounded-xl">
                    <h4 className="font-semibold mb-2">CLARA Insights</h4>
                    <p className="text-indigo-200 text-sm">
                      Common pattern detected: <strong>Premature Closure</strong> often occurs within the first 3 minutes of a consultation.
                    </p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;