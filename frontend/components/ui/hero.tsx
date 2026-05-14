"use client";

import { useEffect, useRef, useState } from "react";
import { MeshGradient, PulsingBorder } from "@paper-design/shaders-react";
import { motion } from "framer-motion";
import { ArrowUpRight, Landmark, Sparkles } from "lucide-react";

const particles = [
  { left: "28%", top: "34%", x: 8 },
  { left: "42%", top: "24%", x: -6 },
  { left: "58%", top: "38%", x: 10 },
  { left: "66%", top: "58%", x: -8 },
  { left: "36%", top: "64%", x: 5 },
  { left: "52%", top: "48%", x: -10 },
];

const navItems = [
  { label: "Engines", href: "#capabilities" },
  { label: "Workflow", href: "#workflow" },
  { label: "Readiness", href: "#readiness" },
];

export default function ShaderShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleMouseEnter = () => setIsActive(true);
    const handleMouseLeave = () => setIsActive(false);

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen snap-start snap-always overflow-hidden bg-black"
    >
      <svg className="absolute inset-0 h-0 w-0">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.02
                      0 1 0 0 0.02
                      0 0 1 0 0.05
                      0 0 0 0.9 0"
              result="tint"
            />
          </filter>
          <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
          <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="text-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <MeshGradient
        className="absolute inset-0 h-full w-full"
        colors={["#000000", "#06b6d4", "#0891b2", "#164e63", "#f97316"]}
        speed={isActive ? 0.45 : 0.28}
      />
      <MeshGradient
        className="absolute inset-0 h-full w-full opacity-60"
        colors={["#000000", "#ffffff", "#06b6d4", "#f97316"]}
        speed={isActive ? 0.3 : 0.18}
      />
      <div className="absolute inset-0 bg-black/25" />

      <header className="relative z-20 flex items-center justify-between gap-4 p-4 sm:p-6">
        <motion.div
          className="group relative flex cursor-pointer items-center gap-3"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <motion.div
            className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:shadow-lg group-hover:shadow-cyan-400/30"
            style={{ filter: "url(#logo-glow)" }}
            whileHover={{
              rotate: [0, -2, 2, 0],
              transition: { duration: 0.6, ease: "easeInOut" },
            }}
          >
            <Landmark className="size-5" aria-hidden="true" />
          </motion.div>
          <span className="hidden text-sm font-semibold tracking-wide text-white sm:block">
            Lankside
          </span>

          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {particles.map((particle, index) => (
              <motion.div
                key={`${particle.left}-${particle.top}`}
                className="absolute size-1 rounded-full bg-white/60"
                style={{ left: particle.left, top: particle.top }}
                animate={{
                  y: [-10, -20, -10],
                  x: [0, particle.x, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: index * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>

        <nav className="hidden items-center space-x-2 sm:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-xs font-light text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div
          id="gooey-btn"
          className="group relative flex items-center"
          style={{ filter: "url(#gooey-filter)" }}
        >
          <a
            href="/login"
            className="absolute right-0 z-0 flex h-8 -translate-x-10 cursor-pointer items-center justify-center rounded-full bg-white px-2.5 py-2 text-xs font-normal text-black transition-all duration-300 hover:bg-white/90 group-hover:-translate-x-16"
            aria-label="Open login"
          >
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </a>
          <a
            href="/login"
            className="z-10 flex h-8 cursor-pointer items-center rounded-full bg-white px-6 py-2 text-xs font-normal text-black transition-all duration-300 hover:bg-white/90"
          >
            Login
          </a>
        </div>
      </header>

      <main className="relative z-20 flex min-h-[calc(100vh-5rem)] items-end px-5 pb-28 sm:px-8 sm:pb-12">
        <div className="max-w-3xl text-left">
          <motion.div
            className="relative mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
            style={{ filter: "url(#glass-effect)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute left-1 right-1 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
            <Sparkles className="relative z-10 size-4 text-cyan-200" />
            <span className="relative z-10 text-sm font-medium tracking-wide text-white/90">
              AI readiness for subsidy-ready MSMEs
            </span>
          </motion.div>

          <motion.h1
            className="mb-6 text-5xl font-bold leading-none tracking-normal text-white sm:text-6xl md:text-7xl lg:text-8xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.span
              className="mb-2 block text-3xl font-light tracking-normal text-white/90 sm:text-4xl md:text-5xl lg:text-6xl"
              style={{
                background:
                  "linear-gradient(135deg, #ffffff 0%, #06b6d4 30%, #f97316 70%, #ffffff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "url(#text-glow)",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              Bankability
            </motion.span>
            <span className="block font-black text-white drop-shadow-2xl">
              Command
            </span>
            <span className="block font-light italic text-white/80">
              Center
            </span>
          </motion.h1>

          <motion.p
            className="mb-8 max-w-xl text-base font-light leading-7 text-white/70 sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Lankside helps Indian MSMEs audit documents, calculate readiness
            scores, generate MOUs, and match the right grants before they walk
            into a bank or government scheme.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center gap-4 sm:gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <motion.a
              href="/signup"
              className="rounded-full bg-gradient-to-r from-cyan-500 to-orange-500 px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-cyan-400 hover:to-orange-400 hover:shadow-xl sm:px-10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start onboarding
            </motion.a>
          </motion.div>
        </div>
      </main>

      <div className="absolute bottom-6 right-6 z-30 hidden sm:block">
        <div className="relative flex size-20 items-center justify-center">
          <PulsingBorder
            colors={[
              "#06b6d4",
              "#0891b2",
              "#f97316",
              "#00FF88",
              "#FFD700",
              "#FF6B35",
              "#ffffff",
            ]}
            colorBack="#00000000"
            speed={1.5}
            roundness={1}
            thickness={0.1}
            softness={0.2}
            intensity={5}
            spots={5}
            spotSize={0.1}
            pulse={0.1}
            smoke={0.5}
            smokeSize={4}
            scale={0.65}
            rotation={0}
            frame={9161408.251009725}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
            }}
          />

          <motion.svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{ transform: "scale(1.6)" }}
          >
            <defs>
              <path
                id="lankside-circle"
                d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
              />
            </defs>
            <text className="fill-white/80 text-sm font-medium">
              <textPath href="#lankside-circle" startOffset="0%">
                Lankside readiness - audit - grants - bankability -
              </textPath>
            </text>
          </motion.svg>
        </div>
      </div>
    </div>
  );
}
