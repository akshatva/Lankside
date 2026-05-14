"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { clearDemoSession, useDemoSession } from "@/lib/auth";

export function AuthStatus() {
  const router = useRouter();
  const session = useDemoSession();

  function handleLogout() {
    clearDemoSession();
    router.push("/login");
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
          href="/login"
        >
          Login
        </Link>
        <Link
          className="rounded-full border border-slate-950 bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          href="/signup"
        >
          Signup
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-stone-950">{session.name}</p>
        <p className="text-xs text-stone-500">{session.email}</p>
      </div>
      <button
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        onClick={handleLogout}
        type="button"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Logout
      </button>
    </div>
  );
}
