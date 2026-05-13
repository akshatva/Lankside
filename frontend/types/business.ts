export type Business = {
  id: number;
  user_id: number;
  business_name: string;
  owner_name: string;
  udyam_id: string | null;
  gstin: string | null;
  pan: string | null;
  industry_type: string | null;
  state: string | null;
  city: string | null;
  business_age_years: number | null;
  turnover_range: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessPayload = {
  business_name: string;
  owner_name: string;
  udyam_id?: string | null;
  gstin?: string | null;
  pan?: string | null;
  industry_type?: string | null;
  state?: string | null;
  city?: string | null;
  business_age_years?: number | null;
  turnover_range?: string | null;
};
