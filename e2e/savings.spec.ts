import { expect, test, type Page } from "@playwright/test";

async function installFilePickers(page: Page) {
  await page.evaluate(() => {
    let handle: FileSystemFileHandle;
    Object.defineProperty(window, "showSaveFilePicker", {
      value: async () => {
        const directory = await navigator.storage.getDirectory();
        handle = await directory.getFileHandle("savings-e2e.json", {
          create: true,
        });
        return handle;
      },
    });
    Object.defineProperty(window, "showOpenFilePicker", {
      value: async () => [handle],
    });
  });
}

test("creates a monthly check-in, writes a real local file, and reopens it after reload", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your progress starts here" }),
  ).toBeVisible();
  await installFilePickers(page);
  await page.getByRole("button", { name: "Add savings source" }).click();
  await page.getByLabel("Source name").fill("Savings account");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add source", exact: true })
    .click();
  await page.getByLabel("Savings account balance").fill("25000.25");
  await page.getByLabel("Predicted value", { exact: true }).fill("24500");
  await page.getByRole("button", { name: "Add month", exact: true }).click();
  await expect(page.getByText("+€500.25 ahead of plan")).toBeVisible();
  await page.getByRole("button", { name: "Save JSON", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Saved to savings-e2e.json.",
  );
  const saved = await page.evaluate(async () => {
    const directory = await navigator.storage.getDirectory();
    const handle = await directory.getFileHandle("savings-e2e.json");
    return JSON.parse(await (await handle.getFile()).text());
  });
  expect(saved.snapshots[0].predicted).toBe(2_450_000);
  expect(Object.values(saved.snapshots[0].balances)).toEqual([2_500_025]);
  await page.reload();
  await page.evaluate(() => {
    Object.defineProperty(window, "showOpenFilePicker", {
      configurable: true,
      value: async () => [
        await (
          await navigator.storage.getDirectory()
        ).getFileHandle("savings-e2e.json"),
      ],
    });
  });
  await page.getByRole("button", { name: "Open JSON" }).click();
  await expect(page.getByText("+€500.25 ahead of plan")).toBeVisible();
  await expect(page.locator(".recharts-surface").first()).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("desktop.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("fits a mobile viewport and allows a future prediction without inventing a balance", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Month", { exact: true }).fill("2027-01");
  await page.getByLabel("Predicted value", { exact: true }).fill("30000");
  await page.getByRole("button", { name: "Add month", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "€30,000.00", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Not entered", exact: true }),
  ).toBeVisible();
  const overflowing = await page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter(
        (element) =>
          element.getBoundingClientRect().right > window.innerWidth + 1,
      )
      .map((element) => ({
        tag: element.tagName,
        class: element.className,
        width: element.getBoundingClientRect().width,
      })),
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
    JSON.stringify(overflowing),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: testInfo.outputPath("mobile.png"),
    fullPage: true,
  });
});

test.describe("Spanish", () => {
  test.use({ locale: "es-ES" });

  test("records comma decimals, saves unchanged JSON, and persists the chosen UI language", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("combobox", { name: "Idioma" })).toHaveValue(
      "es",
    );
    await installFilePickers(page);
    await page.getByLabel("Mes", { exact: true }).fill("2026-01");
    await page
      .getByRole("button", { name: "Añadir origen de ahorro", exact: true })
      .click();
    await page.getByLabel("Nombre del origen").fill("Cuenta");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Añadir origen", exact: true })
      .click();
    await page.getByLabel("Saldo de Cuenta").fill("25000,25");
    await page.getByLabel("Valor previsto", { exact: true }).fill("24500");
    await page.getByRole("button", { name: "Añadir mes", exact: true }).click();
    await expect(
      page.getByText("+500,25 € por encima de lo previsto"),
    ).toBeVisible();
    await expect(page.locator(".recharts-legend-wrapper")).toContainText(
      "Valor previsto",
    );
    await page
      .getByRole("button", { name: "Guardar JSON", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Guardado en savings-e2e.json.",
    );
    const saved = await page.evaluate(async () => {
      const handle = await (
        await navigator.storage.getDirectory()
      ).getFileHandle("savings-e2e.json");
      return JSON.parse(await (await handle.getFile()).text());
    });
    expect(saved.snapshots[0].month).toBe("2026-01");
    expect(saved.snapshots[0].predicted).toBe(2_450_000);
    expect(Object.values(saved.snapshots[0].balances)).toEqual([2_500_025]);
    expect(saved.sources[0].name).toBe("Cuenta");
    expect(saved).not.toHaveProperty("language");
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    }
    await page.getByRole("combobox", { name: "Idioma" }).selectOption("en");
    await expect(
      page.getByRole("button", { name: "Save JSON", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue(
      "en",
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
