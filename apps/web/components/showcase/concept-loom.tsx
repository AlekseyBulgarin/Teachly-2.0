"use client";

import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  CircleHelp,
  Compass,
  ExternalLink,
  GraduationCap,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  Waypoints,
} from "lucide-react";
import { useState } from "react";
import { useEcosystem } from "@/lib/ecosystem-context";
import type { Locale } from "@/lib/i18n";
import { capabilityRegistry } from "@/lib/capabilities";
import { IconCard, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { EcosystemNextStep, PipelineStep } from "@/components/showcase/shared";
import { QuickSectionNav } from "@/components/showcase/quick-section-nav";

type Scenario = {
  id: string;
  label: string;
  goal: string;
  frontier: readonly string[];
  route: readonly string[];
  checkpoint: {
    question: string;
    choices: readonly { key: string; label: string }[];
    correct: string;
    rationale: string;
  };
};

const scenarios: Record<Locale, readonly Scenario[]> = {
  ru: [
    {
      id: "fractions",
      label: "Математика",
      goal: "Научиться выбирать действие с дробями в практической задаче",
      frontier: [
        "Ученик узнаёт дробь, но не связывает её с частью целого.",
        "Ученик понимает доли, но путается при разных знаменателях.",
        "Ученик выполняет вычисление, но не переносит правило в новую задачу.",
      ],
      route: ["Часть и целое", "Общий знаменатель", "Сложение дробей", "Новая практическая задача"],
      checkpoint: {
        question: "Почему перед сложением 1/3 и 1/6 нужно привести дроби к общему знаменателю?",
        choices: [
          { key: "a", label: "Чтобы числители стали одинаковыми" },
          { key: "b", label: "Чтобы сравнивать и складывать одинаковые доли" },
          { key: "c", label: "Чтобы дроби превратились в целые числа" },
        ],
        correct: "b",
        rationale: "Знаменатель задаёт размер доли. Складывать можно только доли одинакового размера.",
      },
    },
    {
      id: "data-safety",
      label: "Корпоративное обучение",
      goal: "Научить сотрудника безопасно работать с персональными данными",
      frontier: [
        "Сотрудник знает термин, но не распознаёт персональные данные в рабочих примерах.",
        "Сотрудник распознаёт данные, но не выбирает безопасный канал передачи.",
        "Сотрудник знает правила, но ещё не применяет их в новой ситуации.",
      ],
      route: ["Что считается данными", "Контекст и риск", "Безопасный канал", "Новая рабочая ситуация"],
      checkpoint: {
        question: "Клиент прислал паспортные данные в личный мессенджер. Какой первый полезный шаг?",
        choices: [
          { key: "a", label: "Переслать данные коллеге для консультации" },
          { key: "b", label: "Перенести работу в утверждённый защищённый канал" },
          { key: "c", label: "Сохранить сообщение в личных заметках" },
        ],
        correct: "b",
        rationale: "Сначала нужно вернуть данные в контролируемый процесс с согласованными правами доступа.",
      },
    },
    {
      id: "teacher-feedback",
      label: "Развитие преподавателей",
      goal: "Научить преподавателя разбирать причину ошибки, а не только исправлять ответ",
      frontier: [
        "Преподаватель видит неверный ответ, но не отделяет случайную ошибку от пробела.",
        "Преподаватель находит пробел, но даёт слишком широкое объяснение.",
        "Преподаватель объясняет точечно, но ещё не проверяет перенос понимания.",
      ],
      route: ["Сигнал ошибки", "Гипотеза о причине", "Точечная помощь", "Проверка переноса"],
      checkpoint: {
        question: "Что лучше всего подтверждает, что ученик понял исправление?",
        choices: [
          { key: "a", label: "Ученик повторил формулировку преподавателя" },
          { key: "b", label: "Ученик применил связь в новой задаче" },
          { key: "c", label: "Ученик согласился с правильным ответом" },
        ],
        correct: "b",
        rationale: "Перенос в новую ситуацию показывает, что связь стала применимой, а не просто узнаваемой.",
      },
    },
  ],
  en: [
    {
      id: "fractions",
      label: "Mathematics",
      goal: "Choose the right fraction operation in a practical problem",
      frontier: [
        "The learner recognises a fraction but does not connect it to part of a whole.",
        "The learner understands shares but struggles with different denominators.",
        "The learner can calculate but cannot transfer the rule to a new problem.",
      ],
      route: ["Part and whole", "Common denominator", "Adding fractions", "New practical problem"],
      checkpoint: {
        question: "Why do 1/3 and 1/6 need a common denominator before they can be added?",
        choices: [
          { key: "a", label: "To make the numerators equal" },
          { key: "b", label: "To compare and add shares of the same size" },
          { key: "c", label: "To turn the fractions into whole numbers" },
        ],
        correct: "b",
        rationale: "The denominator defines the size of a share. Only shares of the same size can be added.",
      },
    },
    {
      id: "data-safety",
      label: "Workplace learning",
      goal: "Teach an employee to handle personal data safely",
      frontier: [
        "The employee knows the term but cannot identify personal data in working examples.",
        "The employee recognises the data but does not choose a safe transfer channel.",
        "The employee knows the rules but has not applied them in a new situation yet.",
      ],
      route: ["What counts as data", "Context and risk", "Safe channel", "New work situation"],
      checkpoint: {
        question: "A client sent passport data in a personal messenger. What is the first useful step?",
        choices: [
          { key: "a", label: "Forward it to a colleague for advice" },
          { key: "b", label: "Move the work into an approved secure channel" },
          { key: "c", label: "Save the message in personal notes" },
        ],
        correct: "b",
        rationale: "First return the data to a controlled process with agreed access rights.",
      },
    },
    {
      id: "teacher-feedback",
      label: "Teacher development",
      goal: "Help a teacher diagnose the cause of an error instead of only correcting the answer",
      frontier: [
        "The teacher sees a wrong answer but cannot separate a slip from a knowledge gap.",
        "The teacher finds the gap but gives an explanation that is too broad.",
        "The teacher gives focused help but does not yet check transfer.",
      ],
      route: ["Error signal", "Cause hypothesis", "Focused support", "Transfer check"],
      checkpoint: {
        question: "What best confirms that a learner understood the correction?",
        choices: [
          { key: "a", label: "The learner repeats the teacher's wording" },
          { key: "b", label: "The learner applies the connection in a new task" },
          { key: "c", label: "The learner agrees with the correct answer" },
        ],
        correct: "b",
        rationale: "Transfer to a new situation shows that the connection is usable, not merely recognisable.",
      },
    },
  ],
};

const copy = {
  ru: {
    eyebrow: "Concept Loom / интерактивный прототип",
    title: "Превратите широкую тему в короткий маршрут к пониманию.",
    description: "Teachly определяет практическую цель, находит границу знаний и ведёт ученика по одной необходимой связи за раз. Команда получает не очередной чат, а управляемый учебный сценарий.",
    nav: ["Обзор", "Как работает", "Демо", "Ценность", "Интеграция"],
    flowTitle: "Пять шагов вместо длинного общего объяснения",
    flowDetail: "Метод сохраняет фокус на результате и проверяет, стало ли понимание применимым.",
    steps: [
      ["Цель", "Фиксируем наблюдаемый практический результат."],
      ["Граница знаний", "Находим последнюю устойчивую связь и первый реальный пробел."],
      ["Маршрут", "Оставляем только необходимые зависимости до цели."],
      ["Проверка", "Скрываем ответ до попытки и различаем узнавание, воспроизведение и применение."],
      ["Закрепление", "Сохраняем подтверждённые связи и точный следующий шаг."],
    ],
    demoTitle: "Попробуйте механику на трёх учебных сценариях",
    demoDetail: "Это локальный showcase-прототип: результат не сохраняется, AI не вызывается, а production-оценивание не заявлено.",
    chooseScenario: "1. Выберите сценарий",
    chooseFrontier: "2. Укажите предполагаемую границу",
    levels: ["Начало", "Основа", "Применение"],
    map: "3. Минимальный маршрут",
    frontier: "Предполагаемая граница знаний",
    checkpoint: "4. Проверка понимания без подсказки ответа",
    unknown: "Пока не знаю",
    reveal: "Показать следующий шаг",
    reset: "Начать заново",
    result: "Что меняется в маршруте",
    resultAccurate: "В демонстрации связь подтверждена. Следующий шаг — проверить перенос в новой ситуации.",
    resultRepair: "Ответ показывает, какую связь стоит разобрать до перехода дальше. Маршрут не маскирует пробел новым материалом.",
    resultGap: "Честное «не знаю» становится полезным сигналом: Teachly возвращает ученика к ближайшей необходимой связи.",
    rationale: "Почему",
    value: [
      ["Для бизнеса", "Персональный сценарий обучения поверх текущей платформы — без отдельного кабинета и разрозненной истории."],
      ["Для ученика", "Один понятный следующий шаг вместо длинного объяснения всей темы."],
      ["Для команды", "Наблюдаемые сигналы о пробелах, подсказках и переносе понимания."],
    ],
    integrationTitle: "Как Concept Loom становится модулем Teachly",
    integrationDetail: "Сохраняем полезную методику, но переносим состояние, права и проверки в существующие серверные границы Teachly.",
    integration: [
      ["Teachly Core", "Цель, пользователь и разрешённый учебный контекст."],
      ["Knowledge", "Только проверенные материалы для объяснений и маршрута."],
      ["AI layer", "Помогает строить объяснение, но не владеет оценкой или прогрессом."],
      ["Progress", "Хранит подтверждённые связи, пробелы и следующий шаг на сервере."],
    ],
    source: "Метод адаптирован из открытого проекта ConceptLoom v1.1.0 (MIT). Это не заявление о партнёрстве или готовом production-модуле.",
    sourceAction: "Открыть исходный проект",
  },
  en: {
    eyebrow: "Concept Loom / interactive prototype",
    title: "Turn a broad topic into a short route to understanding.",
    description: "Teachly defines a practical goal, locates the knowledge frontier and teaches one necessary connection at a time. Your team gets a controlled learning workflow, not another generic chat.",
    nav: ["Overview", "How it works", "Demo", "Value", "Integration"],
    flowTitle: "Five steps instead of one broad explanation",
    flowDetail: "The method keeps learning focused on an outcome and checks whether understanding became usable.",
    steps: [
      ["Goal", "Define an observable practical outcome."],
      ["Knowledge frontier", "Find the last secure connection and the first real gap."],
      ["Route", "Keep only the dependencies needed to reach the outcome."],
      ["Check", "Conceal the answer until an attempt and distinguish recognition, recall and application."],
      ["Retain", "Save evidenced connections and the exact next step."],
    ],
    demoTitle: "Try the workflow across three learning scenarios",
    demoDetail: "This is a local showcase prototype: nothing is persisted, no AI is called and no production grading is claimed.",
    chooseScenario: "1. Choose a scenario",
    chooseFrontier: "2. Select the assumed frontier",
    levels: ["Starting point", "Foundation", "Application"],
    map: "3. Minimum route",
    frontier: "Assumed knowledge frontier",
    checkpoint: "4. Understanding check without revealing the answer",
    unknown: "I do not know yet",
    reveal: "Show the next step",
    reset: "Start again",
    result: "How the route changes",
    resultAccurate: "In this demonstration the connection is secure. The next step is a transfer check in a new situation.",
    resultRepair: "The response identifies the connection to repair before moving on. The route does not cover a gap with more material.",
    resultGap: "An honest gap becomes a useful signal: Teachly returns the learner to the nearest necessary connection.",
    rationale: "Why",
    value: [
      ["For the business", "A personalized learning workflow on top of the current platform, without another portal or disconnected history."],
      ["For the learner", "One clear next step instead of a long explanation of the whole topic."],
      ["For the team", "Observable signals about gaps, hint use and transfer of understanding."],
    ],
    integrationTitle: "How Concept Loom becomes a Teachly module",
    integrationDetail: "Keep the useful method while moving state, permissions and checks into Teachly's existing server boundaries.",
    integration: [
      ["Teachly Core", "Goal, user and permitted learning context."],
      ["Knowledge", "Only approved material is used for explanations and the route."],
      ["AI layer", "Helps build explanations but never owns grading or progress."],
      ["Progress", "Stores evidenced connections, gaps and the next step on the server."],
    ],
    source: "The method is adapted from the open-source ConceptLoom v1.1.0 project (MIT). This does not claim a partnership or a production-ready module.",
    sourceAction: "Open the source project",
  },
} as const;

const stepIcons = [Target, Compass, Waypoints, CircleHelp, BookOpenCheck] as const;
const valueIcons = [Sparkles, GraduationCap, UserRoundCheck] as const;
const integrationIcons = [Layers3, BookOpenCheck, BrainCircuit, ShieldCheck] as const;

export function ConceptLoomPage() {
  const { locale } = useEcosystem();
  const c = copy[locale];
  const [scenarioId, setScenarioId] = useState("fractions");
  const [frontier, setFrontier] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const scenario = scenarios[locale].find((item) => item.id === scenarioId) ?? scenarios[locale][0];

  const chooseScenario = (id: string) => {
    setScenarioId(id);
    setFrontier(1);
    setSelected(null);
    setRevealed(false);
  };

  const chooseAnswer = (key: string) => {
    setSelected(key);
    setRevealed(false);
  };

  const reset = () => {
    setSelected(null);
    setRevealed(false);
  };

  const outcome = selected === "__gap__"
    ? c.resultGap
    : selected === scenario.checkpoint.correct
      ? c.resultAccurate
      : c.resultRepair;

  return (
    <div className="flex flex-col gap-12 lg:gap-16 xl:pr-[176px]">
      <div id="overview" className="scroll-mt-28">
        <PageHeader
          eyebrow={c.eyebrow}
          title={c.title}
          description={c.description}
          action={
            <div className="flex flex-wrap items-center justify-end gap-3">
              <StatusBadge status={capabilityRegistry["concept-loom"].demoStatus} locale={locale} />
              <a href="#demo" className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200">
                {locale === "ru" ? "Попробовать демо" : "Try the demo"}<ArrowRight aria-hidden="true" size={16} />
              </a>
            </div>
          }
        />
      </div>

      <QuickSectionNav items={[
        { id: "overview", label: c.nav[0] },
        { id: "flow", label: c.nav[1] },
        { id: "demo", label: c.nav[2] },
        { id: "value", label: c.nav[3] },
        { id: "integration", label: c.nav[4] },
      ]} />

      <div id="flow" className="scroll-mt-28">
        <SectionCard title={c.flowTitle} detail={c.flowDetail} icon={Waypoints}>
          <div className="grid gap-3 p-5 sm:p-7 lg:grid-cols-5">
            {c.steps.map(([title, detail], index) => {
              const Icon = stepIcons[index];
              return <PipelineStep key={title} index={`0${index + 1}`} title={title} detail={detail} icon={Icon} />;
            })}
          </div>
        </SectionCard>
      </div>

      <div id="demo" className="scroll-mt-28">
        <SectionCard title={c.demoTitle} detail={c.demoDetail} icon={BrainCircuit} action={<StatusBadge status="DEMO" locale={locale} />}>
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[.78fr_1.22fr]">
            <div className="space-y-6">
              <fieldset>
                <legend className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald-200">{c.chooseScenario}</legend>
                <div className="mt-3 grid gap-2">
                  {scenarios[locale].map((item) => (
                    <button key={item.id} type="button" aria-pressed={scenarioId === item.id} onClick={() => chooseScenario(item.id)} className={`rounded-2xl border p-4 text-left transition ${scenarioId === item.id ? "border-emerald-300/30 bg-emerald-300/[.08] text-slate-100" : "border-white/[.08] bg-white/[.025] text-slate-400 hover:border-white/[.16] hover:text-slate-200"}`}>
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-400">{item.goal}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald-200">{c.chooseFrontier}</legend>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {c.levels.map((label, index) => (
                    <button key={label} type="button" aria-pressed={frontier === index} onClick={() => { setFrontier(index); reset(); }} className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${frontier === index ? "border-cyan-300/30 bg-cyan-300/[.08] text-cyan-100" : "border-white/[.08] bg-white/[.025] text-slate-400 hover:text-slate-200"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.045] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-200">{c.frontier}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{scenario.frontier[frontier]}</p>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/[.08] bg-black/15 p-5 sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald-200">{c.map}</p>
              <ol className="mt-5 grid gap-3 sm:grid-cols-2">
                {scenario.route.map((item, index) => (
                  <li key={item} className="relative rounded-2xl border border-white/[.08] bg-white/[.035] p-4">
                    <span className="text-[10px] font-bold tracking-[.16em] text-slate-400">0{index + 1}</span>
                    <p className="mt-3 text-sm font-semibold text-slate-100">{item}</p>
                    {index === frontier && <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-cyan-200"><span className="size-1.5 rounded-full bg-cyan-300" />{locale === "ru" ? "точка старта" : "starting point"}</span>}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="border-t border-[var(--border)] p-5 sm:p-7">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald-200">{c.checkpoint}</p>
              <h3 className="mt-3 text-xl font-semibold leading-8 text-slate-50">{scenario.checkpoint.question}</h3>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {scenario.checkpoint.choices.map((choice) => (
                <button key={choice.key} type="button" aria-pressed={selected === choice.key} onClick={() => chooseAnswer(choice.key)} className={`rounded-2xl border p-4 text-left text-sm leading-6 transition ${selected === choice.key ? "border-emerald-300/30 bg-emerald-300/[.08] text-emerald-50" : "border-white/[.08] bg-white/[.025] text-slate-300 hover:border-white/[.16]"}`}>
                  {choice.label}
                </button>
              ))}
              <button type="button" aria-pressed={selected === "__gap__"} onClick={() => chooseAnswer("__gap__")} className={`rounded-2xl border p-4 text-left text-sm font-semibold transition ${selected === "__gap__" ? "border-amber-300/30 bg-amber-300/[.08] text-amber-100" : "border-white/[.08] bg-white/[.025] text-slate-400 hover:border-white/[.16]"}`}>
                {c.unknown}
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" disabled={!selected || revealed} onClick={() => setRevealed(true)} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
                {c.reveal}<ArrowRight aria-hidden="true" size={15} />
              </button>
              <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-white/[.1] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[.05] hover:text-white">
                <RotateCcw aria-hidden="true" size={15} />{c.reset}
              </button>
            </div>
            <div aria-live="polite">
              {revealed && selected && (
                <div role="status" className="mt-5 rounded-2xl border border-emerald-300/18 bg-emerald-300/[.055] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-200">{c.result}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{outcome}</p>
                  <p className="mt-3 text-xs leading-6 text-slate-400"><span className="font-semibold text-slate-300">{c.rationale}:</span> {scenario.checkpoint.rationale}</p>
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <section id="value" aria-labelledby="concept-loom-value" className="scroll-mt-28">
        <h2 id="concept-loom-value" className="sr-only">{locale === "ru" ? "Ценность модуля" : "Module value"}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {c.value.map(([title, detail], index) => {
            const Icon = valueIcons[index];
            return <IconCard key={title} icon={Icon} title={title} detail={detail} />;
          })}
        </div>
      </section>

      <div id="integration" className="scroll-mt-28">
        <SectionCard title={c.integrationTitle} detail={c.integrationDetail} icon={Layers3}>
          <div className="grid gap-3 p-5 sm:p-7 md:grid-cols-2">
            {c.integration.map(([title, detail], index) => {
              const Icon = integrationIcons[index];
              return (
                <div key={title} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><Icon aria-hidden="true" size={17} /></span>
                  <h3 className="mt-4 text-base font-semibold text-slate-100">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-4 border-t border-[var(--border)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="max-w-3xl text-xs leading-6 text-slate-400">{c.source}</p>
            <a href="https://github.com/Zproger/ConceptLoom" target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-cyan-100">
              {c.sourceAction}<ExternalLink aria-hidden="true" size={15} />
            </a>
          </div>
        </SectionCard>
      </div>

      <EcosystemNextStep locale={locale} module="concept-loom" />
    </div>
  );
}
