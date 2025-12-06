import React from 'react';
import { AuditFlag, RiskLevel, BiasType } from '../types';
import { AlertTriangle, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface AuditCardProps {
  flag: AuditFlag;
}

const AuditCard: React.FC<AuditCardProps> = ({ flag }) => {
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.High: return 'bg-red-50 border-red-200 text-red-800';
      case RiskLevel.Medium: return 'bg-orange-50 border-orange-200 text-orange-800';
      case RiskLevel.Low: return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case RiskLevel.None: return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.High: return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case RiskLevel.Medium: return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case RiskLevel.Low: return <Info className="w-5 h-5 text-yellow-600" />;
      case RiskLevel.None: return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
  };

  const getBadgeStyle = (bias: BiasType) => {
      switch (bias) {
          case BiasType.DiagnosticShadowing: return "bg-purple-100 text-purple-700";
          case BiasType.PrematureClosure: return "bg-rose-100 text-rose-700";
          case BiasType.AnchoringBias: return "bg-blue-100 text-blue-700";
          case BiasType.SafePractice: return "bg-emerald-100 text-emerald-700";
          default: return "bg-gray-100 text-gray-700";
      }
  }

  return (
    <div className={`border rounded-lg p-5 mb-4 relative overflow-hidden transition-all hover:shadow-md ${getRiskColor(flag.risk_level)} border-l-4`}>
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold bg-white/50 px-2 py-1 rounded">
                    {flag.timestamp}
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${getBadgeStyle(flag.bias_type)}`}>
                    {flag.bias_type}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase opacity-75">Risk: {flag.risk_level}</span>
                {getRiskIcon(flag.risk_level)}
            </div>
        </div>

        <div className="bg-white/60 p-3 rounded-md mb-3 italic text-slate-700 border-l-2 border-slate-300">
            "{flag.dialogue_trigger}"
        </div>

        <div>
            <h4 className="text-sm font-semibold mb-1 opacity-90">Clinical Reasoning Audit:</h4>
            <p className="text-sm opacity-90 leading-relaxed">
                {flag.clinical_reasoning}
            </p>
        </div>
    </div>
  );
};

export default AuditCard;