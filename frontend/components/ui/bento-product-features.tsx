import * as React from "react";

import { cn } from "@/lib/utils";

interface BentoGridShowcaseProps {
  integration: React.ReactNode;
  trackers: React.ReactNode;
  statistic: React.ReactNode;
  focus: React.ReactNode;
  productivity: React.ReactNode;
  shortcuts: React.ReactNode;
  className?: string;
}

export const BentoGridShowcase = ({
  integration,
  trackers,
  statistic,
  focus,
  productivity,
  shortcuts,
  className,
}: BentoGridShowcaseProps) => {
  return (
    <section
      className={cn(
        "grid w-full grid-cols-1 gap-6 md:grid-cols-3",
        "md:grid-rows-3",
        "auto-rows-[minmax(180px,auto)]",
        className,
      )}
    >
      <div className="md:col-span-1 md:row-span-3">
        {integration}
      </div>

      <div className="md:col-span-1 md:row-span-1">
        {trackers}
      </div>

      <div className="md:col-span-1 md:row-span-1">
        {statistic}
      </div>

      <div className="md:col-span-1 md:row-span-1">
        {focus}
      </div>

      <div className="md:col-span-1 md:row-span-1">
        {productivity}
      </div>

      <div className="md:col-span-2 md:row-span-1">
        {shortcuts}
      </div>
    </section>
  );
};
