import { expect, test } from "@playwright/test";
import { showcaseRoutes } from "../lib/site";
import { mockShowcaseApi } from "./showcase-api-mock";

for (const route of showcaseRoutes) {
  test(`@visual ${route} visual baseline`, async ({ page }) => {
    test.slow();
    await mockShowcaseApi(page);
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("main")).toBeVisible();
    const sections = page.locator(".section-reveal");
    for (let index = 0; index < await sections.count(); index += 1) {
      await sections.nth(index).scrollIntoViewIfNeeded();
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot(`${route.slice(1)}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
