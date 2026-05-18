import Link from "next/link";
import { ArrowUpRight, Landmark, Sparkles } from "lucide-react";

const navItems = [
  { label: "Engines", href: "#capabilities" },
  { label: "Workflow", href: "#workflow" },
  { label: "Readiness", href: "#readiness" },
];

export default function ShaderShowcase() {
  return (
    <section className="relative min-h-screen snap-start snap-always overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(6,182,212,0.34),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(249,115,22,0.28),transparent_28%),linear-gradient(135deg,#020617_0%,#030712_48%,#111827_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.54))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <header className="relative z-20 flex items-center justify-between gap-4 p-4 sm:p-6">
        <Link
          href="/"
          className="flex items-center gap-3 text-white transition hover:text-cyan-100"
        >
          <span className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-sm shadow-black/20">
            <Landmark className="size-5" aria-hidden="true" />
          </span>
          <span className="hidden text-sm font-semibold tracking-wide sm:block">
            Lankside
          </span>
        </Link>

        <nav className="hidden items-center space-x-2 sm:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-xs font-light text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          href="/login"
          className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-medium text-black transition-colors hover:bg-white/90"
        >
          Login
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </Link>
      </header>

      <main className="relative z-20 flex min-h-[calc(100vh-5rem)] items-end px-5 pb-28 sm:px-8 sm:pb-12">
        <div className="max-w-3xl text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2">
            <Sparkles className="size-4 text-cyan-200" aria-hidden="true" />
            <span className="text-sm font-medium tracking-wide text-white/90">
              AI readiness for subsidy-ready MSMEs
            </span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-none tracking-normal text-white sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="mb-2 block bg-gradient-to-r from-white via-cyan-200 to-orange-200 bg-clip-text text-3xl font-light tracking-normal text-transparent sm:text-4xl md:text-5xl lg:text-6xl">
              Bankability
            </span>
            <span className="block font-black text-white">Command</span>
            <span className="block font-light italic text-white/80">
              Center
            </span>
          </h1>

          <p className="mb-8 max-w-xl text-base font-light leading-7 text-white/70 sm:text-lg">
            Lankside helps Indian MSMEs audit documents, calculate readiness
            scores, generate MOUs, and match the right grants before they walk
            into a bank or government scheme.
          </p>

          <Link
            href="/signup"
            className="inline-flex rounded-full bg-gradient-to-r from-cyan-500 to-orange-500 px-8 py-4 text-sm font-semibold text-white shadow-md shadow-black/20 transition-colors hover:from-cyan-400 hover:to-orange-400 sm:px-10"
          >
            Start onboarding
          </Link>
        </div>
      </main>

      <div className="absolute bottom-6 right-6 z-20 hidden sm:block">
        <div className="flex size-16 items-center justify-center rounded-full border border-white/15 bg-white/8 text-center text-[10px] font-medium uppercase leading-4 tracking-[0.16em] text-white/72">
          Ready
        </div>
      </div>
    </section>
  );
}
