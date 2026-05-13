export type AuditSeverity = "HIGH" | "MEDIUM" | "LOW";

export type AuditFinding = {
  id: number;
  business_id: number;
  document_id: number | null;
  finding_type: string;
  severity: AuditSeverity;
  title: string;
  description: string;
  recommendation: string;
  field_name: string | null;
  expected_value: string | null;
  actual_value: string | null;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
};

export type AuditSummary = {
  business_id: number;
  total_findings: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  missing_documents_count: number;
  generated_findings: AuditFinding[];
};

export type AuditRunResponse = AuditSummary;
