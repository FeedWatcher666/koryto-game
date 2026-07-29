import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = fs.readFileSync(path.join(root, "VERSION"), "utf8").trim();
const target = path.join(root, "dist", `koryto-v${version}`);
const modules = ["data.js", "rules.js", "state.js", "dice.js", "ui.js", "main.js"];

function stripModuleSyntax(source, file) {
  const withoutImports = source.replace(/import\s+[\s\S]*?\s+from\s+["'][^"']+["'];\s*/g, "");
  const withoutExports = withoutImports
    .replace(/\bexport\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/g, "")
    .replace(/export\s*\{[^}]*\};?\s*/g, "");
  if (/^\s*(?:import|export)\b/m.test(withoutExports)) {
    throw new Error(`Unsupported module syntax remains in ${file}`);
  }
  return withoutExports.trim();
}

fs.rmSync(path.join(root, "dist"), {recursive: true, force: true});
fs.mkdirSync(path.join(target, "src"), {recursive: true});
fs.mkdirSync(path.join(target, "styles"), {recursive: true});

const parts = modules.map(file => {
  const source = fs.readFileSync(path.join(root, "src", file), "utf8");
  return `\n/* ${file} */\n${stripModuleSyntax(source, file)}\n`;
});
const runtime = `"use strict";\n(() => {${parts.join("\n")}\n})();\n`;
const runtimePath = path.join(target, "src", "runtime.js");
fs.writeFileSync(runtimePath, runtime);

const sourceIndex = fs.readFileSync(path.join(root, "index.html"), "utf8");
const offlineIndex = sourceIndex.replace(
  '<script type="module" src="src/main.js"></script>',
  '<script defer src="src/runtime.js"></script>'
);
if (offlineIndex === sourceIndex) throw new Error("Source index does not contain the expected module entrypoint");
fs.writeFileSync(path.join(target, "index.html"), offlineIndex);

for (const file of ["VERSION", "README.md"]) {
  fs.copyFileSync(path.join(root, file), path.join(target, file));
}
fs.cpSync(path.join(root, "styles"), path.join(target, "styles"), {recursive: true});
if (fs.existsSync(path.join(root, "docs"))) fs.cpSync(path.join(root, "docs"), path.join(target, "docs"), {recursive: true});

const syntax = spawnSync(process.execPath, ["--check", runtimePath], {encoding: "utf8"});
if (syntax.status !== 0) {
  process.stderr.write(syntax.stderr || syntax.stdout);
  process.exit(syntax.status || 1);
}
if (/\bKorytoApp\b|village-rpg|legacy=1|v017/i.test(runtime)) {
  throw new Error("Generated runtime contains a forbidden legacy reference");
}
if (!runtime.includes("playD20Roll") || !runtime.includes("dice-overlay")) {
  throw new Error("Generated runtime is missing the D20 animation layer");
}
console.log(`Built ${path.relative(root, target)} from ${modules.length} canonical modules.`);
