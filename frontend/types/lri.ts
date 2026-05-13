export type LRIBand = "RED" | "YELLOW" | "GREEN";

export type LRIRecommendation = {
  code: string;
  message: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
};

export type LRIScore = {
  id: number;
  business_id: number;
  document_integrity_score: number;
  collaboration_score: number;
  financial_consistency_score: number;
  overall_score: number;
  band: LRIBand;
  explanation: string;
  recommendations: LRIRecommendation[];
  created_at: string;
};

export type LRIScoreResult = LRIScore;

export type LRIScoreHistory = {
  business_id: number;
  scores: LRIScore[];
};
