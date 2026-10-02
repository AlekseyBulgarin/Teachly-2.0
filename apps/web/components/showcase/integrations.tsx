"use client";

import {
  AppWindow,
  ArrowRight,
  Check,
  Layers3,
  Mail,
  MessageCircle,
  Network,
  Phone,
  Plug,
  Sparkles,
} from "lucide-react";
import { useEcosystem } from "@/lib/ecosystem-context";
import { PageHeader, SectionCard } from "@/components/ui";
import { PipelineStep } from "@/components/showcase/shared";
import { QuickSectionNav } from "@/components/showcase/quick-section-nav";

export function IntegrationsPage() {
  const { t, locale } = useEcosystem();
  const model = [
    { title: t("integrations.platformLabel"), detail: t("integrations.platformDetail"), icon: AppWindow },
    { title: t("integrations.coreLabel"), detail: t("integrations.coreDetail"), icon: Network },
    { title: t("integrations.modulesLabel"), detail: t("integrations.modulesDetail"), icon: Layers3 },
  ];

  return (
    <div className="flex flex-col gap-12 lg:gap-16 xl:pr-[176px]">
      <div id="overview" className="scroll-mt-28">
        <PageHeader
          eyebrow={t("integrations.eyebrow")}
          title={t("integrations.title")}
          description={t("integrations.description")}
          action={
            <a
              href="#contact"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
            >
              {t("integrations.primaryCta")}
              <ArrowRight aria-hidden="true" size={16} />
            </a>
          }
        />
      </div>

      <QuickSectionNav
        items={[
          { id: "overview", label: t("integrations.navOverview") },
          { id: "model", label: t("integrations.navModel") },
          { id: "process", label: t("integrations.navProcess") },
          { id: "contact", label: t("integrations.navContact") },
        ]}
      />

      <div id="model" className="scroll-mt-28">
        <SectionCard
          title={t("integrations.modelTitle")}
          detail={t("integrations.modelDetail")}
          icon={Network}
        >
          <div className="grid gap-3 p-5 md:grid-cols-3 md:gap-0 md:p-7">
            {model.map(({ title, detail, icon: Icon }, index) => (
              <div key={title} className="relative flex flex-col p-4 md:p-5">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200">
                  <Icon aria-hidden="true" size={20} />
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-emerald-200">
                  {title}
                </p>
                <p className="mt-3 text-[15px] leading-7 text-slate-300">{detail}</p>
                {index < model.length - 1 && (
                  <ArrowRight
                    aria-hidden="true"
                    size={18}
                    className="mt-5 text-slate-600 md:absolute md:right-0 md:top-1/2 md:mt-0 md:-translate-y-1/2"
                  />
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={t("integrations.rebuildTitle")}
        detail={t("integrations.rebuildDetail")}
        icon={Plug}
      >
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
          <ValuePoint text={t("integrations.rebuild1")} />
          <ValuePoint text={t("integrations.rebuild2")} />
          <ValuePoint text={t("integrations.rebuild3")} />
          <ValuePoint text={t("integrations.rebuild4")} />
        </div>
      </SectionCard>

      <div id="process" className="scroll-mt-28">
        <SectionCard
          title={t("integrations.processTitle")}
          detail={t("integrations.processDetail")}
          icon={Layers3}
        >
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-7">
            <PipelineStep index="01" title={t("integrations.process1")} detail={t("integrations.process1Detail")} icon={MessageCircle} />
            <PipelineStep index="02" title={t("integrations.process2")} detail={t("integrations.process2Detail")} icon={Network} />
            <PipelineStep index="03" title={t("integrations.process3")} detail={t("integrations.process3Detail")} icon={Plug} />
            <PipelineStep index="04" title={t("integrations.process4")} detail={t("integrations.process4Detail")} icon={Sparkles} last />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={t("integrations.valueTitle")}
        detail={t("integrations.valueDetail")}
        icon={Sparkles}
      >
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-7">
          <ValuePoint text={t("integrations.value1")} />
          <ValuePoint text={t("integrations.value2")} />
          <ValuePoint text={t("integrations.value3")} />
          <ValuePoint text={t("integrations.value4")} />
          <ValuePoint text={t("integrations.value5")} />
          <ValuePoint text={t("integrations.value6")} />
        </div>
      </SectionCard>

      <p className="px-1 text-sm leading-6 text-slate-500">
        {t("integrations.docsNote")}
      </p>

      <section
        id="contact"
        className="scroll-mt-28 overflow-hidden rounded-[32px] border border-emerald-300/20 bg-[linear-gradient(125deg,rgba(25,201,139,.16),rgba(14,23,37,.92)_58%)] p-7 sm:p-10"
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-200">
              {t("integrations.contactEyebrow")}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] text-slate-50 sm:text-4xl">
              {t("integrations.contactTitle")}
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              {t("integrations.contactDetail")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="https://t.me/teachlyecosystem" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.035] px-3.5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200">
              <MessageCircle aria-hidden="true" size={16} /> Telegram
            </a>
            <a href="tel:+79923135778" className="inline-flex items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.035] px-3.5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200">
              <Phone aria-hidden="true" size={16} /> +7 992 313-57-78
            </a>
            <a href="mailto:teachly@yandex.ru" className="inline-flex items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.035] px-3.5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200">
              <Mail aria-hidden="true" size={16} /> {locale === "ru" ? "Почта" : "Email"}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function ValuePoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[var(--surface-raised)] p-4 text-[15px] leading-7 text-slate-300">
      <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/10 text-emerald-200">
        <Check aria-hidden="true" size={12} />
      </span>
      <span>{text}</span>
    </div>
  );
}
