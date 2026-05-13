export type DocumentType =
  | "GST_CERTIFICATE"
  | "UDYAM_CERTIFICATE"
  | "PAN_CARD"
  | "BANK_STATEMENT"
  | "ITR_ACKNOWLEDGEMENT"
  | "OTHER";

export type DocumentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type DocumentRecord = {
  id: number;
  business_id: number;
  document_type: DocumentType | string;
  status: DocumentStatus | string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  mime_type: string | null;
  file_size_bytes: number;
  uploaded_at: string;
  processed_at: string | null;
};
