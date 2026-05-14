"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeIndianRupee,
  FileStack,
  FileText,
  Gauge,
  Handshake,
  Settings2,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { clearDemoSession, useDemoSession } from "@/lib/auth";

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const navigationGroups: Array<{
  items: NavigationItem[];
  label: string;
}> = [
  {
    label: "Setup",
    items: [
      {
        label: "Onboarding",
        href: "/onboarding",
        icon: UserRound,
      },
      {
        label: "Documents",
        href: "/documents",
        icon: FileStack,
      },
    ],
  },
  {
    label: "Readiness",
    items: [
      {
        label: "Audit",
        href: "/audit",
        icon: ShieldCheck,
      },
      {
        label: "LRI",
        href: "/lri",
        icon: Gauge,
      },
    ],
  },
  {
    label: "Workflow",
    items: [
      {
        label: "MOU",
        href: "/mou",
        icon: Handshake,
      },
      {
        label: "Grants",
        href: "/grants",
        icon: BadgeIndianRupee,
      },
      {
        label: "Reports",
        href: "/reports",
        icon: FileText,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Admin",
        href: "/admin",
        icon: Settings2,
      },
    ],
  },
];

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useDemoSession();

  function handleLogout() {
    clearDemoSession();
    router.push("/login");
  }

  const navItems = navigationGroups.flatMap((group) => group.items);

  const mobileNav = (
    <nav className="flex gap-1.5 overflow-x-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-medium backdrop-blur-xl transition",
              isActive
                ? "border-white/[0.35] bg-white/[0.18] text-white shadow-lg shadow-cyan-950/20"
                : "border-white/[0.12] bg-white/[0.055] text-white/[0.72] hover:border-white/[0.25] hover:bg-white/[0.11] hover:text-white",
            )}
          >
            <Icon className="mr-1.5 size-3.5" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const desktopNav = (
    <nav className="space-y-5">
      {navigationGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/[0.34]">
            {group.label}
          </p>
          <div className="grid gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium backdrop-blur-xl transition",
                    isActive
                      ? "bg-white/[0.13] text-white shadow-sm shadow-black/15 ring-1 ring-white/16"
                      : "text-white/[0.60] hover:bg-white/[0.075] hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-md border border-white/[0.10] bg-white/[0.055] shadow-inner shadow-white/5 transition",
                      isActive ? "text-white" : "text-white/[0.45] group-hover:text-white/[0.80]",
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  {item.label}
                  {isActive ? (
                    <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-white/[0.75]" />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] overflow-hidden border-r border-white/[0.12] bg-[#111214]/[0.94] text-white shadow-xl shadow-black/[0.22] backdrop-blur-xl lg:flex lg:flex-col">
        <div className="relative px-4 py-5">
          <Link href="/onboarding" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg border border-white/[0.18] bg-white/[0.12] text-xs font-semibold text-white shadow-sm shadow-black/20 backdrop-blur-xl">
              L
            </span>
            <span>
              <p className="text-sm font-medium tracking-normal text-white">
                Lankside
              </p>
              <p className="mt-0.5 text-[11px] font-normal text-white/[0.50]">
                MSME readiness
              </p>
            </span>
          </Link>
        </div>
        <div className="relative flex-1 overflow-y-auto px-2.5 py-1.5">{desktopNav}</div>
        <div className="relative border-t border-white/[0.12] p-3">
          {session ? (
            <div className="space-y-2.5 rounded-lg border border-white/[0.13] bg-white/[0.06] p-2.5 shadow-sm shadow-black/[0.12] backdrop-blur-xl">
              <div>
                <p className="truncate text-xs font-medium text-white">
                  {session.name}
                </p>
                <p className="truncate text-[11px] text-white/[0.50]">{session.email}</p>
              </div>
              <button
                className="w-full rounded-md border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-left text-xs font-medium text-white/[0.70] transition hover:bg-white/[0.10] hover:text-white"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Link
                className="rounded-md border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/[0.70] hover:bg-white/[0.10] hover:text-white"
                href="/login"
              >
                Login
              </Link>
              <Link
                className="rounded-md border border-white/[0.18] bg-white/[0.88] px-2.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-white"
                href="/signup"
              >
                Signup
              </Link>
            </div>
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/[0.12] bg-[#111214]/[0.94] text-white shadow-lg shadow-black/15 backdrop-blur-xl lg:hidden">
        <div className="px-4 py-3">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <Link href="/onboarding">
              <p className="text-sm font-medium text-white">Lankside</p>
              <p className="text-[11px] text-white/[0.54]">MSME readiness</p>
            </Link>
            {session ? (
              <button
                className="rounded-md border border-white/[0.12] bg-white/[0.05] px-2.5 py-1.5 text-xs font-medium text-white/[0.72]"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            ) : null}
          </div>
          {mobileNav}
        </div>
      </header>
    </>
  );
}
