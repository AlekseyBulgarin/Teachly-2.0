import { expect, test } from "@playwright/test";

const visualRoutes = [
  "/ecosystem",
  "/platform",
  "/learning",
  "/ai",
  "/teacher",
  "/knowledge",
  "/analytics",
  "/integrations",
] as const;

for (const route of visualRoutes) {
  test(`@visual ${route} visual baseline`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("main")).toBeVisible();
    await expect(page).toHaveScreenshot(`${route.slice(1)}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
