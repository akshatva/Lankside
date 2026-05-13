"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { createBusiness, getBusinesses, updateBusiness } from "@/lib/api";
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

const fields: Array<{
  name: keyof FormState;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}> = [
  { name: "business_name", label: "Business Name", required: true },
  { name: "owner_name", label: "Owner Name", required: true },
  { name: "udyam_id", label: "Udyam ID", placeholder: "UDYAM-XX-00-0000000" },
  { name: "gstin", label: "GSTIN", placeholder: "22AAAAA0000A1Z5" },
  { name: "pan", label: "PAN", placeholder: "AAAAA0000A" },
  { name: "industry_type", label: "Industry Type" },
  { name: "state", label: "State" },
  { name: "city", label: "City" },
  {
    name: "business_age_years",
    label: "Business Age in Years",
    type: "number",
  },
  { name: "turnover_range", label: "Turnover Range" },
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
  const [form, setForm] = useState<FormState>(emptyForm);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mode = useMemo(() => (business ? "Update" : "Create"), [business]);

  useEffect(() => {
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
  }, []);

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
          title="MSME business profile"
          description="Create and maintain the demo business profile used by the product shell until authentication is added."
          action={
            <StatusBadge
              label={business ? "Profile saved" : "Profile pending"}
              tone={business ? "online" : "pending"}
            />
          }
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <form
            className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
            onSubmit={handleSubmit}
          >
            <div className="border-b border-stone-200 pb-4">
              <h2 className="text-lg font-semibold text-stone-950">
                {mode} profile
              </h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Required fields are business name and owner name.
              </p>
            </div>

            {isLoading ? (
              <p className="py-10 text-sm text-stone-600">
                Loading current business profile...
              </p>
            ) : (
              <>
                <div className="grid gap-4 py-5 md:grid-cols-2">
                  {fields.map((field) => (
                    <label className="flex flex-col gap-2" key={field.name}>
                      <span className="text-sm font-medium text-stone-700">
                        {field.label}
                        {field.required ? (
                          <span className="text-emerald-700"> *</span>
                        ) : null}
                      </span>
                      <input
                        className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
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
                    </label>
                  ))}
                </div>

                {error ? (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {success}
                  </div>
                ) : null}

                <button
                  className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? "Saving..." : `${mode} Profile`}
                </button>
              </>
            )}
          </form>

          <DashboardCard
            title="Saved business"
            description="The first demo business profile is shown in onboarding and dashboard."
          >
            {business ? (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-stone-500">Business</dt>
                  <dd className="mt-1 font-medium text-stone-950">
                    {business.business_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">Owner</dt>
                  <dd className="mt-1 text-stone-800">
                    {business.owner_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">Industry</dt>
                  <dd className="mt-1 text-stone-800">
                    {business.industry_type || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">City / State</dt>
                  <dd className="mt-1 text-stone-800">
                    {[business.city, business.state].filter(Boolean).join(", ") ||
                      "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">Registration</dt>
                  <dd className="mt-1 text-stone-800">
                    {business.udyam_id ||
                      business.gstin ||
                      business.pan ||
                      "Not provided"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm leading-6 text-stone-600">
                Complete the form to create the current demo business profile.
              </p>
            )}
          </DashboardCard>
        </div>
      </div>
    </AppShell>
  );
}
