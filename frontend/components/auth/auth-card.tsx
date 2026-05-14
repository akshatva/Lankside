import Link from "next/link";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-16 text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.22),transparent_30%),radial-gradient(circle_at_75%_70%,rgba(249,115,22,0.18),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      <div className="absolute -left-32 top-24 size-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute -right-28 bottom-16 size-72 rounded-full bg-orange-500/10 blur-3xl" />

      <section className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mx-auto mb-8 flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:border-cyan-300/35 hover:bg-white/[0.09]"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
            L
          </span>
          Lankside
        </Link>

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.065] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
          <div className="absolute bottom-0 right-0 size-32 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative">
            <p className="mb-3 text-xs font-medium tracking-[0.2em] text-cyan-200">
              MSME READINESS WORKFLOW
            </p>
            <h1 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/65">{subtitle}</p>
          </div>

          <div className="relative mt-8">{children}</div>

          <div className="relative mt-6 border-t border-white/10 pt-5 text-center text-sm text-white/65">
            {footer}
          </div>
        </div>

        <p className="mx-auto mt-5 max-w-sm text-center text-xs leading-5 text-white/45">
          Demo authentication is used for this MVP build. Production auth
          should use secure server-side authentication.
        </p>
      </section>
    </main>
  );
}
