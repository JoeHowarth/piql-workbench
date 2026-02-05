import { test, expect } from "@playwright/test";

test.describe("PiQL Demo - Query Tile State Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?server=mock");
  });

  test("query tile renders with empty state", async ({ page }) => {
    const queryInput = page.locator('input[placeholder="Enter query..."]');
    await expect(queryInput).toBeVisible();
    await expect(queryInput).toHaveValue("");
  });

  test("query text persists after entering", async ({ page }) => {
    const queryInput = page.locator('input[placeholder="Enter query..."]');
    await queryInput.fill("test.head(10)");
    await expect(queryInput).toHaveValue("test.head(10)");
  });

  test("query results appear after running query", async ({ page }) => {
    const queryInput = page.locator('input[placeholder="Enter query..."]');
    const runButton = page.getByRole("button", { name: "Run" });

    await queryInput.fill("items.head(5)");
    await runButton.click();

    // Wait for results (mock has 300-500ms delay)
    await expect(page.locator("table")).toBeVisible({ timeout: 2000 });
  });

  test("state persists when dragging query tile to new position", async ({
    page,
  }) => {
    // Enter query and run it
    const queryInput = page.locator('input[placeholder="Enter query..."]');
    const runButton = page.getByRole("button", { name: "Run" });

    await queryInput.fill("my-test-query.head(10)");
    await runButton.click();

    // Wait for table to appear
    await expect(page.locator("table")).toBeVisible({ timeout: 2000 });

    // Get the query pane and its title bar for dragging
    const queryPane = page.getByTestId("pane-query");
    const titleBar = queryPane.locator(".cursor-grab").first();

    // Drag to the bottom (vertical split)
    const paneBox = await queryPane.boundingBox();
    await titleBar.dragTo(queryPane, {
      targetPosition: { x: paneBox!.width / 2, y: paneBox!.height - 20 },
    });

    // Wait for layout to settle
    await page.waitForTimeout(200);

    // Query text and results should still be there
    await expect(queryInput).toHaveValue("my-test-query.head(10)");
    await expect(page.locator("table")).toBeVisible();
  });

  test("state persists when adding second query tile", async ({ page }) => {
    // Enter query in first tile
    const allInputs = () => page.locator('input[placeholder="Enter query..."]');
    await allInputs().first().fill("first-query");

    // Run the query
    await page.getByRole("button", { name: "Run" }).first().click();
    await expect(page.locator("table").first()).toBeVisible({ timeout: 2000 });

    // Drag another query tile from picker to create second tile
    const queryTile = page.getByText("Query").first();
    const queryPane = page.getByTestId("pane-query");
    const paneBox = await queryPane.boundingBox();

    await queryTile.dragTo(queryPane, {
      targetPosition: { x: paneBox!.width - 20, y: paneBox!.height / 2 },
    });

    await page.waitForTimeout(300);

    // Should now have two query inputs
    await expect(allInputs()).toHaveCount(2);

    // First input should still have its query (state preserved)
    await expect(allInputs().first()).toHaveValue("first-query");

    // Second input should be empty (new tile)
    await expect(allInputs().nth(1)).toHaveValue("");
  });
});
