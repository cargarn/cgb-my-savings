import { chromium } from "@playwright/test";
import { copyFile, readFile, writeFile } from "node:fs/promises";

const publicDirectory = new URL("../public/", import.meta.url);
const svg = await readFile(new URL("icon.svg", publicDirectory), "utf8");
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const size of [192, 512]) {
    const png = await page.evaluate(
      async ({ svg, size }) => {
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not create the icon canvas.");
        context.drawImage(image, 0, 0, size, size);
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { svg, size },
    );
    await writeFile(
      new URL(`pwa-${size}.png`, publicDirectory),
      Buffer.from(png, "base64"),
    );
  }
  await copyFile(
    new URL("pwa-512.png", publicDirectory),
    new URL("pwa-maskable-512.png", publicDirectory),
  );
} finally {
  await browser.close();
}
