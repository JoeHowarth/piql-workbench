import { test, expect } from "@playwright/test";

test.describe("Visual Regression", () => {
  test("initial layout matches baseline snapshot", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?server=mock");
    await expect(page.locator('[data-testid^="pane-"]').first()).toBeVisible();

    // Wait briefly for layout and async tiles to settle.
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("initial-layout.png", {
      animations: "disabled",
      caret: "hide",
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
