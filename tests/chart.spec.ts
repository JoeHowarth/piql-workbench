import { test, expect } from "@playwright/test";

test.describe("Chart Tile - Height and Sizing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?server=mock");
  });

  test("chart canvas fills container after query", async ({ page }) => {
    // Chart pane is now part of the default layout
    const chartPane = page.getByTestId("pane-chart");
    await expect(chartPane).toBeVisible();

    // Find the CodeMirror editor inside the chart pane and enter a query
    const editor = chartPane.locator(".cm-editor .cm-content");
    await editor.click();
    await page.keyboard.type("test.select(pl.col('name'), pl.col('value'))");

    // Click the Run button in the chart pane
    const runButton = chartPane.getByRole("button", { name: "Run" });
    await runButton.click();

    // Wait for the ECharts canvas to appear (ECharts renders to canvas)
    const canvas = chartPane.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 3000 });

    // Get the pane and canvas dimensions
    const paneBox = await chartPane.boundingBox();
    const canvasBox = await canvas.boundingBox();

    expect(paneBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();

    // The canvas should have a reasonable height (not 0 or collapsed)
    // Minimum height check - should be at least 100px
    expect(canvasBox!.height).toBeGreaterThan(100);

    // The canvas should fill most of the available pane height
    // Account for the query input bar (~50px) and some padding
    const availableHeight = paneBox!.height - 80; // Subtract header area
    expect(canvasBox!.height).toBeGreaterThan(availableHeight * 0.7);

    // The canvas width should be close to the pane width
    expect(canvasBox!.width).toBeGreaterThan(paneBox!.width * 0.8);
  });

  test("chart does not overlap with input area", async ({ page }) => {
    // Chart pane is now part of the default layout
    const chartPane = page.getByTestId("pane-chart");
    await expect(chartPane).toBeVisible();

    // Enter and run query
    const editor = chartPane.locator(".cm-editor .cm-content");
    await editor.click();
    await page.keyboard.type("transactions.select(pl.col('tx_type'), pl.col('amount'))");
    await chartPane.getByRole("button", { name: "Run" }).click();

    // Wait for canvas
    const canvas = chartPane.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 3000 });

    // Debug: capture DOM structure and computed styles
    const debugInfo = await chartPane.evaluate((pane) => {
      const getElementInfo = (el: Element | null, name: string) => {
        if (!el) return { name, exists: false };
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          name,
          tag: el.tagName,
          classes: el.className,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          position: style.position,
          overflow: style.overflow,
          display: style.display,
        };
      };

      // Walk up from canvas to find the DOM structure
      const canvasEl = pane.querySelector("canvas");
      const elements: ReturnType<typeof getElementInfo>[] = [];

      let current: Element | null = canvasEl;
      let depth = 0;
      while (current && depth < 10) {
        elements.push(getElementInfo(current, `depth-${depth}`));
        current = current.parentElement;
        depth++;
      }

      // Also get the input area
      const inputArea = pane.querySelector(".border-b");
      elements.push(getElementInfo(inputArea, "input-area"));

      return elements;
    });

    console.log("DOM Debug Info:");
    for (const el of debugInfo) {
      console.log(JSON.stringify(el, null, 2));
    }

    // Get the input header area (contains editor and Run button)
    const inputArea = chartPane.locator(".border-b").first();
    const inputBox = await inputArea.boundingBox();
    const canvasBox = await canvas.boundingBox();

    expect(inputBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();

    console.log(`Input area: y=${inputBox!.y}, height=${inputBox!.height}, bottom=${inputBox!.y + inputBox!.height}`);
    console.log(`Canvas: y=${canvasBox!.y}, height=${canvasBox!.height}`);

    // The canvas should not overlap with the input area
    // Canvas top should be at or below the input area bottom
    const inputBottom = inputBox!.y + inputBox!.height;
    expect(canvasBox!.y).toBeGreaterThanOrEqual(inputBottom);
  });

  test("chart canvas has non-zero dimensions", async ({ page }) => {
    // Chart pane is now part of the default layout
    const chartPane = page.getByTestId("pane-chart");
    await expect(chartPane).toBeVisible();

    // Enter and run query
    const editor = chartPane.locator(".cm-editor .cm-content");
    await editor.click();
    await page.keyboard.type("test.select(pl.col('name'), pl.col('value'))");
    await chartPane.getByRole("button", { name: "Run" }).click();

    // Wait for canvas
    const canvas = chartPane.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 3000 });

    // Get canvas size - regression test for height bug
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    // Canvas must have non-zero dimensions (the bug was height=0)
    expect(canvasBox!.height).toBeGreaterThan(0);
    expect(canvasBox!.width).toBeGreaterThan(0);

    // Should be reasonably sized, not just 1px
    expect(canvasBox!.height).toBeGreaterThan(100);
    expect(canvasBox!.width).toBeGreaterThan(100);
  });

  test("chart renders with correct height in narrow viewport", async ({
    page,
  }) => {
    // Set a narrower viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto("/?server=mock");

    // Chart pane is now part of the default layout
    const chartPane = page.getByTestId("pane-chart");
    await expect(chartPane).toBeVisible();

    // Enter and run query
    const editor = chartPane.locator(".cm-editor .cm-content");
    await editor.click();
    await page.keyboard.type("test.select(pl.col('name'), pl.col('value'))");
    await chartPane.getByRole("button", { name: "Run" }).click();

    // Wait for canvas
    const canvas = chartPane.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 3000 });

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    // Even in narrow viewport, chart should have reasonable dimensions
    expect(canvasBox!.height).toBeGreaterThan(100);
    expect(canvasBox!.width).toBeGreaterThan(200);
  });
});
