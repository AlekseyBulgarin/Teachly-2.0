import { expect, test } from "@playwright/test";
import { showcaseRoutes } from "../lib/site";
import { mockShowcaseApi, showcaseTask } from "./showcase-api-mock";

for (const route of showcaseRoutes) {
  test(`${route} renders without horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });
}

test("navigation, module tabs and language switch stay usable", async ({ page }) => {
  await page.goto("/ecosystem");
  const isCompact = (page.viewportSize()?.width ?? 0) < 1024;

  if (isCompact) {
    await page.getByRole("button", { name: /Открыть меню|Open menu/i }).click();
    await expect(page.getByRole("dialog", { name: "Основная навигация" })).toBeVisible();
  }

  const primaryNavigation = isCompact
    ? page.getByRole("dialog", { name: "Основная навигация" })
    : page.getByRole("navigation", { name: "Основная навигация" });
  const integrationLink = primaryNavigation.locator('a[href="/integrations"]');
  await expect(integrationLink).toBeVisible();
  await integrationLink.click();
  await expect(page).toHaveURL(/\/integrations$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/ecosystem");
  await page.getByRole("tab", { name: "Интеллект" }).click();
  await expect(page.locator('#modules a[href="/ai"]')).toBeVisible();

  const isMobile = (page.viewportSize()?.width ?? 0) < 640;
  if (isMobile) {
    await page.getByRole("button", { name: /Открыть меню|Open menu/i }).click();
    await page
      .getByRole("dialog", { name: "Основная навигация" })
      .getByRole("button", { name: /^en$/i })
      .click();
  } else {
    await page.getByRole("button", { name: /^en$/i }).click();
  }
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Grow your education platform",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Grow your education platform");
});

test("B2B hero states the buyer, product boundary and low-risk next step", async ({ page }) => {
  await page.goto("/ecosystem");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("без месяцев собственной разработки");
  await expect(page.getByText("Для владельцев онлайн-школ, LMS и EdTech-продуктов")).toBeVisible();
  await expect(page.getByRole("link", { name: "Запросить демонстрацию", exact: true }).first()).toHaveAttribute("href", "#contact");
  await expect(page.getByRole("link", { name: "Посмотреть живое демо", exact: true })).toHaveAttribute("href", "#demo");
  await expect(page.getByText("Teachly не заменяет LMS, CRM или личный кабинет")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Начните с результата, а не с изучения каталога" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Запустить учебную практику/ })).toBeVisible();
  await expect(page.getByText("Что произошло", { exact: true })).toBeVisible();
  await expect(page.getByText("Что это означает", { exact: true })).toBeVisible();
});

test("page and data-panel transitions are present and respect reduced motion", async ({ page }) => {
  await mockShowcaseApi(page);
  await page.goto("/tasks");
  await expect(page.locator(".showcase-page")).toHaveCSS("animation-name", "page-enter");

  const taskChoices = page.locator("[data-task-select]");
  if (await taskChoices.count() > 1) {
    await taskChoices.nth(1).click();
    await expect(page.locator('[data-motion-panel="tasks"]')).toHaveCSS("animation-name", "content-swap");
  }

  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await page.getByRole("button", { name: /Открыть меню|Open menu/i }).click();
  }
  await page.locator('aside a[href="/variants"]').click();
  await expect(page).toHaveURL(/\/variants$/);
  await expect(page.locator(".showcase-page")).toHaveCSS("animation-name", "page-enter");
  await expect(page.locator('[data-motion-panel="variants"]')).toHaveCSS("animation-name", "content-swap");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/theory");
  const duration = await page.locator(".showcase-page").evaluate((element) => getComputedStyle(element).animationDuration);
  expect(Number.parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1_000)).toBeLessThanOrEqual(0.011);
});

test("ecosystem catalog keeps all readiness states explicit", async ({ page }) => {
  await page.goto("/ecosystem");
  const catalog = page.locator("#catalog");
  await catalog.scrollIntoViewIfNeeded();
  await catalog.getByText("Открыть полный каталог и статусы", { exact: true }).click();
  await expect(catalog.getByRole("tab", { name: "Обучение", exact: true })).toBeVisible();
  await expect(catalog.getByText("Доступно для пилота").first()).toBeVisible();
  await expect(catalog.getByText("В разработке").first()).toBeVisible();

  await catalog.getByRole("tab", { name: "Автоматизация" }).click();
  await expect(catalog.getByText("Запланировано").first()).toBeVisible();
  await expect(catalog.getByText("Интерактивное демо").first()).toBeVisible();
});

test("business comparison and technical integration path cover the promised decision criteria", async ({ page }) => {
  await page.goto("/ecosystem");
  await page.getByText("Сравнить три подхода подробно", { exact: true }).click();
  await expect(page.getByRole("cell", { name: "Архитектура", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Масштабирование", exact: true })).toBeVisible();
  const ecosystemFlow = page.getByRole("tablist", { name: "Этапы учебного контекста" });
  await expect(ecosystemFlow.getByRole("tab", { name: "Teachly Core", exact: true })).toBeVisible();
  await expect(ecosystemFlow.getByRole("tab", { name: "Аналитика", exact: true })).toBeVisible();

  await page.goto("/integrations#technical");
  await expect(page.getByRole("heading", { name: "Понятная граница интеграции до разговора о технологии" })).toBeVisible();
  await expect(page.getByText("Интерфейс, пользователи, авторизация, курсы, биллинг и продуктовая логика.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Контракты и контроль, которые можно проверить" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Техническая готовность подключения" })).toBeVisible();
  await expect(page.getByText("Webhooks, SDK и embed", { exact: true })).toBeVisible();
  await expect(page.getByText("Запланировано", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Посмотреть OpenAPI" })).toHaveAttribute("href", "https://teachlyapi-production.up.railway.app/docs");

  await page.getByRole("button", { name: /^en$/i }).click();
  await expect(page.getByRole("heading", { name: "Technical integration readiness" })).toBeVisible();
  await expect(page.getByText("Webhooks, SDK and embed", { exact: true })).toBeVisible();
});

test("ecosystem hydrates without browser errors", async ({ page }) => {
  const errors: string[] = [];
  await page.route("**/api/teachly/**", (route) => {
    const body = route.request().url().endsWith("/health")
      ? { status: "ok", database: "ok" }
      : [];
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/ecosystem", { waitUntil: "networkidle" });
  const sections = page.locator(".section-reveal");
  for (let index = 0; index < await sections.count(); index += 1) {
    await sections.nth(index).scrollIntoViewIfNeeded();
  }
  expect(errors).toEqual([]);
});

test("AI demo explains the provider-ready state without inventing a live response", async ({ page }) => {
  await page.route("**/api/teachly/v1/ai/status", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ configured: false, provider: "disabled", model: null, apiMode: null }),
  }));
  await page.goto("/ai");
  await expect(page.getByText(/Готово к активации провайдера|Ready for provider activation/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Получить объяснение|Get an explanation/i })).toBeDisabled();
});

test("Learning and Knowledge keep their dedicated route identity", async ({ page }) => {
  await page.goto("/learning");
  await expect(page).toHaveURL(/\/learning$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/прогресс ученика/i);

  await page.goto("/knowledge");
  await expect(page).toHaveURL(/\/knowledge$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/AI работает с материал/i);
});

test("AI demo renders a successful provider response", async ({ page }) => {
  await page.route("**/api/teachly/v1/ai/status", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ configured: true, provider: "openai", model: "gpt-4o-mini", apiMode: "responses" }),
  }));
  await page.route("**/api/teachly/v1/remediations", (route) => {
    expect(route.request().postDataJSON()).toMatchObject({ locale: 'ru' });
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
      requestId: "showcase-test",
      remediation: {
        summary: "Проверь знак перед вторым слагаемым.",
        explanation: "При переносе слагаемого знак должен измениться.",
        hint: "Запиши промежуточный шаг отдельно.",
        likelyGap: "Линейные уравнения",
        confidence: 0.91,
        abstained: false,
      },
      evidenceRefs: ["attempt:test"],
      knowledgeRefs: ["knowledge:test"],
      }),
    });
  });

  await page.goto("/ai");
  await expect(page.getByText(/Провайдер настроен|Provider configured/i)).toBeVisible();
  await page.getByRole("button", { name: /Получить объяснение|Get an explanation/i }).click();
  await expect(page.getByText("Проверь знак перед вторым слагаемым.")).toBeVisible();
  await expect(page.getByText("91%")).toBeVisible();
  await expect(page.locator('[data-motion-panel="ai"]')).toHaveCSS("animation-name", "content-swap");
});

test("AI demo waits for a slow provider and renders a safe abstention", async ({ page }) => {
  await page.route("**/api/teachly/v1/ai/status", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ configured: true, provider: "openrouter", model: "demo-model", apiMode: "chat_completions" }),
  }));
  await page.route("**/api/teachly/v1/remediations", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 15_500));
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        requestId: "slow-showcase-test",
        remediation: {
          summary: "Недостаточно подтверждённого контекста.",
          explanation: "Teachly не придумывает объяснение без разрешённых источников.",
          hint: "Обратитесь к преподавателю за дополнительным материалом.",
          likelyGap: null,
          confidence: 0,
          abstained: true,
        },
        evidenceRefs: [],
        knowledgeRefs: [],
      }),
    });
  });

  await page.goto("/ai");
  await page.getByRole("button", { name: /Получить объяснение|Get an explanation/i }).click();
  await expect(page.getByText("Недостаточно подтверждённого контекста.")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Безопасный отказ|Safe abstention/i).first()).toBeVisible();
  await expect(page.getByText("0%")).toBeVisible();
});

test("AI demo offers a retry when the provider is temporarily unavailable", async ({ page }) => {
  await page.route("**/api/teachly/v1/ai/status", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ configured: true, provider: "openrouter", model: "demo-model", apiMode: "chat_completions" }),
  }));
  await page.route("**/api/teachly/v1/remediations", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ code: "TEACHLY_API_ERROR", message: "The live Teachly demo request could not be completed" }),
  }));

  await page.goto("/ai");
  await page.getByRole("button", { name: /Получить объяснение|Get an explanation/i }).click();
  await expect(page.getByText(/временно недоступен|temporarily unavailable/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Повторить|Try again/i })).toBeVisible();
});

test("Concept Loom demo keeps its boundary honest and demonstrates a routed checkpoint", async ({ page }) => {
  await page.goto("/concept-loom");
  await expect(page.getByText("Интерактивное демо", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/результат не сохраняется, AI не вызывается/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Что происходит с учебным сигналом" })).toBeVisible();
  await expect(page.getByText("Progress → Teacher → Analytics", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Корпоративное обучение/i }).click();
  await page.getByRole("button", { name: "Начало", exact: true }).click();
  await expect(page.getByText(/не распознаёт персональные данные/i)).toBeVisible();
  await page.getByRole("button", { name: /утверждённый защищённый канал/i }).click();
  await page.getByRole("button", { name: "Показать следующий шаг" }).click();
  await expect(page.getByRole("status")).toContainText(/перенос в новой ситуации/i);

  await expect(page.getByRole("link", { name: "Открыть исходный проект" })).toHaveAttribute(
    "href",
    "https://github.com/Zproger/ConceptLoom",
  );

  await page.getByRole("button", { name: /^en$/i }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("short route to understanding");
  await expect(page.getByText(/nothing is persisted, no AI is called/i)).toBeVisible();
});

test("Trainer offers a five-task programming track with localized code content", async ({ page }) => {
  await mockShowcaseApi(page);
  await page.unroute("**/api/teachly/v1/trainer/sessions");
  await page.route("**/api/teachly/v1/trainer/sessions", async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') return route.fallback();
    expect(request.postDataJSON()).toMatchObject({ track: 'python' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: '00000000-0000-4000-8000-000000000999', status: 'active', progress: { completed: 0, total: 5 }, current: null, latestResult: null, canComplete: false, idempotentReplay: false }) });
  });
  await page.route("**/api/teachly/v1/trainer/sessions/*/current", (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: '00000000-0000-4000-8000-000000000999', status: 'active', progress: { completed: 0, total: 5 }, current: { id: '00000000-0000-4000-8000-000000000998', position: 1, status: 'started', task: showcaseTask, result: null }, latestResult: null, canComplete: false, idempotentReplay: false }) }));
  await page.goto('/trainer');
  await page.getByRole('button', { name: /Начать тренажёр/i }).click();
  await expect(page.getByText('Прогресс 0/5')).toBeVisible();
  await expect(page.getByText('x = 5')).toBeVisible();
  await expect(page.getByText('После ответа появится разбор')).toBeVisible();
});

test("desktop sidebar does not overlap content", async ({ page }, testInfo) => {
  const width = testInfo.project.use.viewport?.width ?? 0;
  test.skip(width < 1024, "Desktop-only layout assertion");

  await page.goto("/teacher");
  const layout = await page.evaluate(() => {
    const aside = document.querySelector("aside")?.getBoundingClientRect();
    const main = document.querySelector("main")?.getBoundingClientRect();
    return aside && main ? { asideRight: aside.right, mainLeft: main.left } : null;
  });
  expect(layout).not.toBeNull();
  expect(layout!.mainLeft).toBeGreaterThanOrEqual(layout!.asideRight - 1);
});

test("production responses include the security baseline", async ({ request }) => {
  const response = await request.get("/ecosystem");
  expect(response.ok()).toBeTruthy();
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["strict-transport-security"]).toContain("max-age=63072000");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-powered-by"]).toBeUndefined();
});
