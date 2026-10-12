"use client";

import {
  AppWindow,
  ArrowRight,
  Check,
  Braces,
  Database,
  KeyRound,
  Layers3,
  Mail,
  MessageCircle,
  Network,
  Phone,
  Plug,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEcosystem } from "@/lib/ecosystem-context";
import { capabilityRegistry } from "@/lib/capabilities";
import { PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { PipelineStep } from "@/components/showcase/shared";
import { QuickSectionNav } from "@/components/showcase/quick-section-nav";
import { IntegrationProof } from "@/components/showcase/demos/integration-proof";

export function IntegrationsPage() {
  const { t, locale } = useEcosystem();
  const technicalCapabilities = locale === "ru"
    ? [
        { title: "API и контракты", detail: "Версионированный /v1, OpenAPI и типизированный клиент для пилотной интеграции.", status: "PILOT", icon: Braces },
        { title: "Авторизация и scopes", detail: "Workspace API key, ограниченные права и серверное хранение секретов.", status: "PILOT", icon: KeyRound },
        { title: "Модель данных", detail: "Связи внешних пользователей, учебные события и идемпотентные команды.", status: "PILOT", icon: Database },
        { title: "Контроль API", detail: "Изоляция организаций, ограничения запросов, request ID, аудит и метрики.", status: "PILOT", icon: ShieldCheck },
        { title: "Sandbox / demo-контур", detail: "Reference consumer и отдельный demo workspace показывают интеграцию без доступа к секретам.", status: "DEMO", icon: Network },
        { title: "Webhooks, SDK и embed", detail: "Подключаются только после подтверждения требований реального пилота.", status: "PLANNED", icon: Plug },
      ]
    : [
        { title: "API and contracts", detail: "Versioned /v1, OpenAPI and a typed client for the pilot integration.", status: "PILOT", icon: Braces },
        { title: "Authentication and scopes", detail: "Workspace API keys, bounded permissions and server-side secret storage.", status: "PILOT", icon: KeyRound },
        { title: "Data model", detail: "External-user mappings, learning events and idempotent commands.", status: "PILOT", icon: Database },
        { title: "API controls", detail: "Organization isolation, request limits, request IDs, auditing and metrics.", status: "PILOT", icon: ShieldCheck },
        { title: "Sandbox / demo environment", detail: "A reference consumer and isolated demo workspace show the integration without exposing secrets.", status: "DEMO", icon: Network },
        { title: "Webhooks, SDK and embed", detail: "Added only after a real pilot validates the integration requirements.", status: "PLANNED", icon: Plug },
      ];
  const model = [
    { title: t("integrations.platformLabel"), detail: t("integrations.platformDetail"), icon: AppWindow },
    { title: t("integrations.coreLabel"), detail: t("integrations.coreDetail"), icon: Network },
    { title: t("integrations.modulesLabel"), detail: t("integrations.modulesDetail"), icon: Layers3 },
  ];
  const ownerOverview = locale === "ru"
    ? [
        ["Остаётся у вас", "Интерфейс, пользователи, авторизация, курсы, биллинг и продуктовая логика."],
        ["Даёт Teachly", "Единое ядро, серверные образовательные модули и связанные учебные данные."],
        ["Передаётся по согласованию", "Только нужные внешние идентификаторы, учебный контекст и результаты выбранного сценария."],
        ["Первый результат", "Один ограниченный сценарий с заранее согласованными критериями приёмки."],
      ]
    : [
        ["Stays with you", "Your interface, users, authentication, courses, billing and product logic."],
        ["Teachly provides", "One core, server-side education modules and connected learning data."],
        ["Shared by agreement", "Only the external identifiers, learning context and outcomes required by the selected workflow."],
        ["First outcome", "One bounded workflow with acceptance criteria agreed in advance."],
      ];

  return (
    <div className="flex flex-col gap-12 lg:gap-16 xl:pr-[176px]">
      <div id="overview" className="scroll-mt-28">
        <PageHeader
          eyebrow={t("integrations.eyebrow")}
          title={t("integrations.title")}
          description={t("integrations.description")}
          action={
            <div className="flex flex-wrap items-center justify-end gap-3">
              <StatusBadge status={capabilityRegistry.integrations.publicStatus} locale={locale} />
              <a
                href="#contact"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
              >
                {t("integrations.primaryCta")}
                <ArrowRight aria-hidden="true" size={16} />
              </a>
            </div>
          }
        />
      </div>

      <QuickSectionNav
        items={[
          { id: "overview", label: t("integrations.navOverview") },
          { id: "owner", label: locale === "ru" ? "Для владельца" : "For owners" },
          { id: "proof", label: locale === "ru" ? "API-доступ" : "API access" },
          { id: "technical", label: locale === "ru" ? "Для CTO" : "For CTOs" },
          { id: "contact", label: t("integrations.navContact") },
        ]}
      />

      <section id="owner" className="scroll-mt-28">
        <p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-300">{locale === "ru" ? "Для владельца продукта" : "For the product owner"}</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-.04em] text-slate-50 sm:text-4xl">{locale === "ru" ? "Понятная граница интеграции до разговора о технологии" : "A clear integration boundary before the technology discussion"}</h2>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400">{locale === "ru" ? "Teachly дополняет работающий продукт. Первая интеграция начинается с одной задачи и минимального набора данных — без миграции на новую LMS." : "Teachly extends a product that already works. The first integration starts with one need and the minimum data required, without migrating to another LMS."}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {ownerOverview.map(([title, detail], index) => <div key={title} className={`rounded-2xl border p-5 ${index === 1 ? "border-emerald-300/15 bg-emerald-300/[.045]" : "border-white/[.08] bg-white/[.025]"}`}><p className="font-semibold text-slate-100">{title}</p><p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p></div>)}
        </div>
      </section>

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

      <section className="border-t border-white/[.08] pt-4">
        <p className="text-[11px] font-bold uppercase tracking-[.22em] text-cyan-300">{locale === "ru" ? "Для CTO и разработчика" : "For the CTO and developer"}</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-.04em] text-slate-50 sm:text-4xl">{locale === "ru" ? "Контракты и контроль, которые можно проверить" : "Contracts and controls your team can verify"}</h2>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400">{locale === "ru" ? "Ниже — реальный demo-контур, жизненный цикл API-ключа и техническая поверхность пилотной интеграции." : "Below is the real demo environment, API-key lifecycle and technical surface of the pilot integration."}</p>
      </section>

      <div id="proof" className="scroll-mt-28">
        <SectionCard
          title={locale === "ru" ? "Живое подключение и жизненный цикл ключа" : "Live connection and key lifecycle"}
          detail={locale === "ru" ? "Показываем безопасные сведения реальной demo-интеграции — без раскрытия секрета." : "Safe details from the live demo integration, without exposing its secret."}
          icon={KeyRound}
          action={<StatusBadge status="PILOT" locale={locale} />}
        >
          <div className="p-5 sm:p-7"><IntegrationProof /></div>
        </SectionCard>
      </div>

      <div id="technical" className="scroll-mt-28">
        <SectionCard
          title={locale === "ru" ? "Техническая готовность подключения" : "Technical integration readiness"}
          detail={locale === "ru" ? "Отделяем доступные контракты от возможностей, которые появятся только после проверки реального интеграционного сценария." : "Available contracts are separated from capabilities that will be added only after a real integration workflow is validated."}
          icon={Braces}
        >
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-3">
            {technicalCapabilities.map(({ title, detail, status, icon: Icon }) => (
              <div key={title} className="card-lift rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-300/[.08] text-emerald-200"><Icon aria-hidden="true" size={18} /></span>
                  <StatusBadge status={status} locale={locale} />
                </div>
                <h3 className="mt-5 font-semibold text-slate-100">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 border-t border-[var(--border)] px-5 py-5 sm:px-7">
            <a href="https://github.com/AlekseyBulgarin/Teachly-2.0/blob/main/docs/integrations/quickstart.md" target="_blank" rel="noreferrer" className="interactive inline-flex items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.035] px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/[.075]">
              {locale === "ru" ? "Открыть integration guide" : "Open the integration guide"}<ArrowRight aria-hidden="true" size={15} />
            </a>
            <a href="https://teachlyapi-production.up.railway.app/docs" target="_blank" rel="noreferrer" className="interactive inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/[.1]">
              {locale === "ru" ? "Посмотреть OpenAPI" : "View OpenAPI"}<ArrowRight aria-hidden="true" size={15} />
            </a>
          </div>
        </SectionCard>
      </div>

      <p className="px-1 text-sm leading-6 text-slate-400">
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
