"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  FileInput,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";

type CatalogStatus = "AVAILABLE" | "DEMO" | "IN_DEVELOPMENT" | "PLANNED";
type CategoryKey = "learning" | "assessment" | "personalization" | "teacher" | "analytics" | "automation" | "ai" | "content";
type LocalText = Record<Locale, string>;
type CatalogModule = {
  id: string;
  category: CategoryKey;
  status: CatalogStatus;
  route?: `/${string}`;
  name: LocalText;
  summary: LocalText;
  business: LocalText;
  user: LocalText;
  data: LocalText;
  creates: LocalText;
  connects: LocalText;
};

const categories: Array<{ key: CategoryKey; icon: LucideIcon; label: LocalText }> = [
  { key: "learning", icon: GraduationCap, label: { ru: "Обучение", en: "Learning" } },
  { key: "assessment", icon: ClipboardCheck, label: { ru: "Контроль знаний", en: "Assessment" } },
  { key: "personalization", icon: Activity, label: { ru: "Прогресс", en: "Progress" } },
  { key: "teacher", icon: LayoutDashboard, label: { ru: "Преподаватель", en: "Teacher" } },
  { key: "analytics", icon: BarChart3, label: { ru: "Аналитика", en: "Analytics" } },
  { key: "automation", icon: BellRing, label: { ru: "Автоматизация", en: "Automation" } },
  { key: "ai", icon: BrainCircuit, label: { ru: "AI", en: "AI" } },
  { key: "content", icon: FileInput, label: { ru: "Контент", en: "Content" } },
];

const tx = (ru: string, en: string): LocalText => ({ ru, en });
const module = (
  id: string,
  category: CategoryKey,
  status: CatalogStatus,
  route: `/${string}` | undefined,
  ru: [string, string, string, string, string, string],
  en: [string, string, string, string, string, string],
): CatalogModule => ({
  id, category, status, route,
  name: tx(ru[0], en[0]), summary: tx(ru[1], en[1]), business: tx(ru[2], en[2]),
  user: tx(ru[3], en[3]), data: tx(ru[4], en[4]), creates: tx(ru[5], en[5]),
  connects: tx(
    category === "automation" ? "Прогресс, преподаватель, аналитика" : "Teachly Core и связанные учебные модули",
    category === "automation" ? "Progress, teacher tools and analytics" : "Teachly Core and connected learning modules",
  ),
});

