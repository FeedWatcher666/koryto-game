import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const currentHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const currentWorkflow = fs.readFileSync(path.join(root, ".github/workflows/v0142-stability.yml"), "utf8");

function linkDirectory(workspace, name) {
  fs.symlinkSync(path.join(root, name), path.join(workspace, name), "dir");
}

function runLayer(name, testFile, version, displayVersion, htmlTransform, workflowTransform = source => source) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), `koryto-${name}-`));
  try {
    for (const dir of ["src", "styles", "assets", "docs"]) linkDirectory(workspace, dir);
    fs.mkdirSync(path.join(workspace, ".github/workflows"), { recursive: true });
    fs.writeFileSync(path.join(workspace, "VERSION"), `${version}\n`);
    fs.writeFileSync(path.join(workspace, "index.html"), htmlTransform(currentHtml));
    fs.writeFileSync(path.join(workspace, ".github/workflows/v0142-stability.yml"), workflowTransform(currentWorkflow));
    const result = spawnSync(process.execPath, [path.join(root, testFile)], { cwd: workspace, stdio: "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${displayVersion} regression failed with exit ${result.status}`);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

runLayer(
  "v0149",
  "tests/v0149-assets.mjs",
  "0.14.9-test.10",
  "v0.14.9 TEST.10",
  source => source
    .replaceAll("0.15.2 TEST.1", "0.14.9 TEST.10")
    .replaceAll("0.15.2-test.1", "0.14.9-test.10")
    .replaceAll("reference match pass", "komunální politické RPG")
    .replace("</head>", "<meta name=\"v0149-contract\" content=\"komunální politické RPG\"></head>"),
  source => source
    .replaceAll("v0.15.2 TEST.1", "v0.14.9 TEST.10")
    .replaceAll("v0.15.2-test.1", "v0.14.9-test.10")
);

runLayer(
  "v0150",
  "tests/v0150-visual-foundation.mjs",
  "0.15.0-test.1",
  "v0.15.0 TEST.1",
  source => source
    .replaceAll("0.15.2 TEST.1", "0.15.0 TEST.1")
    .replaceAll("0.15.2-test.1", "0.15.0-test.1")
);

console.log("historical v0.14.9 and v0.15.0 layered regressions passed");
