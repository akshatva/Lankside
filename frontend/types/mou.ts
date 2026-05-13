export type MOUStatus = "GENERATED" | "EXPORTED";

export type MOU = {
  id: number;
  business_id: number;
  party_a_name: string;
  party_b_name: string;
  purpose: string;
  duration_months: number;
  contribution_details: string;
  revenue_sharing: string;
  dispute_resolution: string;
  cluster_purpose: string;
  draft_text: string;
  pdf_path: string | null;
  status: MOUStatus;
  created_at: string;
  updated_at: string;
};

export type MOUGenerateRequest = {
  business_id: number;
  party_a_name: string;
  party_b_name: string;
  purpose: string;
  duration_months: number;
  contribution_details: string;
  revenue_sharing: string;
  dispute_resolution: string;
  cluster_purpose: string;
};

export type MOUUpdate = Partial<
  Omit<MOUGenerateRequest, "business_id"> & {
    draft_text: string;
  }
>;