const modules: CatalogModule[] = [
  module("error-work", "learning", "IN_DEVELOPMENT", undefined, ["Работа над ошибками", "Превращает результат попытки в управляемый сценарий повторной практики.", "Связывает проверку, поддержку и следующий шаг без отдельного контура.", "Ученик понимает ошибку и возвращается к нужному материалу.", "Попытка, результат, теория", "План корректирующей практики"], ["Mistake review", "Turns an attempt outcome into a controlled follow-up workflow.", "Connect assessment, support and the next step without another system.", "Learners understand the mistake and return to relevant material.", "Attempt, outcome and theory", "Remediation practice plan"]),
  module("tasks", "learning", "AVAILABLE", "/tasks", ["База заданий", "Единая основа практики с версиями и учебным контекстом.", "Не нужно строить отдельное хранилище заданий для каждого сценария.", "Ученик получает понятную практику, преподаватель — управляемый контент.", "Задания, темы, навыки", "Попытки и результаты"], ["Task bank", "A shared practice foundation with versions and learning context.", "Avoid rebuilding task storage for every scenario.", "Learners get clear practice; teachers get controlled content.", "Tasks, topics and skills", "Attempts and results"]),
  module("theory", "learning", "AVAILABLE", "/theory", ["Теория", "Проверенные материалы рядом с практикой.", "Контент используется повторно в тренажёре и AI.", "Ученик видит нужное объяснение в момент затруднения.", "Материалы и связи с темами", "Учебный контекст"], ["Theory", "Approved material next to practice.", "Reuse content across Trainer and AI.", "Learners see the right explanation when they need it.", "Materials and topic links", "Learning context"]),
  module("trainer", "learning", "AVAILABLE", "/trainer", ["Тренажёр", "Практика с сохранением каждой попытки и следующего шага.", "Один модуль запускает управляемый сценарий самостоятельной работы.", "Ученик практикуется, преподаватель видит результат.", "Задания, теория, профиль", "Сессии и результаты"], ["Trainer", "Practice with every attempt and next step recorded.", "Launch a controlled self-study workflow through one module.", "Learners practise; teachers see outcomes.", "Tasks, theory and profile", "Sessions and results"]),
  module("whiteboard", "learning", "AVAILABLE", "/whiteboard", ["Онлайн-доска", "Визуальное объяснение внутри учебного сценария.", "Добавляет наглядный инструмент без отдельного продукта.", "Преподаватель объясняет, ученик работает с материалом.", "Доска и объекты", "Сохранённое состояние"], ["Whiteboard", "Visual explanation inside the learning workflow.", "Add a visual tool without another standalone product.", "Teachers explain; learners work with the material.", "Board and objects", "Saved state"]),
  module("review", "learning", "DEMO", undefined, ["Повторение материала", "Собирает темы для следующего цикла практики.", "Помогает возвращать ученика к нужному материалу системно.", "Ученик получает понятную очередь повторения.", "Прогресс и история попыток", "План повторения"], ["Review cycle", "Builds the next practice cycle from observed topics.", "Make returning to material systematic.", "Learners get a clear review queue.", "Progress and attempt history", "Review plan"]),

  module("variants", "assessment", "AVAILABLE", "/variants", ["Варианты заданий", "Собирает опубликованные задания в управляемые наборы.", "Быстрее готовить разные сценарии контроля.", "Преподаватель выбирает готовую структуру проверки.", "Опубликованные задания", "Версии вариантов"], ["Task variants", "Combines published tasks into controlled sets.", "Prepare assessment scenarios faster.", "Teachers choose a ready assessment structure.", "Published tasks", "Versioned variants"]),
  module("diagnostics", "assessment", "AVAILABLE", "/student-profile", ["Диагностика знаний", "Показывает подтверждённые сильные и слабые области.", "Даёт команде общую точку отсчёта для поддержки.", "Преподаватель видит, где нужна дополнительная работа.", "Результаты и навыки", "Диагностический профиль"], ["Knowledge diagnostics", "Shows evidenced strengths and weak areas.", "Give the team a shared support baseline.", "Teachers see where extra work is needed.", "Results and skills", "Diagnostic profile"]),
  module("homework", "assessment", "DEMO", undefined, ["Домашние задания", "Связывает назначение, выполнение и результат.", "Убирает ручную сверку разрозненных статусов.", "Преподаватель видит, кто завершил работу и где возникли трудности.", "Группы, задания, сроки", "Статусы выполнения"], ["Homework", "Connects assignment, completion and outcome.", "Reduce manual reconciliation of scattered states.", "Teachers see completion and difficulty.", "Groups, tasks and deadlines", "Completion states"]),
  module("review-work", "assessment", "DEMO", undefined, ["Проверка работ", "Собирает ответы и очередь проверки в одном месте.", "Снижает операционную нагрузку преподавателя.", "Преподаватель получает приоритетную очередь работ.", "Ответы и правила проверки", "Проверенные результаты"], ["Work review", "Brings submissions and review queue together.", "Reduce teacher operational load.", "Teachers get a prioritized review queue.", "Answers and review rules", "Reviewed outcomes"]),

  module("profile", "personalization", "AVAILABLE", "/student-profile", ["Профиль ученика", "Одна картина вместо разрозненных событий.", "Команда быстрее понимает ситуацию конкретного ученика.", "Ученик получает поддержку с учётом истории.", "Попытки, результаты, активность", "Целостный профиль"], ["Learner profile", "One picture instead of scattered events.", "Understand each learner's situation faster.", "Learners receive support informed by history.", "Attempts, results and activity", "Connected profile"]),
  module("progress", "personalization", "AVAILABLE", "/progress", ["Прогресс ученика", "Показывает движение, а не только последний балл.", "Помогает оценивать качество учебного сценария.", "Ученик и преподаватель видят изменения по темам.", "История результатов", "Динамика прогресса"], ["Learner progress", "Shows movement, not only the latest score.", "Evaluate the learning workflow more clearly.", "Learners and teachers see change by topic.", "Result history", "Progress trend"]),
  module("weak-topics", "personalization", "AVAILABLE", "/teacher", ["Слабые темы", "Выделяет темы с подтверждёнными затруднениями.", "Фокусирует работу команды на реальных сигналах.", "Преподаватель быстрее выбирает, что доработать.", "Навыки и результаты", "Сигналы внимания"], ["Weak topics", "Highlights topics with evidenced difficulty.", "Focus the team on real signals.", "Teachers choose what to address sooner.", "Skills and results", "Attention signals"]),
  module("trajectory", "personalization", "DEMO", undefined, ["Индивидуальная траектория", "Предлагает следующий учебный шаг на основе контекста.", "Создаёт основу персонализации без отдельного контура данных.", "Ученик получает последовательный маршрут.", "Прогресс, теория, задания", "Предложение следующего шага"], ["Individual pathway", "Proposes a next step from learning context.", "Create personalization without another data stack.", "Learners get a coherent route.", "Progress, theory and tasks", "Next-step proposal"]),
  module("recommendations", "personalization", "DEMO", undefined, ["Рекомендации", "Предлагает материал или активность, сохраняя решение за человеком.", "Помогает масштабировать поддержку без автономных действий.", "Преподаватель подтверждает полезное действие.", "Профиль и доступный контент", "Рекомендация со статусом"], ["Recommendations", "Proposes material or activity while people remain in control.", "Scale support without autonomous actions.", "Teachers approve the useful action.", "Profile and available content", "Statused recommendation"]),

  module("teacher-panel", "teacher", "AVAILABLE", "/teacher", ["Панель преподавателя", "Собирает учеников, темы и сигналы в одном рабочем экране.", "Сокращает поиск проблем между разными системами.", "Преподаватель понимает, кому помочь первым.", "Профили и прогресс", "Приоритеты работы"], ["Teacher dashboard", "Brings learners, topics and signals into one workspace.", "Reduce searching across separate systems.", "Teachers see who needs help first.", "Profiles and progress", "Work priorities"]),
  module("risk-signals", "teacher", "DEMO", undefined, ["Сигналы риска", "Подсвечивает повторяющиеся трудности и снижение активности.", "Позволяет реагировать раньше, не выдавая прогноз за факт.", "Преподаватель получает объяснимый сигнал.", "Прогресс и активность", "Сигнал с основанием"], ["Risk signals", "Highlights repeated difficulty and falling activity.", "Respond earlier without presenting prediction as fact.", "Teachers receive an explainable signal.", "Progress and activity", "Evidence-backed signal"]),
  module("groups", "teacher", "PLANNED", undefined, ["Управление группами", "Организует учебные группы и ответственных.", "Готовит единый контур для массовой работы.", "Преподаватель управляет группой из одного места.", "Ученики, роли, курсы", "Состав и назначения"], ["Group management", "Organizes cohorts and owners.", "Prepare one operating layer for group work.", "Teachers manage a cohort in one place.", "Learners, roles and courses", "Membership and assignments"]),
  module("feedback", "teacher", "DEMO", undefined, ["Обратная связь", "Готовит объяснимую основу комментария по результату.", "Ускоряет рутинную коммуникацию без автоматического решения за преподавателя.", "Преподаватель редактирует и подтверждает сообщение.", "Ответ, результат, материал", "Черновик обратной связи"], ["Feedback assistance", "Prepares an explainable response draft from an outcome.", "Speed up routine communication without replacing the teacher.", "Teachers edit and approve the message.", "Answer, outcome and material", "Feedback draft"]),

  module("group-analytics", "analytics", "DEMO", "/analytics", ["Аналитика группы", "Показывает общие затруднения и активность группы.", "Помогает учебной части выбирать приоритеты.", "Преподаватель видит темы, требующие общей работы.", "Профили учеников", "Сводка группы"], ["Group analytics", "Shows shared difficulty and cohort activity.", "Help academic teams choose priorities.", "Teachers see topics needing group work.", "Learner profiles", "Cohort summary"]),
  module("course-analytics", "analytics", "DEMO", "/analytics", ["Аналитика курса", "Связывает учебные результаты с разделами курса.", "Показывает, где продукт требует доработки.", "Методист видит проблемные участки программы.", "Курс, темы, результаты", "Сигналы по курсу"], ["Course analytics", "Connects learning outcomes to course sections.", "Show where the product needs attention.", "Curriculum teams see problematic areas.", "Course, topics and outcomes", "Course signals"]),
  module("task-analytics", "analytics", "DEMO", "/analytics", ["Аналитика заданий", "Показывает задания с необычной долей ошибок.", "Помогает улучшать контент на основе фактов.", "Методист получает очередь на проверку качества.", "Попытки и задания", "Сигналы качества"], ["Task analytics", "Shows tasks with unusual error patterns.", "Improve content from evidence.", "Curriculum teams get a quality-review queue.", "Attempts and tasks", "Quality signals"]),
  module("engagement", "analytics", "DEMO", "/analytics", ["Вовлечённость", "Показывает учебную активность без подмены бизнес-метрик.", "Даёт руководителю честную картину использования.", "Команда видит изменение активности.", "Учебные события", "Динамика активности"], ["Engagement", "Shows learning activity without inventing business outcomes.", "Give leaders an honest adoption picture.", "Teams see activity change.", "Learning events", "Activity trend"]),
  module("executive", "analytics", "DEMO", "/analytics", ["Отчёт руководителю", "Собирает ключевые учебные сигналы в одном представлении.", "Упрощает разговор продукта и учебной части.", "Руководитель видит состояние, ограничения и точки внимания.", "Агрегированные учебные факты", "Управленческая сводка"], ["Leadership report", "Brings key learning signals into one view.", "Simplify alignment between product and academic teams.", "Leaders see state, limits and attention areas.", "Aggregated learning facts", "Leadership summary"]),

  module("notifications", "automation", "PLANNED", undefined, ["Уведомления", "Доставляет подтверждённые события в нужный канал.", "Убирает ручную передачу статусов.", "Ученик и преподаватель получают уместное сообщение.", "События и предпочтения", "Доставка уведомления"], ["Notifications", "Delivers approved events to the right channel.", "Remove manual status forwarding.", "Learners and teachers receive relevant messages.", "Events and preferences", "Notification delivery"]),
  module("reminders", "automation", "DEMO", undefined, ["Напоминания", "Показывает сценарии возврата к незавершённой работе.", "Помогает выстроить последовательную коммуникацию.", "Ученик получает понятный повод продолжить.", "Сроки и активность", "Черновик напоминания"], ["Reminders", "Shows return scenarios for unfinished work.", "Build consistent communication.", "Learners get a clear reason to continue.", "Deadlines and activity", "Reminder draft"]),
  module("teacher-triggers", "automation", "DEMO", undefined, ["Триггеры преподавателю", "Создаёт рабочий сигнал по заданным правилам.", "Масштабирует контроль без скрытой автоматики.", "Преподаватель видит причину и нужное действие.", "Прогресс и правила", "Объяснимый триггер"], ["Teacher triggers", "Creates a work signal from explicit rules.", "Scale oversight without hidden automation.", "Teachers see the cause and suggested action.", "Progress and rules", "Explainable trigger"]),

  module("ai-student", "ai", "DEMO", "/ai", ["AI-помощник ученика", "Объясняет затруднение по разрешённому учебному контексту.", "Добавляет помощь внутрь продукта без отдельного чата.", "Ученик получает подсказку или честный отказ.", "Попытка и проверенные материалы", "Объяснение с источниками"], ["Learner AI assistant", "Explains difficulty from approved learning context.", "Add support inside the product without a separate chat.", "Learners get a hint or safe abstention.", "Attempt and approved material", "Grounded explanation"]),
  module("ai-teacher", "ai", "DEMO", "/ai", ["AI-помощник преподавателя", "Готовит гипотезу о затруднении и следующий шаг.", "Сокращает подготовительную работу, сохраняя контроль преподавателя.", "Преподаватель проверяет предложение перед использованием.", "Профиль, результаты, материалы", "Предложение для проверки"], ["Teacher AI assistant", "Prepares a difficulty hypothesis and next step.", "Reduce preparation while teachers stay in control.", "Teachers review the proposal before use.", "Profile, outcomes and material", "Reviewable proposal"]),
  module("ai-authoring", "ai", "PLANNED", undefined, ["Генерация заданий", "Готовит черновик задания по программе и правилам.", "Ускоряет подготовку контента после появления процесса модерации.", "Методист проверяет и публикует черновик.", "Программа и шаблоны", "Черновик задания"], ["Task generation", "Prepares a task draft from curriculum and rules.", "Speed content preparation after moderation exists.", "Curriculum teams review and publish drafts.", "Curriculum and templates", "Task draft"]),
  module("answer-analysis", "ai", "PLANNED", undefined, ["Анализ ответа", "Предлагает интерпретацию развёрнутого ответа.", "Расширяет поддержку там, где детерминированной проверки недостаточно.", "Преподаватель остаётся автором итоговой оценки.", "Ответ и критерии", "Гипотеза для проверки"], ["Answer analysis", "Proposes an interpretation of an open response.", "Extend support where deterministic grading is insufficient.", "Teachers remain authoritative for final assessment.", "Answer and rubric", "Reviewable hypothesis"]),

  module("task-import", "content", "AVAILABLE", "/integrations", ["Импорт заданий", "Переносит внешний банк с происхождением и проверкой.", "Сохраняет уже сделанные инвестиции в контент.", "Методист контролирует качество до публикации.", "Внешние задания", "Версионированный импорт"], ["Task import", "Brings in an external bank with provenance and validation.", "Preserve existing content investment.", "Curriculum teams control quality before publication.", "External tasks", "Versioned import"]),
  module("theory-import", "content", "AVAILABLE", "/knowledge", ["Импорт теории", "Подключает разрешённые учебные материалы.", "Создаёт повторно используемую базу для практики и AI.", "Команда видит источник и статус материала.", "Материалы и лицензии", "Управляемое знание"], ["Theory import", "Connects approved learning material.", "Create a reusable base for practice and AI.", "Teams see source and material status.", "Material and licenses", "Governed knowledge"]),
  module("content-builder", "content", "DEMO", "/theory", ["Конструктор материалов", "Собирает учебный материал из структурированных блоков.", "Упрощает повторное использование контента.", "Методист создаёт и обновляет версии материала.", "Текст, формулы, примеры", "Версия материала"], ["Content builder", "Builds learning material from structured blocks.", "Make content easier to reuse.", "Curriculum teams create and update versions.", "Text, formulas and examples", "Material version"]),
];

