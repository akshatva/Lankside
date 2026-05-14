"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { WorkspaceCard } from "@/components/workspace-card";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import {
  deleteMOU,
  downloadMOUPDF,
  exportMOUPDF,
  generateMOU,
  getBusinesses,
  getMOUs,
  updateMOU,
} from "@/lib/api";
import type { Business } from "@/types/business";
import type { MOU, MOUGenerateRequest } from "@/types/mou";

const reviewDisclaimer =
  "This is an AI-assisted draft and should be reviewed by a qualified legal professional before signing.";

type MOUFormState = Omit<MOUGenerateRequest, "business_id">;

const emptyForm: MOUFormState = {
  party_a_name: "",
  party_b_name: "",
  purpose: "",
  duration_months: 12,
  contribution_details: "",
  revenue_sharing: "",
  dispute_resolution: "",
  cluster_purpose: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: string): "online" | "pending" | "neutral" {
  if (status === "EXPORTED") {
    return "online";
  }
  if (status === "GENERATED") {
    return "pending";
  }
  return "neutral";
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MouPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(
    null,
  );
  const [mous, setMous] = useState<MOU[]>([]);
  const [activeMou, setActiveMou] = useState<MOU | null>(null);
  const [form, setForm] = useState<MOUFormState>(emptyForm);
  const [draftText, setDraftText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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
      setIsLoading(true);
      setError(null);

      try {
        const loadedBusinesses = await getBusinesses();
        if (!isMounted) {
          return;
        }

        setBusinesses(loadedBusinesses);
        const firstBusiness = loadedBusinesses[0] ?? null;
        setSelectedBusinessId(firstBusiness?.id ?? null);
        setForm({
          ...emptyForm,
          party_a_name: firstBusiness?.business_name ?? "",
        });

        if (firstBusiness) {
          const loadedMous = await getMOUs({ businessId: firstBusiness.id });
          if (isMounted) {
            setMous(loadedMous);
            selectMou(loadedMous[0] ?? null);
          }
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load MOU workspace.",
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

  function selectMou(mou: MOU | null) {
    setActiveMou(mou);
    setDraftText(mou?.draft_text ?? "");
    if (mou) {
      setForm({
        party_a_name: mou.party_a_name,
        party_b_name: mou.party_b_name,
        purpose: mou.purpose,
        duration_months: mou.duration_months,
        contribution_details: mou.contribution_details,
        revenue_sharing: mou.revenue_sharing,
        dispute_resolution: mou.dispute_resolution,
        cluster_purpose: mou.cluster_purpose,
      });
    }
  }

  async function loadMous(businessId: number | null) {
    if (!businessId) {
      setMous([]);
      selectMou(null);
      return;
    }
    const loadedMous = await getMOUs({ businessId });
    setMous(loadedMous);
    selectMou(loadedMous[0] ?? null);
  }

  async function handleBusinessChange(value: string) {
    const businessId = Number(value);
    const business = businesses.find((item) => item.id === businessId) ?? null;
    setSelectedBusinessId(businessId);
    setError(null);
    setSuccess(null);
    setForm({ ...emptyForm, party_a_name: business?.business_name ?? "" });
    setDraftText("");

    try {
      await loadMous(businessId);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load MOU history.",
      );
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedBusinessId) {
      setError("Create a business profile first.");
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generateMOU({
        business_id: selectedBusinessId,
        ...form,
      });
      setMous((current) => [
        generated,
        ...current.filter((mou) => mou.id !== generated.id),
      ]);
      selectMou(generated);
      setSuccess("MOU draft generated.");
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Unable to generate MOU draft.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    if (!activeMou) {
      setError("Generate or select an MOU first.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const updated = await updateMOU(activeMou.id, {
        ...form,
        draft_text: draftText,
      });
      setMous((current) =>
        current.map((mou) => (mou.id === updated.id ? updated : mou)),
      );
      selectMou(updated);
      setSuccess("MOU changes saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save MOU changes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExport(mouId: number) {
    setError(null);
    setSuccess(null);
    setExportingId(mouId);
    try {
      const exported = await exportMOUPDF(mouId);
      setMous((current) =>
        current.map((mou) => (mou.id === exported.id ? exported : mou)),
      );
      if (activeMou?.id === exported.id) {
        selectMou(exported);
      }
      setSuccess("PDF exported.");
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Unable to export PDF.",
      );
    } finally {
      setExportingId(null);
    }
  }

  async function handleDelete(mouId: number) {
    setError(null);
    setSuccess(null);
    setDeletingId(mouId);
    try {
      await deleteMOU(mouId);
      const remaining = mous.filter((mou) => mou.id !== mouId);
      setMous(remaining);
      if (activeMou?.id === mouId) {
        selectMou(remaining[0] ?? null);
      }
      setSuccess("MOU deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete MOU.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function updateField<K extends keyof MOUFormState>(
    field: K,
    value: MOUFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeader
          eyebrow="MOU Architect"
          title="MOU Drafts"
          description="Create simple collaboration drafts."
          action={
            <StatusBadge
              label={`${mous.length} generated`}
              tone={mous.length > 0 ? "online" : "neutral"}
            />
          }
        />

        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {reviewDisclaimer}
        </div>

        {isLoading ? (
          <WorkspaceCard title="Loading MOU workspace">
            <p className="text-sm text-stone-600">Loading business profiles...</p>
          </WorkspaceCard>
        ) : businesses.length === 0 ? (
          <WorkspaceCard title="Create a business profile first">
            <p className="text-sm text-stone-600">
              Create a business profile first.
            </p>
            <Link
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
              href="/onboarding"
            >
              Go to Onboarding
            </Link>
          </WorkspaceCard>
        ) : (
          <>
            <form
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
              onSubmit={handleGenerate}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-stone-700">
                    Business
                  </span>
                  <select
                    className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
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
                    Duration in Months
                  </span>
                  <input
                    className="h-11 rounded-md border border-stone-300 px-3 text-sm text-stone-950 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    min={1}
                    onChange={(event) =>
                      updateField("duration_months", Number(event.target.value))
                    }
                    required
                    type="number"
                    value={form.duration_months}
                  />
                </label>

                <TextInput
                  label="Party A Name"
                  onChange={(value) => updateField("party_a_name", value)}
                  value={form.party_a_name}
                />
                <TextInput
                  label="Party B Name"
                  onChange={(value) => updateField("party_b_name", value)}
                  value={form.party_b_name}
                />
                <TextAreaInput
                  label="Purpose"
                  onChange={(value) => updateField("purpose", value)}
                  value={form.purpose}
                />
                <TextAreaInput
                  label="Contribution Details"
                  onChange={(value) =>
                    updateField("contribution_details", value)
                  }
                  value={form.contribution_details}
                />
                <TextAreaInput
                  label="Revenue Sharing"
                  onChange={(value) => updateField("revenue_sharing", value)}
                  value={form.revenue_sharing}
                />
                <TextAreaInput
                  label="Dispute Resolution"
                  onChange={(value) => updateField("dispute_resolution", value)}
                  value={form.dispute_resolution}
                />
                <div className="lg:col-span-2">
                  <TextAreaInput
                    label="Cluster Purpose"
                    onChange={(value) => updateField("cluster_purpose", value)}
                    value={form.cluster_purpose}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
                  disabled={isGenerating}
                  type="submit"
                >
                  {isGenerating ? "Generating..." : "Generate Draft"}
                </button>
                <p className="text-sm text-stone-500">
                  {selectedBusiness
                    ? `Selected profile: ${selectedBusiness.business_name}`
                    : "No profile selected"}
                </p>
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

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
              <WorkspaceCard
                title={
                  activeMou
                    ? `Draft: ${activeMou.party_a_name} and ${activeMou.party_b_name}`
                    : "Generated draft preview"
                }
                description="Edit before exporting."
              >
                {activeMou ? (
                  <div className="space-y-4">
                    <textarea
                      className="min-h-[520px] w-full rounded-md border border-stone-300 bg-white p-3 font-mono text-sm leading-6 text-stone-950 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      onChange={(event) => setDraftText(event.target.value)}
                      value={draftText}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="inline-flex h-10 items-center rounded-md bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                        disabled={isSaving}
                        onClick={handleSave}
                        type="button"
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        className="inline-flex h-10 items-center rounded-md border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={exportingId === activeMou.id}
                        onClick={() => handleExport(activeMou.id)}
                        type="button"
                      >
                        {exportingId === activeMou.id
                          ? "Exporting..."
                          : "Export PDF"}
                      </button>
                      {activeMou.pdf_path ? (
                        <a
                          className="inline-flex h-10 items-center rounded-md border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                          href={downloadMOUPDF(activeMou.id)}
                        >
                          Download PDF
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-stone-600">
                    Generate an MOU or select one from history to view and edit
                    the draft.
                  </p>
                )}
              </WorkspaceCard>

              <WorkspaceCard
                title="Draft metadata"
                description="Current draft details."
              >
                {activeMou ? (
                  <dl className="space-y-3 text-sm">
                    <MetaRow label="Status">
                      <StatusBadge
                        label={formatStatus(activeMou.status)}
                        tone={statusTone(activeMou.status)}
                      />
                    </MetaRow>
                    <MetaRow label="Created">
                      <span>{formatDate(activeMou.created_at)}</span>
                    </MetaRow>
                    <MetaRow label="Purpose">
                      <span>{activeMou.purpose}</span>
                    </MetaRow>
                    <MetaRow label="PDF">
                      <span>
                        {activeMou.pdf_path ? "Generated" : "Not exported"}
                      </span>
                    </MetaRow>
                  </dl>
                ) : (
                  <p className="text-sm text-stone-600">
                    No MOU selected yet.
                  </p>
                )}
              </WorkspaceCard>
            </div>

            <WorkspaceCard
              title="MOU list"
              description="Draft history for this business."
            >
              {mous.length === 0 ? (
                <p className="text-sm text-stone-600">
                  No MOU drafts generated for this business yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                    <thead>
                      <tr className="text-stone-500">
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Party A
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Party B
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Purpose
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Status
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Created
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {mous.map((mou) => (
                        <tr key={mou.id}>
                          <td className="whitespace-nowrap px-3 py-3 font-medium text-stone-950">
                            {mou.party_a_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-stone-700">
                            {mou.party_b_name}
                          </td>
                          <td className="max-w-[280px] truncate px-3 py-3 text-stone-700">
                            {mou.purpose}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <StatusBadge
                              label={formatStatus(mou.status)}
                              tone={statusTone(mou.status)}
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-stone-700">
                            {formatDate(mou.created_at)}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="inline-flex h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                                onClick={() => selectMou(mou)}
                                type="button"
                              >
                                View/Edit
                              </button>
                              <button
                                className="inline-flex h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={exportingId === mou.id}
                                onClick={() => handleExport(mou.id)}
                                type="button"
                              >
                                {exportingId === mou.id
                                  ? "Exporting..."
                                  : "Export PDF"}
                              </button>
                              {mou.pdf_path ? (
                                <a
                                  className="inline-flex h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                                  href={downloadMOUPDF(mou.id)}
                                >
                                  Download PDF
                                </a>
                              ) : null}
                              <button
                                className="inline-flex h-9 items-center rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={deletingId === mou.id}
                                onClick={() => handleDelete(mou.id)}
                                type="button"
                              >
                                {deletingId === mou.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </WorkspaceCard>
          </>
        )}
      </div>
    </AppShell>
  );
}

type TextInputProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

function TextInput({ label, onChange, value }: TextInputProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="h-11 rounded-md border border-stone-300 px-3 text-sm text-stone-950 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
        onChange={(event) => onChange(event.target.value)}
        required
        value={value}
      />
    </label>
  );
}

function TextAreaInput({ label, onChange, value }: TextInputProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <textarea
        className="min-h-28 rounded-md border border-stone-300 p-3 text-sm leading-6 text-stone-950 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
        onChange={(event) => onChange(event.target.value)}
        required
        value={value}
      />
    </label>
  );
}

type MetaRowProps = {
  children: ReactNode;
  label: string;
};

function MetaRow({ children, label }: MetaRowProps) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="mt-1 font-medium text-stone-950">{children}</dd>
    </div>
  );
}
