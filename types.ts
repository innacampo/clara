export enum BiasType {
  DiagnosticShadowing = "Diagnostic Shadowing",
  PrematureClosure = "Premature Closure",
  AnchoringBias = "Anchoring Bias",
  SafePractice = "Safe Practice"
}

export enum RiskLevel {
  High = "High",
  Medium = "Medium",
  Low = "Low",
  None = "None"
}

export interface AuditFlag {
  timestamp: string;
  bias_type: BiasType;
  risk_level: RiskLevel;
  dialogue_trigger: string;
  clinical_reasoning: string;
}

export interface AnalysisResponse {
  audit_flags: AuditFlag[];
}

export interface AnalysisState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  result?: AnalysisResponse;
  fileName?: string;
  audioUrl?: string;
  transcript?: string;
}