import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const runtime = fs.readFileSync("src/v0149-pixel-assets.js", "utf8");
const hardening = fs.readFileSync("src/v0149-png-hardening.js", "utf8");
const chunkFiles = ["src/v0149-assets/atlas-1.js", "src/v0149-assets/atlas-2.js", "src/v0149-assets/atlas-3.js"];
const atlasBase64 = chunkFiles.map(path => {
  const match = fs.readFileSync(path, "utf8").match(/KorytoAssetChunks149\.atlas\.push\("([A-Za-z0-9+/=]+)"\)/);
  assert.ok(match, `${path} must contain an atlas chunk`);
  return match[1];
}).join("");
const bytes = Buffer.from(atlasBase64, "base64");

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();
function crc32(input) {
  let crc = 0xffffffff;
  for (const byte of input) crc = CRC_TABLE[(crc ^ byte) & 255] ^ crc >>> 8;
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}
function chunksOf(png) {
  const result = [];
  let offset = 8;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const end = offset + 12 + length;
    result.push({ type:png.subarray(offset + 4, offset + 8).toString("ascii"), bytes:png.subarray(offset, end) });
    offset = end;
  }
  return result;
}

const context = vm.createContext({ console, KorytoAssetChunks149:{ atlas:[atlasBase64], village:[atlasBase64], scenes:[], logo:[] } });
context.globalThis = context;
context.window = context;
vm.runInContext(runtime, context, { filename:"src/v0149-pixel-assets.js" });
vm.runInContext(hardening, context, { filename:"src/v0149-png-hardening.js" });
const api = context.KorytoPixelAssets149;
assert.equal(api.validatePngBase64(atlasBase64).ok, true);
assert.equal(api.__criticalChunkHardening, true);

const chunks = chunksOf(bytes);
const signature = bytes.subarray(0, 8);
const firstIdat = chunks.findIndex(item => item.type === "IDAT");
const prefix = chunks.slice(0, firstIdat).map(item => item.bytes);
const idats = chunks.filter(item => item.type === "IDAT").map(item => item.bytes);
const iend = chunks.find(item => item.type === "IEND").bytes;
const unknownCritical = Buffer.concat([signature, ...prefix, chunk("ABCD", Buffer.from([1,2,3])), ...idats, iend]).toString("base64");
const invalidReserved = Buffer.concat([signature, ...prefix, chunk("abcd", Buffer.from([1])), ...idats, iend]).toString("base64");
assert.equal(api.validatePngBase64(unknownCritical).reason, "unknown-critical-chunk");
assert.equal(api.validatePngBase64(invalidReserved).reason, "invalid-chunk-reserved-bit");

console.log("v0.14.9 layered critical chunk hardening passed");
