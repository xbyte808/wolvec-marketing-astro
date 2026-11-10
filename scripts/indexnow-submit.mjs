// IndexNow submission for wolvec.ai (W783).
// Usage: npm run indexnow -- [https://wolvec.ai/page ...]
// With no arguments, submits every <loc> in the live sitemap.
// Submit only pages that were added, changed or deleted. Never retries.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HOST = "wolvec.ai";
const ORIGIN = `https://${HOST}/`;
const SITEMAP = `${ORIGIN}sitemap-0.xml`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const MEANINGS = {
  200: "received",
  202: "received, validation pending",
  400: "bad format",
  403: "verification file or value not found",
  422: "URLs not on the host",
  429: "too many requests",
};

function stop(message) {
  console.error(`indexnow: ${message}`);
  process.exit(1);
}

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const matches = readdirSync(publicDir).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (matches.length !== 1) {
  stop(`expected exactly one 32 character hex .txt file in public/, found ${matches.length}`);
}
const value = matches[0].slice(0, -4);
const fileValue = readFileSync(path.join(publicDir, matches[0]), "utf8").trim();
if (fileValue !== value) stop("the local verification file content does not match its name");

const keyLocation = `${ORIGIN}${value}.txt`;
const check = await fetch(keyLocation);
const checkBody = check.status === 200 ? (await check.text()).trim() : "";
if (check.status !== 200 || checkBody !== value) {
  stop(`the live verification file is not ready (status ${check.status}); not submitting`);
}

let urlList = process.argv.slice(2);
if (urlList.length > 0) {
  const bad = urlList.filter((u) => !u.startsWith(ORIGIN));
  if (bad.length > 0) stop(`every URL must start with ${ORIGIN}; refused: ${bad.join(" ")}`);
} else {
  const res = await fetch(SITEMAP);
  if (res.status !== 200) stop(`sitemap returned ${res.status}`);
  const xml = await res.text();
  urlList = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  if (urlList.length === 0) stop("no URLs found in the sitemap");
}

const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: value, keyLocation, urlList }),
});
const text = await response.text();
console.log(`URLs sent: ${urlList.length}`);
console.log(`HTTP status: ${response.status} (${MEANINGS[response.status] ?? "unexpected"})`);
if (text) console.log(`Response body: ${text}`);
process.exit(response.status === 200 || response.status === 202 ? 0 : 1);
