import { test, expect } from "@playwright/test";

test.describe("Workbench Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders initial layout with correct panes", async ({ page }) => {
    // Check all initial panes are visible
    await expect(page.getByTestId("pane-time-controls")).toBeVisible();
    await expect(page.getByTestId("pane-picker")).toBeVisible();
    await expect(page.getByTestId("pane-orders")).toBeVisible();
  });

  test("sidebar has pixel-based width of ~180px", async ({ page }) => {
    const picker = page.getByTestId("pane-picker");
    const box = await picker.boundingBox();

    // Should be close to 180px (allowing for borders/padding)
    expect(box!.width).toBeGreaterThan(170);
    expect(box!.width).toBeLessThan(200);
  });

  test("time controls has pixel-based height of ~80px", async ({ page }) => {
    const timeControls = page.getByTestId("pane-time-controls");
    const box = await timeControls.boundingBox();

    // Should be close to 80px (allowing for borders/padding)
    expect(box!.height).toBeGreaterThan(70);
    expect(box!.height).toBeLessThan(100);
  });

  test("can drag tile from picker to create new pane", async ({ page }) => {
    // Find the Inventory tile in the picker
    const inventoryTile = page.getByText("Inventory").first();
    const ordersPane = page.getByTestId("pane-orders");

    // Get initial orders pane width
    const initialBox = await ordersPane.boundingBox();
    const initialWidth = initialBox!.width;

    // Drag to the right side of orders pane (should split horizontally)
    await inventoryTile.dragTo(ordersPane, {
      targetPosition: { x: initialWidth - 20, y: 100 },
    });

    // New inventory pane should now exist
    const inventoryPane = page.getByTestId("pane-inventory");
    await expect(inventoryPane).toBeVisible();

    // Both panes should share the space
    const ordersBox = await ordersPane.boundingBox();
    const inventoryBox = await inventoryPane.boundingBox();

    expect(ordersBox!.width).toBeLessThan(initialWidth);
    expect(inventoryBox!.width).toBeGreaterThan(100);
  });

  test("can close a pane", async ({ page }) => {
    // First, add an inventory pane
    const inventoryTile = page.getByText("Inventory").first();
    const ordersPane = page.getByTestId("pane-orders");

    await inventoryTile.dragTo(ordersPane, {
      targetPosition: { x: 200, y: 100 },
    });

    const inventoryPane = page.getByTestId("pane-inventory");
    await expect(inventoryPane).toBeVisible();

    // Find and click the close button on inventory pane
    const closeButton = inventoryPane.getByTitle("Close");
    await closeButton.click();

    // Inventory pane should be gone
    await expect(inventoryPane).not.toBeVisible();
  });

  test("resize handles are present", async ({ page }) => {
    // Find resize handles (between panes)
    const handles = page.locator('[data-orientation="horizontal"]');
    await expect(handles.first()).toBeVisible();

    // Should have at least one horizontal handle (between sidebar and content)
    const count = await handles.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("can drag existing pane to rearrange", async ({ page }) => {
    // Add inventory pane first (to the right)
    const inventoryTile = page.getByText("Inventory").first();
    const ordersPane = page.getByTestId("pane-orders");
    const ordersBox = await ordersPane.boundingBox();

    await inventoryTile.dragTo(ordersPane, {
      targetPosition: { x: ordersBox!.width - 20, y: ordersBox!.height / 2 },
    });

    const inventoryPane = page.getByTestId("pane-inventory");
    await expect(inventoryPane).toBeVisible();

    // Get the inventory title bar and drag to bottom of orders
    const inventoryTitleBar = inventoryPane.locator(".cursor-grab").first();
    const titleBox = await inventoryTitleBar.boundingBox();
    const newOrdersBox = await ordersPane.boundingBox();

    // Use mouse movements for more control
    await page.mouse.move(titleBox!.x + 50, titleBox!.y + 10);
    await page.mouse.down();
    // Move to the bottom third of orders pane
    await page.mouse.move(
      newOrdersBox!.x + newOrdersBox!.width / 2,
      newOrdersBox!.y + newOrdersBox!.height - 30,
      { steps: 15 }
    );
    await page.mouse.up();

    // Wait for layout to settle
    await page.waitForTimeout(100);

    // Check that inventory is now below orders (stacked vertically)
    const finalOrdersBox = await ordersPane.boundingBox();
    const finalInventoryBox = await inventoryPane.boundingBox();

    // Either inventory y > orders y, or they overlap horizontally (same x)
    const isBelow = finalInventoryBox!.y > finalOrdersBox!.y;
    const isSameColumn = Math.abs(finalInventoryBox!.x - finalOrdersBox!.x) < 50;

    expect(isBelow || isSameColumn).toBe(true);
  });
});
