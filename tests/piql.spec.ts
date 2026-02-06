import { test, expect } from "@playwright/test";

test.describe("PiQL Demo - Query Tile State Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?server=mock");
  });

  test("query tile renders with CodeMirror editor", async ({ page }) => {
    const queryPane = page.getByTestId("pane-query");
    const editor = queryPane.locator(".cm-editor");
    await expect(editor).toBeVisible();
  });

  test("query text can be entered and persists", async ({ page }) => {
    const queryPane = page.getByTestId("pane-query");
    const editor = queryPane.locator(".cm-editor .cm-content");
    await editor.click();
    await page.keyboard.type("test.head(10)");

    // Verify text appears in the editor
    await expect(queryPane.locator(".cm-editor")).toContainText("test.head(10)");
  });

  test("query results appear after running query", async ({ page }) => {
    const queryPane = page.getByTestId("pane-query");
    const editor = queryPane.locator(".cm-editor .cm-content");
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
    const editor = queryPane.locator(".cm-editor .cm-content");
    const runButton = queryPane.getByRole("button", { name: "Run" });

    await editor.click();
    await page.keyboard.type("my-test-query.head(10)");
    await runButton.click();

    // Wait for table to appear
    await expect(queryPane.locator("table")).toBeVisible({ timeout: 2000 });

    // Get title bar for dragging
    const titleBar = queryPane.locator(".cursor-grab").first();

    // Drag to the bottom (vertical split)
    const paneBox = await queryPane.boundingBox();
    await titleBar.dragTo(queryPane, {
      targetPosition: { x: paneBox!.width / 2, y: paneBox!.height - 20 },
    });

    // Wait for layout to settle
    await page.waitForTimeout(200);

    // Query text and results should still be there
    await expect(queryPane.locator(".cm-editor")).toContainText(
      "my-test-query.head(10)",
    );
    await expect(queryPane.locator("table")).toBeVisible();
  });

  test("state persists when adding second query tile", async ({ page }) => {
    // Enter query in first query tile
    const queryPane = page.getByTestId("pane-query");
    const editor = queryPane.locator(".cm-editor .cm-content");
    await editor.click();
    await page.keyboard.type("first-query");

    // Run the query
    await queryPane.getByRole("button", { name: "Run" }).click();
    await expect(queryPane.locator("table")).toBeVisible({ timeout: 2000 });

    // Drag another query tile from picker to create second tile
    const queryTilePicker = page.getByText("Query").first();
    const paneBox = await queryPane.boundingBox();

    await queryTilePicker.dragTo(queryPane, {
      targetPosition: { x: paneBox!.width - 20, y: paneBox!.height / 2 },
    });

    await page.waitForTimeout(300);

    // Should now have three editors total (query + chart + new query)
    await expect(page.locator(".cm-editor")).toHaveCount(3);

    // First query editor should still have its query (state preserved)
    await expect(queryPane.locator(".cm-editor").first()).toContainText("first-query");
  });

  test("resizing a column does not toggle sort", async ({ page }) => {
    const queryPane = page.getByTestId("pane-query");
    const editor = queryPane.locator(".cm-editor .cm-content");
    await editor.click();
    await page.keyboard.type("items.head(8)");
    await queryPane.getByRole("button", { name: "Run" }).click();

    await expect(queryPane.locator("table")).toBeVisible({ timeout: 2000 });

    const firstHeader = queryPane.locator("th").first();
    await expect(firstHeader).not.toContainText("↑");
    await expect(firstHeader).not.toContainText("↓");

    const resizeHandle = firstHeader.locator(".cursor-col-resize");
    await resizeHandle.click({ force: true });

    // Regression check: clicking resize handle must not bubble to header sort
    await expect(firstHeader).not.toContainText("↑");
    await expect(firstHeader).not.toContainText("↓");
  });

  test("smartviz ask flow works in mock mode", async ({ page }) => {
    const dataframesPane = page.getByTestId("pane-dataframes");
    const queryPane = page.getByTestId("pane-query");
    const itemsTile = dataframesPane.getByText("items").first();
    const queryPaneBox = await queryPane.boundingBox();

    await itemsTile.dragTo(queryPane, {
      targetPosition: { x: queryPaneBox!.width - 20, y: queryPaneBox!.height / 2 },
    });

    const smartVizPane = page.getByTestId("pane-smartviz");
    await expect(smartVizPane).toBeVisible();

    const generatedQuery = smartVizPane.locator(".cm-editor").first();
    await expect(generatedQuery).toContainText("items.head()");
    await expect(smartVizPane.locator("table")).toBeVisible({ timeout: 3000 });

    const askInput = smartVizPane.locator("textarea").first();
    await askInput.fill("show top 7 orders");
    await smartVizPane.getByRole("button", { name: "Ask" }).click();

    await expect(generatedQuery).toContainText("orders.head(7)", {
      timeout: 3000,
    });
    await expect(smartVizPane.locator("table")).toBeVisible({ timeout: 3000 });
  });
});
