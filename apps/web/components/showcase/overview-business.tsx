import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Building2,
  Check,
  CircleAlert,
  Code2,
  GraduationCap,
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";

const copy = {
  ru: {
    problem: {
      eyebrow: "Зачем это бизнесу",
      title: "Образовательный продукт растёт быстрее, когда новые возможности не приходится собирать заново",
      detail: "Отдельные сервисы, ручные отчёты и несвязанные данные замедляют команду. Teachly добавляет единый образовательный контур поверх уже работающего продукта.",
      pains: [
        ["Долгая разработка", "Каждый новый учебный сценарий требует проектирования, данных и отдельного интерфейса."],
        ["Разрозненные инструменты", "Задания, прогресс, AI и работа преподавателя живут в разных системах."],
        ["Нет общей картины", "Руководитель видит активность, но не всегда понимает качество учебного процесса."],
      ],
      values: [
        ["Запуск по одному сценарию", "Начните с нужного модуля и расширяйте решение после проверки пользы."],
        ["Один учебный контекст", "Следующие модули используют уже подключённые сущности и результаты."],
        ["Управляемая интеграция", "Ваша платформа остаётся точкой входа, а Teachly отвечает за образовательный слой."],
      ],
    },
    core: {
      eyebrow: "Teachly Core",
      title: "Одно ядро соединяет модули, данные и роли",
      detail: "Teachly Core принимает разрешённый контекст из вашего продукта, применяет серверные правила и возвращает результат в привычный интерфейс пользователя.",
      note: "Teachly не заменяет LMS, CRM или личный кабинет",
      points: ["Пользователи и доступ", "Учебный контекст", "Состояние и прогресс", "Единые API-контракты"],
      product: "Ваш продукт",
      core: "Teachly Core",
      modules: "Подключаемые модули",
    },
    audiences: {
      eyebrow: "Для разных команд",
      title: "Одна система — понятная ценность для каждого участника",
      detail: "Каждая роль получает свой рабочий результат, но использует общий проверяемый учебный контекст.",
      items: [
        ["Владелец и руководитель", "Быстрее проверяет новые продуктовые сценарии и видит состояние учебного процесса."],
        ["Учебная часть", "Находит проблемные темы, группы и задания без ручной сборки отчётов."],
        ["Преподаватель", "Понимает, кому помочь первым и какое действие будет уместно."],
        ["Ученик", "Получает связанную практику, объяснение и понятный следующий шаг."],
      ],
    },
    segments: {
      eyebrow: "Для кого Teachly",
      title: "Расширяйте продукт, не меняя его основу",
      detail: "Teachly подключается к разным моделям образовательного бизнеса, когда команде нужны новые функции поверх существующей платформы.",
      items: [
        ["Онлайн-школа", "Готовые модули помогают быстрее развивать собственный кабинет и меньше отвлекать внутреннюю команду."],
        ["LMS-платформа", "Дополнительный образовательный слой расширяет продукт без создания всей инфраструктуры заново."],
        ["EdTech-продукт", "Связанная основа для обучения позволяет команде сосредоточиться на главной ценности своего продукта."],
      ],
    },
    compare: {
      eyebrow: "Практический выбор",
      title: "Собственная разработка и набор сервисов — не единственные варианты",
      detail: "Teachly полезен там, где продукту нужна своя логика и интерфейс, но нет смысла заново строить каждый образовательный модуль.",
      headings: ["Критерий", "Собрать самостоятельно", "Несколько сервисов", "Teachly"],
      rows: [
        ["Первый сценарий", "Полный цикл разработки", "Несколько подключений", "Один ограниченный пилот"],
        ["Учебный контекст", "Нужно проектировать", "Разделён между системами", "Общий для модулей"],
        ["Интерфейс продукта", "Полный контроль", "Частые переходы наружу", "Остаётся вашим"],
        ["Расширение", "Новая разработка", "Новый поставщик", "Следующий модуль на том же ядре"],
      ],
    },
    integration: {
      eyebrow: "Граница ответственности",
      title: "Понятно, что делает Teachly, а что остаётся у вашей команды",
      detail: "На старте фиксируем данные, роли, точки встраивания и критерии готовности. Доменные правила и права проверяются на сервере.",
      ours: "Teachly отвечает",
      theirs: "Ваша команда отвечает",
      oursItems: ["Контракты и образовательные модули", "Обработка учебного состояния", "Документация и техническая поддержка", "Наблюдаемость своего контура"],
      theirsItems: ["Доступ к согласованным данным", "Точки встраивания в ваш интерфейс", "Правила авторизации пользователей", "Приёмка сценария и обратная связь"],
      cto: "Технический сценарий интеграции",
    },
    pilot: {
      eyebrow: "Пилот Teachly",
      title: "Не большой проект, а проверяемый первый сценарий",
      detail: "Пилот нужен, чтобы подтвердить ценность на вашем продукте и данных до масштабного внедрения. Его границы и критерии согласуются заранее.",
      steps: [
        ["01", "Диагностика", "Выбираем проблему, пользователя и измеримый критерий приёмки."],
        ["02", "Интеграционный контур", "Согласуем данные, роли, API и место модуля в вашем продукте."],
        ["03", "Запуск сценария", "Подключаем один модуль и проверяем полный пользовательский путь."],
        ["04", "Решение о развитии", "Фиксируем результат, ограничения и следующий полезный модуль."],
      ],
      included: "В пилот входит",
      includes: ["Согласованный сценарий", "Интеграционная схема", "Настройка первого модуля", "Проверка и итоговый разбор"],
      action: "Запросить демонстрацию",
    },
    trust: {
      eyebrow: "Честная стадия продукта",
      title: "Показываем возможности без обещаний, которых ещё нет",
      detail: "В каталоге отмечено, что уже работает, что является интерактивным прототипом и что находится в плане. Пилот начинается только с согласованных возможностей.",
      principles: ["Сервер — источник правил и прав", "AI не выставляет итоговую оценку", "Схема данных меняется через миграции", "Интеграция ограничена согласованным scope"],
      about: "Teachly развивается как модульный образовательный слой для B2B-продуктов. Мы начинаем с прикладного пилота, работаем вместе с командой клиента и расширяем систему только после подтверждения сценария.",
      faq: [
        ["Нужно ли переносить пользователей и курсы?", "Нет. В пилоте согласуется минимальный набор данных, который Teachly получает из существующего продукта."],
        ["Можно ли начать только с одного модуля?", "Да. Это базовый сценарий: одна проблема, один пользовательский путь и заранее понятная приёмка."],
        ["Что происходит с AI без ключа провайдера?", "Остальная платформа продолжает работать. AI-слой изолирован и включается после настройки провайдера."],
      ],
    },
  },
  en: {
    problem: {
      eyebrow: "Why it matters",
      title: "Education products grow faster when every new capability does not need to be rebuilt",
      detail: "Separate tools, manual reporting and disconnected data slow teams down. Teachly adds one education layer on top of the product that already works.",
      pains: [
        ["Slow delivery", "Every new learning workflow needs product design, data and a separate interface."],
        ["Disconnected tools", "Tasks, progress, AI and teacher workflows live in separate systems."],
        ["No shared picture", "Leaders see activity but cannot always understand the learning process."],
      ],
      values: [
        ["Launch one workflow", "Start with the module you need and expand after its value is validated."],
        ["One learning context", "The next modules reuse connected entities and outcomes."],
        ["Controlled integration", "Your platform remains the entry point; Teachly owns the education layer."],
      ],
    },
    core: {
      eyebrow: "Teachly Core",
      title: "One core connects modules, data and roles",
      detail: "Teachly Core receives approved context from your product, applies server-side rules and returns the outcome to the user's familiar interface.",
      note: "Teachly does not replace your LMS, CRM or customer portal",
      points: ["Users and access", "Learning context", "State and progress", "Shared API contracts"],
      product: "Your product",
      core: "Teachly Core",
      modules: "Connected modules",
    },
    audiences: {
      eyebrow: "For each team",
      title: "One system, a clear outcome for every participant",
      detail: "Each role gets a useful workflow while working from the same verifiable learning context.",
      items: [
        ["Owner and leadership", "Validate new product workflows faster and see the state of learning."],
        ["Academic team", "Find difficult topics, cohorts and tasks without manual reporting."],
        ["Teacher", "See who needs help first and which action is appropriate."],
        ["Learner", "Get connected practice, explanation and a clear next step."],
      ],
    },
    segments: {
      eyebrow: "Who Teachly is for",
      title: "Expand your product without replacing its foundation",
      detail: "Teachly connects to different education business models when teams need new capabilities on top of an existing platform.",
      items: [
        ["Online school", "Ready modules help improve your learner portal faster without pulling the internal team into every subsystem."],
        ["LMS platform", "An additional education layer expands the product without rebuilding the full infrastructure."],
        ["EdTech product", "A connected learning foundation lets the team focus on the product's core value."],
      ],
    },
    compare: {
      eyebrow: "A practical choice",
      title: "Building in-house or combining tools are not the only options",
      detail: "Teachly fits products that need their own logic and interface without rebuilding every education module.",
      headings: ["Criterion", "Build in-house", "Several tools", "Teachly"],
      rows: [
        ["First workflow", "Full delivery cycle", "Several integrations", "One bounded pilot"],
        ["Learning context", "Must be designed", "Split across systems", "Shared by modules"],
        ["Product interface", "Full control", "Frequent external handoffs", "Remains yours"],
        ["Expansion", "New development", "Another vendor", "Next module on the same core"],
      ],
    },
    integration: {
      eyebrow: "Clear ownership",
      title: "Know what Teachly owns and what stays with your team",
      detail: "At the start, we define data, roles, embedding points and acceptance criteria. Domain rules and permissions are enforced server-side.",
      ours: "Teachly owns",
      theirs: "Your team owns",
      oursItems: ["Contracts and education modules", "Learning-state processing", "Documentation and technical support", "Observability of the Teachly layer"],
      theirsItems: ["Access to agreed data", "Embedding points in your interface", "User authentication rules", "Workflow acceptance and feedback"],
      cto: "Explore the technical integration",
    },
    pilot: {
      eyebrow: "Teachly pilot",
      title: "A verifiable first workflow, not a large transformation project",
      detail: "The pilot validates value inside your product before a wider rollout. Its scope and acceptance criteria are agreed in advance.",
      steps: [
        ["01", "Discovery", "Choose the problem, user and measurable acceptance criterion."],
        ["02", "Integration boundary", "Agree data, roles, API and where the module lives in your product."],
        ["03", "Workflow launch", "Connect one module and validate the complete user journey."],
        ["04", "Expansion decision", "Record outcomes, constraints and the next useful module."],
      ],
      included: "Included in the pilot",
      includes: ["Agreed workflow", "Integration map", "First module setup", "Validation and final review"],
      action: "Request a demo",
    },
    trust: {
      eyebrow: "An honest product stage",
      title: "Capabilities without claims that are not ready yet",
      detail: "The catalog distinguishes what works now, what is an interactive prototype and what is planned. A pilot only starts with agreed capabilities.",
      principles: ["The server owns rules and permissions", "AI does not issue final grades", "Data changes use reviewed migrations", "Integration is limited to an agreed scope"],
      about: "Teachly is being developed as a modular education layer for B2B products. We start with a practical pilot, work alongside the client's team and expand only after the workflow is validated.",
      faq: [
        ["Do users and courses need to be migrated?", "No. The pilot defines the minimum data Teachly receives from the existing product."],
        ["Can we start with one module?", "Yes. The default is one problem, one user journey and explicit acceptance criteria."],
        ["What happens to AI without a provider key?", "The rest of the platform keeps working. The AI layer is isolated and enabled after provider configuration."],
      ],
    },
  },
} as const;

