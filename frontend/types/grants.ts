export type SchemeCategory =
  | "CREDIT"
  | "CREDIT / SUBSIDY"
  | "CERTIFICATION / SUBSIDY"
  | "CLUSTER_DEVELOPMENT"
  | "GUARANTEE";

export type Scheme = {
  id: number;
  code: string;
  name: string;
  category: SchemeCategory | string;
  description: string;
  eligibility_summary: string;
  benefits_summary: string;
  state: string | null;
  industry_focus: string;
  source_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SchemeMatch = {
  id: number;
  business_id: number;
  scheme_id: number;
  match_score: number;
  recommendation_status: "Strong fit" | "Moderate fit" | "Weak fit";
  match_reason: string;
  eligibility_notes: string;
  required_documents: string[];
  vector_score: number | null;
  created_at: string;
  scheme: Scheme;
};

export type GrantMatchRunResponse = {
  business_id: number;
  total_matches: number;
  matches: SchemeMatch[];
  disclaimer: string;
};

export type SchemeSeedResponse = {
  inserted: number;
  updated: number;
  total_seeded: number;
};
