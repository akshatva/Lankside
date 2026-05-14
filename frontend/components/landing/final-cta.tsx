import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ScrollReveal } from "@/components/landing/scroll-reveal";
import DotPattern from "@/components/ui/dot-pattern-1";

export function FinalCta() {
  return (
    <section className="relative flex min-h-screen snap-start snap-always items-center overflow-hidden bg-black px-5 py-24 text-white sm:px-8 lg:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(6,182,212,0.18),transparent_32%),radial-gradient(circle_at_70%_70%,rgba(249,115,22,0.16),transparent_28%)]" />

      <ScrollReveal className="mx-auto w-full max-w-5xl px-6 xl:px-0">
        <div className="relative flex flex-col items-center border border-red-500">
          <DotPattern
            width={5}
            height={5}
            className="fill-red-500/25 md:fill-red-500/35"
          />

          <div className="absolute -left-1.5 -top-1.5 h-3 w-3 bg-red-500 text-white" />
          <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 bg-red-500 text-white" />
          <div className="absolute -right-1.5 -top-1.5 h-3 w-3 bg-red-500 text-white" />
          <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 bg-red-500 text-white" />

          <div className="relative z-20 mx-auto max-w-5xl rounded-[40px] py-5 md:p-8 xl:py-12">
            <p className="md:text-md text-xs text-red-500 lg:text-lg xl:text-2xl">
              Lankside believes
            </p>

            <div className="text-2xl font-thin tracking-normal text-white/84 md:text-4xl lg:text-6xl xl:text-7xl">
              <div className="flex flex-wrap gap-1 md:gap-2 lg:gap-3 xl:gap-4">
                <h2 className="font-thin">&quot;Proof-ready MSMEs</h2>
                <p>move faster</p>
              </div>
              <div className="flex flex-wrap gap-1 md:gap-2 lg:gap-3 xl:gap-4">
                <p>when banks ask,</p>
                <h2 className="font-thin">schemes open,</h2>
              </div>
              <div className="flex flex-wrap gap-1 md:gap-2 lg:gap-3 xl:gap-4">
                <p>or partners</p>
                <h2 className="font-thin">need confidence.</h2>
              </div>
              <h2 className="font-thin">Be ready before the ask.&quot;</h2>
            </div>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black shadow-lg transition duration-300 hover:bg-white/90 hover:shadow-xl"
              >
                Start Onboarding
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <p className="mt-8 max-w-3xl text-xs leading-5 text-red-500/80">
              Lankside is an informational readiness platform. It does not
              guarantee loan approval, subsidy approval, or legal certification.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