function Heading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <div className="max-w-3xl"><p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-300">{eyebrow}</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.045em] text-slate-50 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">{title}</h2><p className="mt-5 text-base leading-8 text-slate-400">{detail}</p></div>;
}

export function BusinessProblemAndCore({ locale }: { locale: Locale }) {
  const c = copy[locale];
  return <>
    <section id="business" className="section-reveal scroll-mt-28">
      <Heading {...c.problem} />
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="rounded-[30px] border border-rose-300/10 bg-rose-300/[.025] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-rose-200/80">{locale === "ru" ? "Что мешает росту" : "What slows growth"}</p><div className="mt-6 space-y-6">{c.problem.pains.map(([title, detail]) => <div key={title} className="flex gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-300/[.07] text-rose-200"><CircleAlert size={18} /></span><div><h3 className="font-semibold text-slate-100">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p></div></div>)}</div></div>
        <div className="rounded-[30px] border border-emerald-300/15 bg-emerald-300/[.04] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-200">{locale === "ru" ? "Что меняет Teachly" : "What Teachly changes"}</p><div className="mt-6 space-y-6">{c.problem.values.map(([title, detail]) => <div key={title} className="flex gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/[.09] text-emerald-200"><Check size={18} /></span><div><h3 className="font-semibold text-slate-100">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p></div></div>)}</div></div>
      </div>
    </section>

    <section className="section-reveal overflow-hidden rounded-[34px] border border-white/[.09] bg-[radial-gradient(circle_at_50%_0%,rgba(25,201,139,.11),transparent_42%),var(--surface)] p-7 sm:p-10 lg:p-12">
      <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
        <div><Heading {...c.core} /><p className="mt-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[.055] px-4 py-2 text-sm font-semibold text-cyan-100"><ShieldCheck size={16} />{c.core.note}</p></div>
        <div className="relative grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          {[{ label: c.core.product, icon: Building2 }, { label: c.core.core, icon: Network }, { label: c.core.modules, icon: Blocks }].map(({ label, icon: Icon }, index) => <div className={`rounded-2xl border p-5 text-center ${index === 1 ? "border-emerald-300/25 bg-emerald-300/[.09]" : "border-white/[.08] bg-black/15"}`} key={label}><Icon className="mx-auto text-emerald-200" size={22} /><p className="mt-3 text-sm font-semibold text-slate-100">{label}</p>{index === 1 && <div className="mt-4 flex flex-wrap justify-center gap-1.5">{c.core.points.map((point) => <span key={point} className="rounded-md bg-white/[.055] px-2 py-1 text-[9px] text-slate-400">{point}</span>)}</div>}</div>).flatMap((node, index) => index < 2 ? [node, <ArrowRight key={`arrow-${index}`} className="hidden text-slate-600 sm:block" size={17} />] : [node])}
        </div>
      </div>
    </section>
  </>;
}

