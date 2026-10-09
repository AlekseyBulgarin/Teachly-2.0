import { expect, test } from "@playwright/test";
import { showcaseRoutes } from "../lib/site";

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

test("ecosystem catalog keeps all readiness states explicit", async ({ page }) => {
  await page.goto("/ecosystem");
  const catalog = page.locator("#catalog");
  await catalog.scrollIntoViewIfNeeded();
  await expect(catalog.getByRole("tab", { name: "Обучение", exact: true })).toBeVisible();
  await expect(catalog.getByText("Доступно").first()).toBeVisible();
  await expect(catalog.getByText("В разработке").first()).toBeVisible();

  await catalog.getByRole("tab", { name: "Автоматизация" }).click();
  await expect(catalog.getByText("Запланировано").first()).toBeVisible();
  await expect(catalog.getByText("Демо").first()).toBeVisible();
});

test("business comparison and technical integration path cover the promised decision criteria", async ({ page }) => {
  await page.goto("/ecosystem");
  await expect(page.getByRole("cell", { name: "Архитектура", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Масштабирование", exact: true })).toBeVisible();
  const ecosystemFlow = page.getByRole("tablist", { name: "Этапы учебного контекста" });
  await expect(ecosystemFlow.getByRole("tab", { name: "Teachly Core", exact: true })).toBeVisible();
  await expect(ecosystemFlow.getByRole("tab", { name: "Аналитика", exact: true })).toBeVisible();

  await page.goto("/integrations#technical");
  await expect(page.getByRole("heading", { name: "Техническая готовность подключения" })).toBeVisible();
  await expect(page.getByText("Webhooks, SDK и embed", { exact: true })).toBeVisible();
  await expect(page.getByText("В ПЛАНАХ", { exact: true })).toBeVisible();
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
  await expect(page.getByText(/Готово к подключению ключа|Ready for an API key/i)).toBeVisible();
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
  await page.route("**/api/teachly/v1/remediations", (route) => route.fulfill({
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
  }));

  await page.goto("/ai");
  await expect(page.getByText(/Провайдер подключён|Provider connected/i)).toBeVisible();
  await page.getByRole("button", { name: /Получить объяснение|Get an explanation/i }).click();
  await expect(page.getByText("Проверь знак перед вторым слагаемым.")).toBeVisible();
  await expect(page.getByText("91%")).toBeVisible();
});

test("Concept Loom demo keeps its boundary honest and demonstrates a routed checkpoint", async ({ page }) => {
  await page.goto("/concept-loom");
  await expect(page.getByText("ДЕМО", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/результат не сохраняется, AI не вызывается/i)).toBeVisible();

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
