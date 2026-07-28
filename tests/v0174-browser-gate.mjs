import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sourcePath = path.resolve('tests/v0171-browser-gate.mjs');
const generatedPath = path.resolve('tests/.v0174-browser-gate.generated.mjs');

const source = fs.readFileSync(sourcePath, 'utf8');
const generated = source
  .replaceAll('0.17.3-test.1', '0.17.4-test.1')
  .replaceAll('0.17.3 TEST.1', '0.17.4 TEST.1')
  .replaceAll('0\\.17\\.3-test\\.1', '0\\.17\\.4-test\\.1')
  .replaceAll('0\\.17\\.3 TEST\\.1', '0\\.17\\.4 TEST\\.1')
  .replace(
    "globalThis.KorytoUI173?.audit?.().active);",
    "globalThis.KorytoUI173?.audit?.().active && globalThis.KorytoUI174?.audit?.().active);"
  );

if (generated === source) {
  throw new Error('v0.17.4 browser gate could not adapt the legacy gate');
}
if (!generated.includes('globalThis.KorytoUI174?.audit?.().active')) {
  throw new Error('v0.17.4 browser gate does not wait for style stabilization');
}

fs.writeFileSync(generatedPath, generated);
try {
  await import(`${pathToFileURL(generatedPath).href}?v0174=${Date.now()}`);
} finally {
  fs.rmSync(generatedPath, {force: true});
}
