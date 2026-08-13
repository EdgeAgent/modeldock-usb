import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.env.PORTABLE_ROOT || new URL("..", import.meta.url).pathname);
const source = resolve(root, "portable-data");
const stamp = new Date().toISOString().replaceAll(":", "-");
const target = resolve(root, "portable-backups", stamp);
await mkdir(resolve(root, "portable-backups"), { recursive: true });
await cp(source, target, { recursive: true });
console.log(`Portable data backup created at ${target}`);
