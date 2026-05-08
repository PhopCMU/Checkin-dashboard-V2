#!/usr/bin/env node
/*
  scripts/autodetect-skills.cjs

  CommonJS script to detect tech stack and recommend agent skills registered
  in `.agents/skills/_index.json`.

  Usage (preview only):
    node scripts/autodetect-skills.cjs --dry-run

  Apply (writes auto-selection and helper skill):
    node scripts/autodetect-skills.cjs --yes
*/

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run") || argv.includes("-n");
const YES =
  argv.includes("--yes") || argv.includes("-y") || argv.includes("--apply");
const SKILLS_ARG = argv.find(
  (a) => a.startsWith("--skills=") || a.startsWith("-s="),
);
const FORCED = SKILLS_ARG
  ? SKILLS_ARG.split("=")[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : [];

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch (e) {
    return null;
  }
}
function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

const pkg = readJson("package.json") || {};
const deps = Object.assign(
  {},
  pkg.dependencies || {},
  pkg.devDependencies || {},
);
const depSet = new Set(Object.keys(deps));
const hasDep = (n) => depSet.has(n);

const detected = {
  typescript: exists("tsconfig.json") || hasDep("typescript"),
  react:
    hasDep("react") ||
    hasDep("react-dom") ||
    exists("src/App.tsx") ||
    exists("src/main.tsx"),
  vite: exists("vite.config.ts") || exists("vite.config.js") || hasDep("vite"),
  tailwind:
    hasDep("tailwindcss") ||
    exists("tailwind.config.js") ||
    exists("tailwind.config.cjs"),
  node:
    hasDep("express") || hasDep("fastify") || hasDep("koa") || hasDep("node"),
  prisma:
    exists("prisma/schema.prisma") ||
    hasDep("@prisma/client") ||
    hasDep("prisma"),
  next: hasDep("next"),
  vue: hasDep("vue"),
  svelte: hasDep("svelte"),
  docker: exists("Dockerfile"),
  nginx: exists("nginx"),
};

const recommendSet = new Set();
if (detected.react) {
  recommendSet.add("react-best-practices");
  recommendSet.add("composition-patterns");
  recommendSet.add("frontend-design");
  recommendSet.add("accessibility");
}
if (detected.typescript) {
  recommendSet.add("typescript-advanced-types");
  recommendSet.add("react-best-practices");
}
if (detected.vite) recommendSet.add("vite");
if (detected.tailwind) recommendSet.add("tailwind-css-patterns");
if (detected.node) {
  recommendSet.add("nodejs-backend-patterns");
  recommendSet.add("nodejs-best-practices");
}
if (detected.prisma) recommendSet.add("nodejs-backend-patterns");
if (detected.next) {
  recommendSet.add("vercel-react-best-practices");
  recommendSet.add("seo");
}
if (detected.vue || detected.svelte) {
  recommendSet.add("frontend-design");
  recommendSet.add("accessibility");
}

FORCED.forEach((s) => recommendSet.add(s));
const recommendations = Array.from(recommendSet).sort();

const INDEX_PATH = path.join(".agents", "skills", "_index.json");
const indexJson = readJson(INDEX_PATH);

if (
  !indexJson ||
  !Array.isArray(indexJson.skills) ||
  indexJson.skills.length === 0
) {
  console.log("Warning: .agents/skills/_index.json not found or empty.");
  console.log(
    "This script only recommends skills that are registered in `.agents/skills/_index.json`.",
  );
  console.log("\nDetected snapshot:");
  console.log(JSON.stringify(detected, null, 2));
  console.log(
    "\nSuggested skills (NOT registered):",
    recommendations.join(", ") || "(none)",
  );
  console.log(
    "\nTo enable registered-only recommendations, create `.agents/skills/_index.json` with skill entries.",
  );
  if (DRY) process.exit(0);
  if (!YES) process.exit(0);
}

// If index exists, intersect recommended -> registered
let available = [];
let selected = [];
if (indexJson && Array.isArray(indexJson.skills)) {
  available = indexJson.skills.map((s) => s.name).filter(Boolean);
  selected = recommendations.filter((r) => available.includes(r));
}

console.log("\nDetected snapshot:");
console.log(JSON.stringify(detected, null, 2));
console.log("\nRegistered skills in index:", available.join(", ") || "(none)");
console.log(
  "\nRecommended skills (registered-only):",
  selected.length ? selected.join(", ") : "(none)",
);

if (DRY) {
  console.log(
    "\nDry-run: no files written. Run with --yes to write auto-selection and helper skill.",
  );
  process.exit(0);
}

if (!YES) {
  console.log(
    "\nRun with `--yes` to write `.agents/skills/auto-selection.json` and create a helper skill.",
  );
  process.exit(0);
}

// Apply: write auto-selection and helper SKILL.md
const outDir = path.join(ROOT, ".agents", "skills");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, "auto-selection.json");
const outData = {
  generatedAt: new Date().toISOString(),
  detected,
  recommended: selected,
  indexPath: INDEX_PATH,
};
fs.writeFileSync(outFile, JSON.stringify(outData, null, 2), "utf8");

const helperDir = path.join(outDir, "auto-selection-helper");
if (!fs.existsSync(helperDir)) fs.mkdirSync(helperDir);
const helperFile = path.join(helperDir, "SKILL.md");
if (!fs.existsSync(helperFile)) {
  const md = [
    "# Auto-selection Helper",
    "",
    "This helper was created by `scripts/autodetect-skills.cjs` to record the auto-selected skills for this repository.",
    "",
    "**Selected skills:**",
    ...(selected.length ? selected.map((s) => `- ${s}`) : ["- (none)"]),
    "",
    "**How to use:**",
    "- Review `.agents/skills/auto-selection.json`",
    "- Add or remove skills from the index or this file as needed.",
    "",
    "Generated: " + new Date().toISOString(),
  ].join("\n");
  fs.writeFileSync(helperFile, md, "utf8");
}

console.log(`\nWrote ${outFile} and created helper skill at ${helperDir}`);
console.log("Done.");
