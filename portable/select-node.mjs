import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function platformKey(root) {
  const os = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux";
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return `${os}-${arch}`;
}

export function selectNode(root) {
  const key = platformKey(root);
  const binary = process.platform === "win32" ? "node.exe" : "node";
  const bundled = resolve(root, "portable-runtime", key, binary);
  return existsSync(bundled) ? { path: bundled, source: "bundled", key } : { path: process.execPath, source: "system", key };
}
