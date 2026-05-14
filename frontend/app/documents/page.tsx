"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  FormField,
  WorkspaceInput,
  WorkspaceSelect,
} from "@/components/ui/form-field";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusPill } from "@/components/ui/status-pill";
import {
  WorkspaceTable,
  WorkspaceTd,
  WorkspaceTh,
  workspaceRowClassName,
} from "@/components/ui/workspace-table";
import { WorkspaceButton } from "@/components/ui/workspace-button";
import { WorkspaceCard } from "@/components/ui/workspace-card";
import {
  deleteDocument,
  downloadDocument,
  getBusinesses,
  getDocumentExtraction,
  getDocumentExtractions,
  getDocuments,
  runDocumentExtraction,
  uploadDocument,
} from "@/lib/api";
import type { Business } from "@/types/business";
import type {
  DocumentExtraction,
  DocumentRecord,
  DocumentType,
} from "@/types/document";

const documentTypes: Array<{ value: DocumentType; label: string }> = [
  { value: "GST_CERTIFICATE", label: "GST Certificate" },
  { value: "UDYAM_CERTIFICATE", label: "Udyam Certificate" },
  { value: "PAN_CARD", label: "PAN Card" },
  { value: "BANK_STATEMENT", label: "Bank Statement" },
  { value: "ITR_ACKNOWLEDGEMENT", label: "ITR Acknowledgement" },
  { value: "OTHER", label: "Other" },
];

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not processed";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: string): "success" | "danger" | "warning" | "neutral" {
  if (status === "COMPLETED") {
    return "success";
  }
  if (status === "FAILED") {
    return "danger";
  }
  if (status === "PENDING" || status === "PROCESSING") {
    return "warning";
  }
  return "neutral";
}

