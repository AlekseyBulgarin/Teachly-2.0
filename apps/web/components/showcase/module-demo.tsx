"use client";

import type { ReactNode } from "react";
import { MonitorPlay } from "lucide-react";
import { useEcosystem } from "@/lib/ecosystem-context";
import { SectionCard } from "@/components/ui";

export function ModuleDemoSection({ children }: { children: ReactNode }) {
  const { t } = useEcosystem();
  return (
    <div id="demo" className="scroll-mt-28">
      <SectionCard
        className="section-reveal"
        title={t("demo.try")}
        detail={t("demo.detail")}
        icon={MonitorPlay}
      >
        <div className="p-5 sm:p-7">{children}</div>
      </SectionCard>
    </div>
  );
}
