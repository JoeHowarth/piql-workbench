import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("initial layout has no serious or critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/?server=mock");
    await expect(page.locator('[data-testid^="pane-"]').first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      // Color contrast is too environment-dependent for stable CI assertions.
      .disableRules(["color-contrast"])
      .analyze();

    const blockingViolations = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );

    expect(blockingViolations).toEqual([]);
  });
});
