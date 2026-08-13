import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { platformKey, selectNode } from "../portable/select-node.mjs";

describe("portable runtime selection", () => {
  it("exposes a supported platform key", () => {
    expect(platformKey("/tmp/agent-ops")).toMatch(/^(linux|windows|macos)-(x64|arm64)$/);
  });

  it("prefers a bundled runtime when the platform slot exists", () => {
    const root = mkdtempSync(resolve(tmpdir(), "agent-ops-runtime-"));
    const key = platformKey(root);
    const binary = process.platform === "win32" ? "node.exe" : "node";
    const slot = resolve(root, "portable-runtime", key);
    mkdirSync(slot, { recursive: true });
    writeFileSync(resolve(slot, binary), "bundled-placeholder");
    expect(selectNode(root)).toMatchObject({ source: "bundled", key, path: resolve(slot, binary) });
  });
});
