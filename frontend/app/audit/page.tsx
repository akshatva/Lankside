import { AppShell } from "@/components/app-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";

export default function AuditPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Audit"
          title="Compliance auditor"
          description="A future workspace for compliance checks and remediation tracking."
          action={<StatusBadge label="Static placeholder" tone="neutral" />}
        />
        <DashboardCard
          title="Compliance audit deferred"
          description="This phase does not implement audit logic, extraction checks, or readiness scoring."
        />
      </div>
    </AppShell>
  );
}
