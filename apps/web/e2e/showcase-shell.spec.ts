import { expect, test } from "@playwright/test";

const routes = [
  "/ecosystem",
  "/platform",
  "/learning",
  "/tasks",
  "/variants",
  "/theory",
  "/trainer",
  "/whiteboard",
  "/ai",
  "/student-profile",
  "/progress",
  "/teacher",
  "/knowledge",
  "/analytics",
  "/integrations",
] as const;

for (const route of routes) {
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
  const demoLink = primaryNavigation.locator('a[href="/trainer"]');
  await expect(demoLink).toBeVisible();
  await demoLink.click();
  await expect(page).toHaveURL(/\/trainer$/);
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
    "Tasks, AI and analytics",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
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