const statusCopy: Record<CatalogStatus, LocalText> = {
  AVAILABLE: tx("Доступно", "Available"),
  DEMO: tx("Демо", "Demo"),
  IN_DEVELOPMENT: tx("В разработке", "In development"),
  PLANNED: tx("Запланировано", "Planned"),
};

export function EcosystemCatalog({ locale }: { locale: Locale }) {
  const [category, setCategory] = useState<CategoryKey>("learning");
  const visible = useMemo(() => modules.filter((item) => item.category === category), [category]);
  const [selectedId, setSelectedId] = useState(modules[0].id);
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0];

  return (
    <div className="mt-10">
      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]" role="tablist" aria-label={locale === "ru" ? "Направления экосистемы" : "Ecosystem areas"}>
        {categories.map(({ key, icon: Icon, label }) => {
          const active = category === key;
          return (
            <button key={key} role="tab" aria-selected={active} onClick={() => { setCategory(key); setSelectedId(modules.find((item) => item.category === key)!.id); }} className={`interactive flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${active ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-white/[.08] bg-white/[.025] text-slate-400 hover:border-white/[.16] hover:text-slate-200"}`}>
              <Icon aria-hidden="true" size={16} />{label[locale]}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="flex content-start gap-2 overflow-x-auto pb-2 lg:grid lg:overflow-visible lg:pb-0">
          {visible.map((item) => {
            const active = item.id === selected.id;
            return (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} aria-pressed={active} className={`interactive group flex min-w-[270px] items-center gap-4 rounded-2xl border p-4 text-left lg:min-w-0 lg:w-full ${active ? "border-emerald-300/25 bg-emerald-300/[.07]" : "border-white/[.07] bg-white/[.025] hover:border-white/[.14] hover:bg-white/[.04]"}`}>
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-emerald-300/12 text-emerald-200" : "bg-white/[.045] text-slate-500"}`}><ListChecks aria-hidden="true" size={17} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-100">{item.name[locale]}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.summary[locale]}</span></span>
                <StatusPill status={item.status} locale={locale} />
              </button>
            );
          })}
        </div>

        <div key={selected.id} role="tabpanel" className="content-swap shine-surface relative overflow-hidden rounded-[28px] border border-white/[.09] bg-[linear-gradient(145deg,rgba(25,201,139,.07),transparent_50%),var(--surface)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300">Teachly / {categories.find((item) => item.key === category)!.label[locale]}</p><h3 className="mt-3 text-2xl font-semibold tracking-[-.035em] text-slate-50">{selected.name[locale]}</h3></div>
            <StatusPill status={selected.status} locale={locale} />
          </div>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">{selected.summary[locale]}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Detail label={locale === "ru" ? "Что получает бизнес" : "Business outcome"} value={selected.business[locale]} icon={Sparkles} />
            <Detail label={locale === "ru" ? "Для пользователя" : "For the user"} value={selected.user[locale]} icon={GraduationCap} />
            <Detail label={locale === "ru" ? "Использует" : "Uses"} value={selected.data[locale]} icon={BookOpen} />
            <Detail label={locale === "ru" ? "Создаёт" : "Creates"} value={selected.creates[locale]} icon={CheckCircle2} />
          </div>
          <div className="mt-4 rounded-2xl border border-white/[.07] bg-black/15 p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{locale === "ru" ? "Связано с экосистемой" : "Connected across the ecosystem"}</p><p className="mt-2 text-sm leading-6 text-slate-300">{selected.connects[locale]}</p></div>
          {selected.route ? <Link href={selected.route} className="interactive mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-emerald-100">{locale === "ru" ? "Открыть демонстрацию" : "Open the demo"}<ArrowRight aria-hidden="true" size={16} /></Link> : <p className="mt-6 text-xs leading-5 text-slate-500">{locale === "ru" ? "Frontend-сценарий показывает будущий UX. Production API не заявлен." : "The frontend scenario demonstrates future UX. No production API is claimed."}</p>}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500">{(["AVAILABLE", "DEMO", "IN_DEVELOPMENT", "PLANNED"] as const).map((status) => <span key={status} className="inline-flex items-center gap-2"><StatusPill status={status} locale={locale} /><span>{status === "AVAILABLE" ? (locale === "ru" ? "работает сейчас" : "works now") : status === "DEMO" ? (locale === "ru" ? "интерактивный прототип" : "interactive prototype") : status === "IN_DEVELOPMENT" ? (locale === "ru" ? "реализация продолжается" : "implementation in progress") : (locale === "ru" ? "направление развития" : "future direction")}</span></span>)}</div>
    </div>
  );
}

function StatusPill({ status, locale }: { status: CatalogStatus; locale: Locale }) {
  const tone = status === "AVAILABLE" ? "border-emerald-300/20 bg-emerald-300/[.08] text-emerald-200" : status === "DEMO" ? "border-cyan-300/20 bg-cyan-300/[.08] text-cyan-200" : status === "IN_DEVELOPMENT" ? "border-amber-300/20 bg-amber-300/[.08] text-amber-200" : "border-white/[.09] bg-white/[.035] text-slate-400";
  return <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] ${tone}`}>{statusCopy[status][locale]}</span>;
}

function Detail({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-center gap-2 text-emerald-200"><Icon aria-hidden="true" size={15} /><p className="text-[10px] font-bold uppercase tracking-[.14em]">{label}</p></div><p className="mt-3 text-sm leading-6 text-slate-300">{value}</p></div>;
}
