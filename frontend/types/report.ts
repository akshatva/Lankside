export type ReportStatus = "GENERATING" | "GENERATED" | "FAILED";

export type ReportSummary = {
  id: number;
  business_id: number;
  report_type: string;
  status: ReportStatus | string;
  pdf_path: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BankabilityReport = ReportSummary & {
  summary: Record<string, unknown>;
  summary_text: string;
  disclaimer?: string;
};

export type Report = BankabilityReport;
export type ReportGenerateResponse = BankabilityReport;
