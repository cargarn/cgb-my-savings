import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const runtime = await readFile(
  new URL("./service-worker.js", import.meta.url),
  "utf8",
);

async function collectAssets(directory, prefix = "") {
  const assets = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      assets.push(
        ...(await collectAssets(join(directory, entry.name), `${relative}/`)),
      );
    } else if (
      /\.(?:html|js|css|svg|png|webmanifest)$/.test(relative) &&
      relative !== "sw.js"
    ) {
      assets.push(relative);
    }
  }
  return assets.sort();
}

const assets = await collectAssets(dist);
for (const required of [
  "index.html",
  "manifest.webmanifest",
  "pwa-192.png",
  "pwa-512.png",
  "pwa-maskable-512.png",
]) {
  if (!assets.includes(required))
    throw new Error(`Missing PWA asset: ${required}`);
}
const hash = createHash("sha256").update(runtime);
for (const asset of assets)
  hash.update(asset).update(await readFile(join(dist, asset)));
const version = hash.digest("hex").slice(0, 20);
await writeFile(
  join(dist, "sw.js"),
  `const APP_VERSION = ${JSON.stringify(version)};\nconst APP_ASSETS = ${JSON.stringify(assets)};\n${runtime}`,
);
console.log(
  `Generated offline worker ${version} with ${assets.length} app assets.`,
);
