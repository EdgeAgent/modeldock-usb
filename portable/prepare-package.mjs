import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const output = resolve(root, "usb-package");
const required = resolve(root, "dist/index.js");

if (!existsSync(required)) {
  throw new Error("dist/index.js is missing. Run pnpm portable:prepare before assembling the USB package.");
}

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "portable-data"), { recursive: true });
await cp(resolve(root, "dist"), resolve(output, "dist"), { recursive: true });
await cp(resolve(root, "portable"), resolve(output, "portable"), { recursive: true, filter: (source) => !source.endsWith("prepare-package.mjs") });
await writeFile(resolve(output, "portable-data", ".gitkeep"), "");
console.log(`USB package assembled at ${output}`);
