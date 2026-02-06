import { test, expect } from "@playwright/test";

test.describe("PiQL Demo - Query Tile State Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?server=mock");
  });

  test("query tile renders with CodeMirror editor", async ({ page }) => {
    const queryPane = page.getByTestId("pane-query");
    await expect(queryPane.getByTestId("query-editor-input")).toBeVisible();
  });

  test("query text can be entered and persists", async ({ page }) => {
    const queryPane = page.getByTestId("pane-query");
    const editor = queryPane.getByTestId("query-editor-input");
    await editor.click();
    await page.keyboard.type("test.head(10)");

    // Verify text appears in the editor
    await expect(queryPane.getByTestId("query-editor")).toContainText(
      "test.head(10)",
    );
  });

  test("query results appear after running query", async ({ page }) => {
    const queryPane = page.getByTestId("pane-query");
    const editor = queryPane.getByTestId("query-editor-input");
    const runButton = queryPane.getByRole("button", { name: "Run" });

    await editor.click();
    await page.keyboard.type("items.head(5)");
    await runButton.click();

    // Wait for results (mock has 300-500ms delay)
    await expect(queryPane.locator("table")).toBeVisible({ timeout: 2000 });
  });

  test("state persists when dragging query tile to new position", async ({
    page,
  }) => {
    // Enter query and run it
    const queryPane = page.getByTestId("pane-query");
    const editor = queryPane.getByTestId("query-editor-input");
    const runButton = queryPane.getByRole("button", { name: "Run" });

    await editor.click();
    await page.keyboard.type("my-test-query.head(10)");
    await runButton.click();

    // Wait for table to appear
    await expect(queryPane.locator("table")).toBeVisible({ timeout: 2000 });

    // Get title bar for dragging
    const titleBar = queryPane.getByTestId("pane-title-query");

    // Drag to the bottom (vertical split)
    const paneBox = await queryPane.boundingBox();
    await titleBar.dragTo(queryPane, {
      targetPosition: { x: paneBox!.width / 2, y: paneBox!.height - 20 },
    });

    // Wait for layout to settle
    await page.waitForTimeout(200);

    // Query text and results should still be there
    await expect(queryPane.getByTestId("query-editor")).toContainText(
      "my-test-query.head(10)",
    );
    await expect(queryPane.locator("table")).toBeVisible();
  });

  test("state persists when adding second query tile", async ({ page }) => {
    // Enter query in first query tile
    const queryPane = page.getByTestId("pane-query");
    const editor = queryPane.getByTestId("query-editor-input");
    await editor.click();
    await page.keyboard.type("first-query");

    // Run the query
    await queryPane.getByRole("button", { name: "Run" }).click();
    await expect(queryPane.locator("table")).toBeVisible({ timeout: 2000 });

    // Drag another query tile from picker to create second tile
    const queryTilePicker = page.getByTestId("draggable-picker-query");
    const paneBox = await queryPane.boundingBox();

    await queryTilePicker.dragTo(queryPane, {
      targetPosition: { x: paneBox!.width - 20, y: paneBox!.height / 2 },
    });

    await page.waitForTimeout(300);

    // Should now have three editor inputs total (query + chart + new query)
    await expect(page.locator('[data-testid$="editor-input"]')).toHaveCount(3);

    // First query editor should still have its query (state preserved)
    await expect(queryPane.getByTestId("query-editor").first()).toContainText(
      "first-query",
    );
  });

  test("resizing a column does not toggle sort", async ({ page }) => {
    const queryPane = page.getByTestId("pane-query");
    const editor = queryPane.getByTestId("query-editor-input");
    await editor.click();
    await page.keyboard.type("items.head(8)");
    await queryPane.getByRole("button", { name: "Run" }).click();

    await expect(queryPane.locator("table")).toBeVisible({ timeout: 2000 });

    const firstHeader = queryPane.getByTestId("table-header-id");
    await expect(firstHeader).toHaveAttribute("aria-sort", "none");
    const initialWidth = (await firstHeader.boundingBox())?.width ?? 0;

    const resizeHandle = queryPane.getByTestId("column-resize-id");
    const handleBox = await resizeHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    await page.mouse.move(
      handleBox!.x + handleBox!.width / 2,
      handleBox!.y + handleBox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      handleBox!.x + handleBox!.width / 2 + 40,
      handleBox!.y + handleBox!.height / 2,
      { steps: 10 },
    );
    await page.mouse.up();

    const resizedWidth = (await firstHeader.boundingBox())?.width ?? 0;
    expect(resizedWidth).toBeGreaterThan(initialWidth + 10);

    // Regression check: resize drag must not change sort state
    await expect(firstHeader).toHaveAttribute("aria-sort", "none");
  });

  test("table headers support keyboard sorting and keyboard resizing", async ({
    page,
  }) => {
    const queryPane = page.getByTestId("pane-query");
    const editor = queryPane.getByTestId("query-editor-input");
    await editor.click();
    await page.keyboard.type("items.head(8)");
    await queryPane.getByRole("button", { name: "Run" }).click();

    await expect(queryPane.locator("table")).toBeVisible({ timeout: 2000 });

    const firstHeader = queryPane.getByTestId("table-header-id");
    const sortToggle = queryPane.getByTestId("sort-toggle-id");
    const resizeHandle = queryPane.getByTestId("column-resize-id");

    await sortToggle.focus();
    await page.keyboard.press("Enter");
    await expect(firstHeader).toHaveAttribute("aria-sort", "ascending");
    await page.keyboard.press(" ");
    await expect(firstHeader).toHaveAttribute("aria-sort", "descending");

    const initialWidth = (await firstHeader.boundingBox())?.width ?? 0;
    await resizeHandle.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const resizedWidth = (await firstHeader.boundingBox())?.width ?? 0;

    expect(resizedWidth).toBeGreaterThan(initialWidth);
  });

  test("smartviz ask flow works in mock mode", async ({ page }) => {
    const dataframesPane = page.getByTestId("pane-dataframes");
    const queryPane = page.getByTestId("pane-query");
    const itemsTile = dataframesPane.getByTestId("draggable-df-items");
    const queryPaneBox = await queryPane.boundingBox();

    await itemsTile.dragTo(queryPane, {
      targetPosition: { x: queryPaneBox!.width - 20, y: queryPaneBox!.height / 2 },
    });

    const smartVizPane = page.getByTestId("pane-smartviz");
    await expect(smartVizPane).toBeVisible();

    const generatedQuery = smartVizPane.getByTestId("smartviz-generated-editor");
    await expect(generatedQuery).toContainText("items.head()");
    await expect(smartVizPane.locator("table")).toBeVisible({ timeout: 3000 });

    const askInput = smartVizPane.getByTestId("smartviz-ask-input");
    await askInput.fill("show top 7 orders");
    await smartVizPane.getByRole("button", { name: "Ask" }).click();

    await expect(generatedQuery).toContainText("orders.head(7)", {
      timeout: 3000,
    });
    await expect(smartVizPane.locator("table")).toBeVisible({ timeout: 3000 });
  });
});
