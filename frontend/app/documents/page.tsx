"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import {
  deleteDocument,
  downloadDocument,
  getBusinesses,
  getDocuments,
  uploadDocument,
} from "@/lib/api";
import type { Business } from "@/types/business";
import type { DocumentRecord, DocumentType } from "@/types/document";

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

function formatDate(value: string) {
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

function statusTone(status: string): "online" | "offline" | "pending" | "neutral" {
  if (status === "COMPLETED") {
    return "online";
  }
  if (status === "FAILED") {
    return "offline";
  }
  if (status === "PENDING" || status === "PROCESSING") {
    return "pending";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedBusiness = useMemo(
    () =>
      businesses.find((business) => business.id === selectedBusinessId) ?? null,
    [businesses, selectedBusinessId],
  );

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
          const loadedDocuments = await getDocuments({
            businessId: firstBusiness.id,
          });
          if (isMounted) {
            setDocuments(loadedDocuments);
          }
        } else {
          setDocuments([]);
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
      return;
    }

    const loadedDocuments = await getDocuments({ businessId });
    setDocuments(loadedDocuments);
  }

  async function handleBusinessChange(value: string) {
    const businessId = Number(value);
    setSelectedBusinessId(businessId);
    setError(null);
    setSuccess(null);

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

  async function handleDelete(documentId: number) {
    setError(null);
    setSuccess(null);
    setIsDeletingId(documentId);
    try {
      await deleteDocument(documentId);
      setDocuments((current) =>
        current.filter((document) => document.id !== documentId),
      );
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
          title="Document upload"
          description="Upload and track local compliance document files for the selected MSME profile."
          action={
            <StatusBadge
              label={`${documents.length} uploaded`}
              tone={documents.length > 0 ? "online" : "neutral"}
            />
          }
        />

        {isLoading ? (
          <DashboardCard title="Loading documents">
            <p className="text-sm text-stone-600">Loading document workspace...</p>
          </DashboardCard>
        ) : businesses.length === 0 ? (
          <DashboardCard title="Create a business profile first">
            <a
              className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              href="/onboarding"
            >
              Go to Onboarding
            </a>
          </DashboardCard>
        ) : (
          <>
            <form
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
              onSubmit={handleSubmit}
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(220px,1.4fr)_auto] lg:items-end">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-stone-700">
                    Business
                  </span>
                  <select
                    className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
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
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-stone-700">
                    Document type
                  </span>
                  <select
                    className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
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
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-stone-700">
                    File
                  </span>
                  <input
                    accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    className="block h-11 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-700"
                    onChange={(event) =>
                      setSelectedFile(event.target.files?.[0] ?? null)
                    }
                    type="file"
                  />
                </label>

                <button
                  className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
                  disabled={isUploading}
                  type="submit"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>

              <div className="mt-4 text-sm text-stone-500">
                {selectedBusiness
                  ? `Selected profile: ${selectedBusiness.business_name}`
                  : "No profile selected"}
              </div>
            </form>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {success}
              </div>
            ) : null}

            <DashboardCard
              title="Uploaded documents"
              description="Metadata and processing status for stored local files."
            >
              {documents.length === 0 ? (
                <p className="text-sm text-stone-600">
                  No documents uploaded for this business yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                    <thead>
                      <tr className="text-stone-500">
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Original filename
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Type
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Status
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          File size
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Uploaded
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {documents.map((document) => (
                        <tr key={document.id}>
                          <td className="max-w-[220px] truncate px-3 py-3 font-medium text-stone-950">
                            {document.original_filename}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-stone-700">
                            {formatLabel(document.document_type)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <StatusBadge
                              label={formatLabel(document.status)}
                              tone={statusTone(document.status)}
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-stone-700">
                            {formatBytes(document.file_size_bytes)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-stone-700">
                            {formatDate(document.uploaded_at)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <div className="flex flex-wrap gap-2">
                              <a
                                className="inline-flex h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:border-emerald-300 hover:text-emerald-800"
                                href={downloadDocument(document.id)}
                              >
                                Download
                              </a>
                              <button
                                className="inline-flex h-9 items-center rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={isDeletingId === document.id}
                                onClick={() => handleDelete(document.id)}
                                type="button"
                              >
                                {isDeletingId === document.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DashboardCard>
          </>
        )}
      </div>
    </AppShell>
  );
}