export function AudienceAndComparison({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const icons = [Building2, GraduationCap, UsersRound, Sparkles] as const;
  return <>
    <section className="section-reveal">
      <Heading {...c.segments} />
      <div className="mt-10 grid gap-4 lg:grid-cols-3">{c.segments.items.map(([title, detail], index) => <div key={title} className="card-lift relative overflow-hidden rounded-3xl border border-white/[.08] bg-[linear-gradient(145deg,rgba(125,182,255,.06),transparent_55%),var(--surface)] p-7"><span className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald-300">0{index + 1}</span><h3 className="mt-8 text-xl font-semibold text-slate-100">{title}</h3><p className="mt-3 text-[15px] leading-7 text-slate-400">{detail}</p></div>)}</div>
    </section>
    <section className="section-reveal">
      <Heading {...c.audiences} />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{c.audiences.items.map(([title, detail], index) => { const Icon = icons[index]; return <div key={title} className="card-lift rounded-3xl border border-white/[.08] bg-white/[.025] p-6"><span className="flex size-11 items-center justify-center rounded-2xl bg-white/[.05] text-emerald-200"><Icon size={19} /></span><h3 className="mt-6 text-lg font-semibold text-slate-100">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{detail}</p></div>; })}</div>
    </section>
    <section className="section-reveal overflow-hidden rounded-[34px] border border-white/[.08] bg-[var(--surface)] p-6 sm:p-8 lg:p-10">
      <Heading {...c.compare} />
      <div className="mt-8 overflow-x-auto rounded-2xl border border-white/[.08]"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white/[.035] text-slate-300"><tr>{c.compare.headings.map((item, index) => <th key={item} className={`px-5 py-4 font-semibold ${index === 3 ? "bg-emerald-300/[.07] text-emerald-100" : ""}`}>{item}</th>)}</tr></thead><tbody>{c.compare.rows.map((row) => <tr key={row[0]} className="border-t border-white/[.07]">{row.map((item, index) => <td key={item} className={`px-5 py-4 leading-6 ${index === 0 ? "font-semibold text-slate-200" : index === 3 ? "bg-emerald-300/[.045] text-emerald-100" : "text-slate-400"}`}>{item}</td>)}</tr>)}</tbody></table></div>
    </section>
  </>;
}

export function IntegrationPilotAndTrust({ locale }: { locale: Locale }) {
  const c = copy[locale];
  return <>
    <section id="developers" className="section-reveal scroll-mt-28 grid gap-8 rounded-[34px] border border-white/[.08] bg-white/[.025] p-7 sm:p-10 lg:grid-cols-[.8fr_1.2fr] lg:p-12">
      <div><Heading {...c.integration} /><Link href="/integrations" className="interactive mt-7 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-emerald-100"><Code2 size={17} />{c.integration.cto}<ArrowRight size={16} /></Link></div>
      <div className="grid gap-4 sm:grid-cols-2">{[[c.integration.ours, c.integration.oursItems], [c.integration.theirs, c.integration.theirsItems]].map(([title, items], index) => <div key={title as string} className={`rounded-3xl border p-6 ${index === 0 ? "border-emerald-300/15 bg-emerald-300/[.04]" : "border-white/[.08] bg-black/15"}`}><h3 className="font-semibold text-slate-100">{title}</h3><div className="mt-5 space-y-3">{(items as readonly string[]).map((item) => <p key={item} className="flex gap-2 text-sm leading-6 text-slate-400"><Check className="mt-1 shrink-0 text-emerald-300" size={14} />{item}</p>)}</div></div>)}</div>
    </section>

    <section id="pilot" className="section-reveal scroll-mt-28 overflow-hidden rounded-[36px] border border-emerald-300/18 bg-[linear-gradient(130deg,rgba(25,201,139,.11),transparent_50%),var(--surface)] p-7 sm:p-10 lg:p-12">
      <Heading {...c.pilot} />
      <div className="mt-10 grid gap-4 lg:grid-cols-4">{c.pilot.steps.map(([step, title, detail]) => <div key={step} className="rounded-3xl border border-white/[.08] bg-black/15 p-6"><span className="text-2xl font-semibold text-emerald-200/40">{step}</span><h3 className="mt-5 font-semibold text-slate-100">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p></div>)}</div>
      <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-white/[.08] bg-white/[.025] p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">{c.pilot.included}</p><div className="mt-3 flex flex-wrap gap-3">{c.pilot.includes.map((item) => <span key={item} className="inline-flex items-center gap-2 text-sm text-slate-300"><Check size={14} className="text-emerald-300" />{item}</span>)}</div></div><a href="#contact" className="interactive inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-semibold text-slate-950 hover:bg-emerald-200">{c.pilot.action}<ArrowRight size={16} /></a></div>
    </section>

    <section id="about" className="section-reveal scroll-mt-28 grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:items-start"><Heading {...c.trust} /><div className="space-y-4"><div className="rounded-[30px] border border-white/[.08] bg-white/[.025] p-7 sm:p-8"><p className="text-base leading-8 text-slate-300">{c.trust.about}</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{c.trust.principles.map((item) => <p key={item} className="flex gap-3 rounded-2xl border border-white/[.07] bg-black/15 p-4 text-sm leading-6 text-slate-300"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-300" size={17} />{item}</p>)}</div></div><div className="space-y-2">{c.trust.faq.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-white/[.08] bg-white/[.025] p-5"><summary className="cursor-pointer list-none pr-6 font-semibold text-slate-200 marker:hidden">{question}<span className="float-right text-emerald-300 transition group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-7 text-slate-400">{answer}</p></details>)}</div></div></section>
  </>;
}
