import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rawDir, readCaptureManifest } from "./capture.ts";
import type { LoadedConfig } from "./config.ts";

async function outDir(): Promise<LoadedConfig> {
  const dir = await mkdtemp(join(tmpdir(), "goldie-capture-"));
  return { outDir: dir } as LoadedConfig;
}

describe("raw captures", () => {
  test("live under out/raw/<device>/<locale>", async () => {
    const cfg = await outDir();
    expect(rawDir(cfg, "iphone-6.9", "es-ES")).toBe(join(cfg.outDir, "raw", "iphone-6.9", "es-ES"));
  });

  test("readCaptureManifest reads the locale's manifest", async () => {
    const cfg = await outDir();
    const dir = rawDir(cfg, "pixel-10-pro", "de-DE");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "manifest.json"),
      JSON.stringify({ device: "pixel-10-pro", locale: "de-DE" }),
    );
    expect(await readCaptureManifest(cfg, "pixel-10-pro", "de-DE")).toMatchObject({
      locale: "de-DE",
    });
    expect(await readCaptureManifest(cfg, "pixel-10-pro", "fr-FR")).toBeNull();
  });

  test("falls back to the per-device manifest of older releases", async () => {
    const cfg = await outDir();
    const legacy = join(cfg.outDir, "raw", "iphone-6.9");
    await mkdir(legacy, { recursive: true });
    await writeFile(join(legacy, "manifest.json"), JSON.stringify({ device: "iphone-6.9" }));
    expect(await readCaptureManifest(cfg, "iphone-6.9", "en-US")).toMatchObject({
      device: "iphone-6.9",
    });
  });
});
