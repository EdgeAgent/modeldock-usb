import { readFileSync, writeFileSync } from "node:fs";

const [, , sourcePath, outputPath, message, sha = ""] = process.argv;
if (!sourcePath || !outputPath || !message) throw new Error("Usage: node build-github-content-payload.mjs <source> <output> <message> [sha]");
const payload = {
  message,
  content: readFileSync(sourcePath).toString("base64"),
};
if (sha) payload.sha = sha;
writeFileSync(outputPath, JSON.stringify(payload));
