import React from 'react';
import { AuditFlag, RiskLevel, BiasType } from '../types';
import { AlertTriangle, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface AuditCardProps {
  flag: AuditFlag;
}

const AuditCard: React.FC<AuditCardProps> = ({ flag }) => {
  const getRiskStyles = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.High: 
        return 'bg-red-950/10 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
      case RiskLevel.Medium: 
        return 'bg-orange-950/10 border-orange-500 text-orange-400';
      case RiskLevel.Low: 
        return 'bg-yellow-950/10 border-yellow-500 text-yellow-400';
      case RiskLevel.None: 
        return 'bg-emerald-950/10 border-emerald-500 text-emerald-400';
      default: 
        return 'bg-slate-900/50 border-slate-600 text-slate-400';
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.High: return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case RiskLevel.Medium: return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case RiskLevel.Low: return <Info className="w-5 h-5 text-yellow-500" />;
      case RiskLevel.None: return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getBadgeStyle = (bias: BiasType) => {
      switch (bias) {
          case BiasType.DiagnosticShadowing: return "bg-purple-900/20 text-purple-300 border border-purple-500/30";
          case BiasType.PrematureClosure: return "bg-rose-900/20 text-rose-300 border border-rose-500/30";
          case BiasType.AnchoringBias: return "bg-blue-900/20 text-blue-300 border border-blue-500/30";
          case BiasType.SafePractice: return "bg-emerald-900/20 text-emerald-300 border border-emerald-500/30";
          default: return "bg-slate-800 text-slate-400";
      }
  }

  return (
    <div className={`border-l-2 rounded-r-lg p-5 mb-4 relative overflow-hidden transition-all hover:bg-slate-900/40 backdrop-blur-sm ${getRiskStyles(flag.risk_level)} bg-gradient-to-r from-transparent via-transparent to-slate-900/20`}>
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold bg-slate-900/80 border border-slate-700 text-slate-300 px-2 py-1 rounded">
                    {flag.timestamp}
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded ${getBadgeStyle(flag.bias_type)}`}>
                    {flag.bias_type}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold uppercase opacity-75 tracking-wider">Risk Level: {flag.risk_level}</span>
                {getRiskIcon(flag.risk_level)}
            </div>
        </div>

        <div className="bg-slate-950/40 p-3 rounded border-l-2 border-slate-600 mb-3 text-slate-300 italic font-light">
            "{flag.dialogue_trigger}"
        </div>

        <div>
            <h4 className="text-xs font-mono font-bold mb-2 opacity-70 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
              Clinical Reasoning Audit
            </h4>
            <div className="text-sm opacity-90 leading-relaxed font-mono bg-black/20 p-3 rounded border border-white/5 shadow-inner">
                {flag.clinical_reasoning}
            </div>
        </div>
    </div>
  );
};

export default AuditCard;