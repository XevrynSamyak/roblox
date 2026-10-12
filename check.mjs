// node check.mjs
// Checks assets/data.js before you publish: ids, genres, loader lines and image files.
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";

const here = (path) => new URL(path, import.meta.url);
const sandbox = { window: {} };
vm.runInNewContext(readFileSync(here("./assets/data.js"), "utf8"), sandbox);
const { games, discord } = sandbox.window.OMNITY;

const GENRES = ["Shooter", "PvP", "Obby", "Survival", "Simulator", "Anime", "Battlegrounds", "RNG", "Horror"];
const problems = [];
const ids = new Set();
const universes = new Set();

for (const g of games) {
  const at = `${g.game || "?"} (${g.id || "no id"})`;
  if (!/^[a-z0-9-]+$/.test(g.id || "")) problems.push(`${at}: id must be lowercase letters, digits and dashes`);
  if (ids.has(g.id)) problems.push(`${at}: id is used twice`);
  ids.add(g.id);
  if (g.universeId && universes.has(g.universeId)) problems.push(`${at}: universeId is shared with another game`);
  universes.add(g.universeId);
  if (!g.game) problems.push(`${at}: game name is empty`);
  if (!["live", "soon"].includes(g.status)) problems.push(`${at}: status must be "live" or "soon"`);
  if (!GENRES.includes(g.genre)) problems.push(`${at}: genre "${g.genre}" has no cover pattern (use one of ${GENRES.join(", ")})`);
  if (g.load && !(g.load.startsWith("loadstring(") && g.load.includes("https://"))) problems.push(`${at}: load should be a loadstring line with an https URL`);
  if (g.image && !/^https?:\/\//.test(g.image) && !existsSync(here(g.image))) problems.push(`${at}: image ${g.image} is not in the folder`);
  if (g.features && Object.values(g.features).some((list) => !Array.isArray(list) || list.length === 0)) problems.push(`${at}: every feature group needs at least one feature`);
  for (const key of ["placeId", "universeId"]) {
    if (g[key] !== undefined && !(Number.isSafeInteger(g[key]) && g[key] > 0)) problems.push(`${at}: ${key} must be a whole number`);
  }
  if (!g.universeId) problems.push(`${at}: no universeId, so it shows no live player count or Roblox thumbnail`);
}

if (games.filter((g) => g.featured).length > 1) problems.push("Only one game can be featured");
if (!/^https:\/\/discord\.gg\/[\w-]+$/.test(discord)) problems.push(`discord link looks wrong: ${discord}`);

const live = games.filter((g) => g.status === "live");
const noLine = live.filter((g) => !g.load).map((g) => g.game);
console.log(`${games.length} games: ${live.length} live, ${games.length - live.length} coming soon, ${games.filter((g) => g.image).length} with an image.`);
if (noLine.length) console.log(`Live without a loader line (they link to the Discord): ${noLine.join(", ")}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("data.js is good to publish.");