export default function DocumentsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(
    null,
  );
  const [documentType, setDocumentType] =
    useState<DocumentType>("GST_CERTIFICATE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [extractions, setExtractions] = useState<Record<number, DocumentExtraction>>(
    {},
  );
  const [activeExtraction, setActiveExtraction] =
    useState<DocumentExtraction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isExtractingId, setIsExtractingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedBusiness = useMemo(
    () =>
      businesses.find((business) => business.id === selectedBusinessId) ?? null,
    [businesses, selectedBusinessId],
  );

  const completedCount = documents.filter(
    (document) => document.status === "COMPLETED",
  ).length;

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setError(null);
      setIsLoading(true);
      try {
        const loadedBusinesses = await getBusinesses();
        if (!isMounted) {
          return;
        }

        setBusinesses(loadedBusinesses);
        const firstBusiness = loadedBusinesses[0] ?? null;
        setSelectedBusinessId(firstBusiness?.id ?? null);

        if (firstBusiness) {
          await loadDocuments(firstBusiness.id);
        } else {
          setDocuments([]);
          setExtractions({});
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load documents.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function loadDocuments(businessId: number | null) {
    if (!businessId) {
      setDocuments([]);
      setExtractions({});
      return;
    }

    const [loadedDocuments, loadedExtractions] = await Promise.all([
      getDocuments({ businessId }),
      getDocumentExtractions(businessId),
    ]);
    setDocuments(loadedDocuments);
    setExtractions(
      Object.fromEntries(
        loadedExtractions.map((extraction) => [
          extraction.document_id,
          extraction,
        ]),
      ),
    );
  }

  async function handleBusinessChange(value: string) {
    const businessId = Number(value);
    setSelectedBusinessId(businessId);
    setError(null);
    setSuccess(null);
    setActiveExtraction(null);

    try {
      await loadDocuments(businessId);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load documents.",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedBusinessId) {
      setError("Create a business profile first.");
      return;
    }
    if (!selectedFile) {
      setError("Select a file to upload.");
      return;
    }

    setIsUploading(true);
    try {
      await uploadDocument(selectedBusinessId, documentType, selectedFile);
      setSelectedFile(null);
      event.currentTarget.reset();
      setDocumentType("GST_CERTIFICATE");
      await loadDocuments(selectedBusinessId);
      setSuccess("Document uploaded successfully.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload document.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRunExtraction(documentId: number) {
    setError(null);
    setSuccess(null);
    setIsExtractingId(documentId);
    try {
      const extraction = await runDocumentExtraction(documentId);
      setExtractions((current) => ({
        ...current,
        [documentId]: extraction,
      }));
      setDocuments((current) =>
        current.map((document) =>
          document.id === documentId
            ? {
                ...document,
                status: extraction.status,
                processed_at: extraction.processed_at,
              }
            : document,
        ),
      );
      setActiveExtraction(extraction);
      setSuccess("Extraction completed.");
    } catch (extractError) {
      setError(
        extractError instanceof Error
          ? extractError.message
          : "Unable to run extraction.",
      );
    } finally {
      setIsExtractingId(null);
    }
  }

  async function handleViewExtraction(documentId: number) {
    setError(null);
    try {
      const extraction = await getDocumentExtraction(documentId);
      setExtractions((current) => ({ ...current, [documentId]: extraction }));
      setActiveExtraction(extraction);
    } catch (viewError) {
      setError(
        viewError instanceof Error
          ? viewError.message
          : "Unable to load extraction.",
      );
    }
  }

  async function handleDelete(documentId: number) {
    setError(null);
    setSuccess(null);
    setIsDeletingId(documentId);
    try {
      await deleteDocument(documentId);
      setDocuments((current) =>
        current.filter((document) => document.id !== documentId),
      );
      setExtractions((current) => {
        const next = { ...current };
        delete next[documentId];
        return next;
      });
      if (activeExtraction?.document_id === documentId) {
        setActiveExtraction(null);
      }
      setSuccess("Document deleted successfully.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete document.",
      );
    } finally {
      setIsDeletingId(null);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Documents"
          title="Documents"
          description="Upload GST, Udyam, PAN, bank, and ITR files."
          action={
            <StatusBadge
              label={`${documents.length} uploaded`}
              tone={documents.length > 0 ? "online" : "neutral"}
            />
          }
        />

        {isLoading ? (
          <WorkspaceCard title="Loading documents">
            <ErrorState tone="neutral">Loading document workspace...</ErrorState>
          </WorkspaceCard>
        ) : businesses.length === 0 ? (
          <EmptyState
            title="Create a business profile first"
            description="Documents need a business profile before uploads can be linked to readiness checks."
            action={
              <WorkspaceButton asChild>
                <Link href="/onboarding">Go to Onboarding</Link>
              </WorkspaceButton>
            }
          />
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-3">
              <MetricCard
                label="Uploaded documents"
                value={documents.length}
                tone="red"
                description="Files on record"
              />
              <MetricCard
                label="Completed extraction"
                value={completedCount}
                tone="success"
                description="Ready for checks"
              />
              <MetricCard
                label="Pending review"
                value={documents.length - completedCount}
                tone="warning"
                description="Needs extraction"
              />
            </div>

            <WorkspaceCard
              title="Upload file"
              description="Choose business, document type, and file."
            >
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(220px,1.35fr)]">
                  <FormField label="Business">
                    <WorkspaceSelect
                      onChange={(event) =>
                        handleBusinessChange(event.target.value)
                      }
                      value={selectedBusinessId ?? ""}
                    >
                      {businesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.business_name}
                        </option>
                      ))}
                    </WorkspaceSelect>
                  </FormField>

                  <FormField label="Document type">
                    <WorkspaceSelect
                      onChange={(event) =>
                        setDocumentType(event.target.value as DocumentType)
                      }
                      value={documentType}
                    >
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </WorkspaceSelect>
                  </FormField>

                  <FormField
                    label="File"
                    helperText="Accepted: PDF, PNG, JPG, JPEG up to backend limit."
                  >
                    <WorkspaceInput
                      accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                      className="py-2 file:mr-3 file:rounded-md file:border-0 file:bg-red-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
                      onChange={(event) =>
                        setSelectedFile(event.target.files?.[0] ?? null)
                      }
                      type="file"
                    />
                  </FormField>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <WorkspaceButton disabled={isUploading} type="submit" size="lg">
                    {isUploading ? "Uploading..." : "Upload document"}
                  </WorkspaceButton>
                  <p className="text-sm text-stone-500">
                    {selectedBusiness
                      ? `Selected profile: ${selectedBusiness.business_name}`
                      : "No profile selected"}
                  </p>
                </div>
              </form>
            </WorkspaceCard>

            {error ? <ErrorState>{error}</ErrorState> : null}
            {success ? <ErrorState tone="success">{success}</ErrorState> : null}

            <WorkspaceCard
              title="Uploaded documents"
              description="Run extraction, view, download, or delete files."
            >
              {documents.length === 0 ? (
                <EmptyState
                  title="Upload GST, Udyam, PAN, Bank Statement, or ITR to begin."
                  description="Uploaded documents appear here."
                />
              ) : (
                <WorkspaceTable>
                  <thead>
                    <tr>
                      <WorkspaceTh>Document</WorkspaceTh>
                      <WorkspaceTh>Type</WorkspaceTh>
                      <WorkspaceTh>Status</WorkspaceTh>
                      <WorkspaceTh>Size</WorkspaceTh>
                      <WorkspaceTh>Uploaded</WorkspaceTh>
                      <WorkspaceTh>Actions</WorkspaceTh>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((document) => {
                      const hasExtraction = Boolean(extractions[document.id]);

                      return (
                        <tr className={workspaceRowClassName} key={document.id}>
                          <WorkspaceTd className="max-w-[240px]">
                            <p className="truncate font-semibold text-stone-950">
                              {document.original_filename}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">
                              Processed: {formatDate(document.processed_at)}
                            </p>
                          </WorkspaceTd>
                          <WorkspaceTd>{formatLabel(document.document_type)}</WorkspaceTd>
                          <WorkspaceTd>
                            <StatusPill
                              label={formatLabel(document.status)}
                              tone={statusTone(document.status)}
                            />
                          </WorkspaceTd>
                          <WorkspaceTd>{formatBytes(document.file_size_bytes)}</WorkspaceTd>
                          <WorkspaceTd>{formatDate(document.uploaded_at)}</WorkspaceTd>
                          <WorkspaceTd>
                            <div className="flex flex-wrap gap-2">
                              <WorkspaceButton
                                disabled={isExtractingId === document.id}
                                onClick={() => handleRunExtraction(document.id)}
                                type="button"
                                variant="secondary"
                                size="sm"
                              >
                                {isExtractingId === document.id
                                  ? "Extracting..."
                                  : "Run Extraction"}
                              </WorkspaceButton>
                              <WorkspaceButton
                                aria-label={
                                  hasExtraction
                                    ? "View extraction"
                                    : "Fetch extraction"
                                }
                                onClick={() => handleViewExtraction(document.id)}
                                type="button"
                                variant="ghost"
                                size="sm"
                              >
                                View
                              </WorkspaceButton>
                              <WorkspaceButton asChild variant="ghost" size="sm">
                                <a href={downloadDocument(document.id)}>Download</a>
                              </WorkspaceButton>
                              <WorkspaceButton
                                disabled={isDeletingId === document.id}
                                onClick={() => handleDelete(document.id)}
                                type="button"
                                variant="destructive"
                                size="sm"
                              >
                                {isDeletingId === document.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </WorkspaceButton>
                            </div>
                          </WorkspaceTd>
                        </tr>
                      );
                    })}
                  </tbody>
                </WorkspaceTable>
              )}
            </WorkspaceCard>

            {activeExtraction ? (
              <WorkspaceCard
                title="Extraction preview"
                description={`Document ${activeExtraction.document_id} · ${formatLabel(activeExtraction.extraction_status)}`}
                action={
                  <StatusPill
                    label={
                      activeExtraction.confidence_score === null
                        ? "No confidence score"
                        : `${Math.round(activeExtraction.confidence_score * 100)}% confidence`
                    }
                    tone={
                      activeExtraction.extraction_status === "COMPLETED"
                        ? "success"
                        : "warning"
                    }
                  />
                }
              >
                <pre className="max-h-80 overflow-auto rounded-lg border border-stone-200 bg-stone-50 p-4 text-xs leading-6 text-stone-700">
                  {JSON.stringify(activeExtraction.extracted_fields, null, 2)}
                </pre>
              </WorkspaceCard>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
