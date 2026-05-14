import { FeaturesSection } from "@/components/landing/features-section";
import { FinalCta } from "@/components/landing/final-cta";
import { ReadinessSection } from "@/components/landing/readiness-section";
import { WorkflowSection } from "@/components/landing/workflow-section";
import ShaderShowcase from "@/components/ui/hero";

export default function Home() {
  return (
    <main className="h-screen snap-y snap-mandatory overflow-y-auto scroll-smooth bg-black text-white">
      <ShaderShowcase />
      <FeaturesSection />
      <WorkflowSection />
      <ReadinessSection />
      <FinalCta />
    </main>
  );
}
