"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  FormField,
  WorkspaceInput,
} from "@/components/ui/form-field";
import { MetricCard } from "@/components/ui/metric-card";
import { WorkspaceButton } from "@/components/ui/workspace-button";
import { WorkspaceCard } from "@/components/ui/workspace-card";
import { createBusiness, getBusinesses, updateBusiness } from "@/lib/api";
import { useDemoSession } from "@/lib/auth";
import type { Business, BusinessPayload } from "@/types/business";

type FormState = {
  business_name: string;
  owner_name: string;
  udyam_id: string;
  gstin: string;
  pan: string;
  industry_type: string;
  state: string;
  city: string;
  business_age_years: string;
  turnover_range: string;
};

type FieldConfig = {
  helperText?: string;
  name: keyof FormState;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
};

const emptyForm: FormState = {
  business_name: "",
  owner_name: "",
  udyam_id: "",
  gstin: "",
  pan: "",
  industry_type: "",
  state: "",
  city: "",
  business_age_years: "",
  turnover_range: "",
};

const fieldGroups: Array<{
  description: string;
  fields: FieldConfig[];
  title: string;
}> = [
  {
    title: "Business Identity",
    description: "Basic business details.",
    fields: [
      {
        name: "business_name",
        label: "Business Name",
        placeholder: "Kaveri Textiles",
        required: true,
      },
      {
        name: "owner_name",
        label: "Owner Name",
        placeholder: "Founder or proprietor",
        required: true,
      },
      {
        name: "industry_type",
        label: "Industry Type",
        placeholder: "Textiles, packaging, medical distribution",
      },
    ],
  },
  {
    title: "Registration Details",
    description: "IDs used for document checks.",
    fields: [
      {
        name: "udyam_id",
        label: "Udyam ID",
        helperText: "MSME registration ID.",
        placeholder: "UDYAM-XX-00-0000000",
      },
      {
        name: "gstin",
        label: "GSTIN",
        helperText: "Used for audit matching.",
        placeholder: "22AAAAA0000A1Z5",
      },
      {
        name: "pan",
        label: "PAN",
        placeholder: "AAAAA0000A",
      },
    ],
  },
  {
    title: "Location & Operations",
    description: "Context for grants and score.",
    fields: [
      { name: "state", label: "State", placeholder: "Karnataka" },
      { name: "city", label: "City", placeholder: "Bengaluru" },
      {
        name: "business_age_years",
        label: "Business Age in Years",
        type: "number",
        placeholder: "5",
      },
      {
        name: "turnover_range",
        label: "Turnover Range",
        placeholder: "50L-1Cr",
      },
    ],
  },
];

function businessToForm(business: Business): FormState {
  return {
    business_name: business.business_name,
    owner_name: business.owner_name,
    udyam_id: business.udyam_id ?? "",
    gstin: business.gstin ?? "",
    pan: business.pan ?? "",
    industry_type: business.industry_type ?? "",
    state: business.state ?? "",
    city: business.city ?? "",
    business_age_years:
      business.business_age_years === null
        ? ""
        : String(business.business_age_years),
    turnover_range: business.turnover_range ?? "",
  };
}

function toPayload(form: FormState): BusinessPayload {
  const age = form.business_age_years.trim();

  return {
    business_name: form.business_name.trim(),
    owner_name: form.owner_name.trim(),
    udyam_id: form.udyam_id.trim() || null,
    gstin: form.gstin.trim() || null,
    pan: form.pan.trim() || null,
    industry_type: form.industry_type.trim() || null,
    state: form.state.trim() || null,
    city: form.city.trim() || null,
    business_age_years: age === "" ? null : Number(age),
    turnover_range: form.turnover_range.trim() || null,
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const session = useDemoSession();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mode = useMemo(() => (business ? "Update" : "Create"), [business]);

  useEffect(() => {
    if (!session) {
      router.replace("/signup");
    }
  }, [router, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isMounted = true;

    getBusinesses()
      .then((businesses) => {
        if (!isMounted) {
          return;
        }

        const currentBusiness = businesses[0] ?? null;
        setBusiness(currentBusiness);
        if (currentBusiness) {
          setForm(businessToForm(currentBusiness));
        }
      })
      .catch((loadError) => {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load business profile.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const payload = toPayload(form);
      const savedBusiness = business
        ? await updateBusiness(business.id, payload)
        : await createBusiness(payload);

      setBusiness(savedBusiness);
      setForm(businessToForm(savedBusiness));
      setSuccess(
        business
          ? "Business profile updated successfully."
          : "Business profile created successfully.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save business profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Onboarding"
          title="Business Profile"
          description="Add your MSME details before checking documents."
          action={
            <StatusBadge
              label={business ? "Profile saved" : "Profile pending"}
              tone={business ? "online" : "pending"}
            />
          }
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <WorkspaceCard
            title={`${mode} profile`}
            description="Business name and owner name are required."
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              {!session || isLoading ? (
                <ErrorState tone="neutral">
                  Preparing your onboarding workspace...
                </ErrorState>
              ) : (
                <>
                  {fieldGroups.map((group) => (
                    <section
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      key={group.title}
                    >
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-slate-950">
                          {group.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {group.description}
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {group.fields.map((field) => (
                          <FormField
                            helperText={field.helperText}
                            key={field.name}
                            label={field.label}
                            required={field.required}
                          >
                            <WorkspaceInput
                              min={field.type === "number" ? 0 : undefined}
                              name={field.name}
                              onChange={(event) =>
                                updateField(field.name, event.target.value)
                              }
                              placeholder={field.placeholder}
                              required={field.required}
                              type={field.type ?? "text"}
                              value={form[field.name]}
                            />
                          </FormField>
                        ))}
                      </div>
                    </section>
                  ))}

                  {error ? <ErrorState>{error}</ErrorState> : null}
                  {success ? (
                    <ErrorState tone="success">{success}</ErrorState>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3">
                    <WorkspaceButton disabled={isSaving} type="submit" size="lg">
                      {isSaving ? "Saving..." : `${mode} profile`}
                    </WorkspaceButton>
                    {business ? (
                      <WorkspaceButton asChild variant="secondary" size="lg">
                        <Link href="/documents">Go to Documents</Link>
                      </WorkspaceButton>
                    ) : null}
                  </div>
                </>
              )}
            </form>
          </WorkspaceCard>

          <div className="space-y-5">
            <WorkspaceCard
              title="Profile summary"
              description="Saved business details."
            >
              {business ? (
                <div className="space-y-5">
                  <MetricCard
                    label="Current business"
                    value={business.business_name}
                    description={business.owner_name}
                    tone="info"
                  />
                  <dl className="grid gap-3 text-sm">
                    <ProfileRow label="Industry">
                      {business.industry_type || "Not provided"}
                    </ProfileRow>
                    <ProfileRow label="City / State">
                      {[business.city, business.state].filter(Boolean).join(", ") ||
                        "Not provided"}
                    </ProfileRow>
                    <ProfileRow label="Registration">
                      {business.udyam_id ||
                        business.gstin ||
                        business.pan ||
                        "Not provided"}
                    </ProfileRow>
                    <ProfileRow label="Turnover">
                      {business.turnover_range || "Not provided"}
                    </ProfileRow>
                  </dl>
                </div>
              ) : (
                <EmptyState
                  title="No readiness profile yet"
                  description="Create a profile to continue."
                />
              )}
            </WorkspaceCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ProfileRow({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-slate-950">{children}</dd>
    </div>
  );
}
