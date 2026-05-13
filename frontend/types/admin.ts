export type DemoSummary = {
  demo_businesses: number;
  documents: number;
  extractions: number;
  audit_findings: number;
  lri_scores: number;
  mous: number;
  scheme_matches: number;
  reports: number;
};

export type DemoSeedResponse = {
  success: boolean;
  message: string;
  created: Record<string, number>;
  updated: Record<string, number>;
  summary: DemoSummary;
};

export type DemoResetResponse = {
  success: boolean;
  message: string;
  deleted: Record<string, number>;
  summary: DemoSummary;
};
