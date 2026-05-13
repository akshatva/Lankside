import Link from "next/link";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Documents", href: "/documents" },
  { label: "Audit", href: "/audit" },
  { label: "LRI Score", href: "/lri" },
  { label: "MOU Architect", href: "/mou" },
  { label: "Grant Scout", href: "/grants" },
  { label: "Reports", href: "/reports" },
  { label: "Demo Admin", href: "/admin" },
];

export function AppSidebar() {
  return (
    <aside className="w-full shrink-0 lg:w-64">
      <nav className="rounded-lg border border-stone-200 bg-white p-2 shadow-sm">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Workspace
        </div>
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-emerald-50 hover:text-emerald-800"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
