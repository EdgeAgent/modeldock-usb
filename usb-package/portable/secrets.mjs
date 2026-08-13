import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(process.env.PORTABLE_ROOT || new URL("..", import.meta.url).pathname);
const dataRoot = resolve(root, "portable-data");
const file = resolve(dataRoot, "secrets.enc");
const passphrase = process.env.PORTABLE_SECRET_PASSPHRASE;
if (!passphrase) throw new Error("Set PORTABLE_SECRET_PASSPHRASE in the host environment; it is never written to the USB package.");

const encrypt = (payload) => { const salt = randomBytes(16); const iv = randomBytes(12); const key = scryptSync(passphrase, salt, 32); const cipher = createCipheriv("aes-256-gcm", key, iv); const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]); return JSON.stringify({ salt: salt.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") }); };
const decrypt = (encoded) => { const envelope = JSON.parse(encoded); const key = scryptSync(passphrase, Buffer.from(envelope.salt, "base64"), 32); const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64")); decipher.setAuthTag(Buffer.from(envelope.tag, "base64")); return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64")), decipher.final()]).toString("utf8")); };

await mkdir(dataRoot, { recursive: true });
const command = process.argv[2];
if (command === "set") { const key = process.argv[3]; const value = process.argv.slice(4).join(" "); if (!key || !value) throw new Error("Usage: node portable/secrets.mjs set KEY VALUE"); const current = existsSync(file) ? decrypt(await readFile(file, "utf8")) : {}; current[key] = value; await writeFile(file, encrypt(current), { mode: 0o600 }); console.log(`Encrypted secret saved: ${key}`); }
else if (command === "list") { const current = existsSync(file) ? decrypt(await readFile(file, "utf8")) : {}; console.log(Object.keys(current).join("\n")); }
else throw new Error("Usage: node portable/secrets.mjs set KEY VALUE | list");
