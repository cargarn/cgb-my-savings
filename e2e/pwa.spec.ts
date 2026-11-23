import { expect, test, type Page } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

async function waitForOffline(page: Page) {
  await expect(
    page.getByText(
      "App ready offline. Financial changes still need Save JSON.",
    ),
  ).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

async function installTestFilePickers(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(window, "showSaveFilePicker", {
      value: async () =>
        (await navigator.storage.getDirectory()).getFileHandle(
          "savings-offline.json",
          { create: true },
        ),
    });
    Object.defineProperty(window, "showOpenFilePicker", {
      value: async () => [
        await (
          await navigator.storage.getDirectory()
        ).getFileHandle("savings-offline.json"),
      ],
    });
  });
}

test("provides install metadata and runs the chart, editing and JSON saving after a cold offline navigation", async ({
  page,
  context,
  request,
}) => {
  await page.goto("/");
  await waitForOffline(page);
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("./");
  expect(manifest.scope).toBe("./");
  expect(
    manifest.icons.some(
      (icon: { purpose: string }) => icon.purpose === "maskable",
    ),
  ).toBe(true);
  for (const icon of manifest.icons) {
    const dimensions = await page.evaluate(async (source: string) => {
      const image = new Image();
      image.src = source;
      await image.decode();
      return `${image.naturalWidth}x${image.naturalHeight}`;
    }, icon.src);
    expect(dimensions).toBe(icon.sizes);
  }
  await context.setOffline(true);
  const offline = await context.newPage();
  const failures: string[] = [];
  offline.on("requestfailed", (request) =>
    failures.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  offline.on("pageerror", (error) => failures.push(error.message));
  const session = await context.newCDPSession(offline);
  await session.send("Network.enable");
  await session.send("Network.setCacheDisabled", { cacheDisabled: true });
  await offline.goto("/");
  expect(failures).toEqual([]);
  await waitForOffline(offline);
  await expect(offline.getByRole("alert")).toHaveCount(0);
  await expect(
    offline.getByRole("heading", { name: "Your progress starts here" }),
  ).toBeVisible();
  await installTestFilePickers(offline);
  await offline.getByRole("button", { name: "Add savings source" }).click();
  await offline.getByLabel("Source name").fill("Offline savings");
  await offline
    .getByRole("dialog")
    .getByRole("button", { name: "Add source", exact: true })
    .click();
  await offline.getByLabel("Offline savings balance").fill("123.45");
  await offline.getByLabel("Predicted value", { exact: true }).fill("120");
  await offline.getByRole("button", { name: "Add month", exact: true }).click();
  await expect(offline.getByText("+€3.45 ahead of plan")).toBeVisible();
  await expect(offline.locator(".recharts-surface").first()).toBeVisible();
  await offline.getByRole("button", { name: "Save JSON", exact: true }).click();
  await expect(offline.getByRole("status")).toContainText(
    "Saved to savings-offline.json.",
  );
  await offline.reload();
  await installTestFilePickers(offline);
  await offline.getByRole("button", { name: "Open JSON" }).click();
  await expect(offline.getByText("+€3.45 ahead of plan")).toBeVisible();
  const cachedUrls = await offline.evaluate(async () => {
    const names = await caches.keys();
    return (
      await Promise.all(
        names.map(async (name) =>
          (await (await caches.open(name)).keys()).map((entry) => entry.url),
        ),
      )
    ).flat();
  });
  expect(cachedUrls.some((url) => /SavingsChart.*\.js$/.test(url))).toBe(true);
  expect(cachedUrls.some((url) => url.endsWith(".json"))).toBe(false);
});

test("keeps a new worker waiting across app windows without refreshing unsaved drafts", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await waitForOffline(page);
  await page.getByLabel("Predicted value", { exact: true }).fill("900");
  const workerFile = new URL("../dist/sw.js", import.meta.url);
  const original = await readFile(workerFile, "utf8");
  const next = original.replace(
    /const APP_VERSION = "[a-f0-9]+";/,
    'const APP_VERSION = "test-update";',
  );
  expect(next).not.toBe(original);
  try {
    await writeFile(workerFile, next);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error("Missing registration");
      await registration.update();
    });
    await expect(page.getByText(/A new version is ready/)).toBeVisible();
    expect(
      await page.evaluate(async () =>
        Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
      ),
    ).toBe(true);
    await expect(
      page.getByLabel("Predicted value", { exact: true }),
    ).toHaveValue("900");
    const other = await context.newPage();
    await other.goto("/");
    await expect(other.getByText(/A new version is ready/)).toBeVisible();
    await other.getByRole("combobox", { name: "Language" }).selectOption("es");
    await expect(other.getByText(/Hay una nueva versión lista/)).toBeVisible();
    await other.getByLabel("Valor previsto", { exact: true }).fill("850");
    await page.close();
    expect(
      await other.evaluate(async () =>
        Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
      ),
    ).toBe(true);
    await expect(
      other.getByLabel("Valor previsto", { exact: true }),
    ).toHaveValue("850");
  } finally {
    await writeFile(workerFile, original);
  }
});
