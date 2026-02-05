import { test, expect } from "@playwright/test";

test.describe("PiQL Demo - Query Tile State Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?server=mock");
  });

  test("query tile renders with CodeMirror editor", async ({ page }) => {
    const editor = page.locator(".cm-editor");
    await expect(editor).toBeVisible();
  });

  test("query text can be entered and persists", async ({ page }) => {
    const editor = page.locator(".cm-editor .cm-content");
    await editor.click();
    await page.keyboard.type("test.head(10)");

    // Verify text appears in the editor
    await expect(page.locator(".cm-editor")).toContainText("test.head(10)");
  });

  test("query results appear after running query", async ({ page }) => {
    const editor = page.locator(".cm-editor .cm-content");
    const runButton = page.getByRole("button", { name: "Run" });

    await editor.click();
    await page.keyboard.type("items.head(5)");
    await runButton.click();

    // Wait for results (mock has 300-500ms delay)
    await expect(page.locator("table")).toBeVisible({ timeout: 2000 });
  });

  test("state persists when dragging query tile to new position", async ({
    page,
  }) => {
    // Enter query and run it
    const editor = page.locator(".cm-editor .cm-content");
    const runButton = page.getByRole("button", { name: "Run" });

    await editor.click();
    await page.keyboard.type("my-test-query.head(10)");
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
    await expect(page.locator(".cm-editor")).toContainText(
      "my-test-query.head(10)",
    );
    await expect(page.locator("table")).toBeVisible();
  });

  test("state persists when adding second query tile", async ({ page }) => {
    // Enter query in first tile
    const editor = page.locator(".cm-editor .cm-content").first();
    await editor.click();
    await page.keyboard.type("first-query");

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

    // Should now have two editors
    await expect(page.locator(".cm-editor")).toHaveCount(2);

    // First editor should still have its query (state preserved)
    await expect(page.locator(".cm-editor").first()).toContainText(
      "first-query",
    );

    // Second editor should be empty (new tile)
    const secondEditor = page.locator(".cm-editor").nth(1);
    const secondContent = await secondEditor
      .locator(".cm-content")
      .textContent();
    // CodeMirror has some whitespace, but shouldn't have our query text
    expect(secondContent?.trim() || "").toBe("");
  });
});
