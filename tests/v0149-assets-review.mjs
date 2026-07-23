import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const read = path => fs.readFileSync(path, "utf8");
const runtime = read("src/v0149-pixel-assets.js");
const chunkFiles = [
  ["src/v0149-assets/atlas-1.js", "atlas"],
  ["src/v0149-assets/atlas-2.js", "atlas"],
  ["src/v0149-assets/atlas-3.js", "atlas"]
];

function chunkPayload(path, kind) {
  const source = read(path);
  const match = source.match(new RegExp(`KorytoAssetChunks149\\.${kind}\\.push\\("([A-Za-z0-9+/=]+)"\\)`));
  assert.ok(match, `${path} must contain a ${kind} chunk`);
  return match[1];
}

const atlasBase64 = chunkFiles.map(([path, kind]) => chunkPayload(path, kind)).join("");
const atlasBytes = Buffer.from(atlasBase64, "base64");
const signature = atlasBytes.subarray(0, 8);

function runRuntime(chunks) {
  const context = vm.createContext({ console, KorytoAssetChunks149: chunks });
  context.globalThis = context;
  context.window = context;
  vm.runInContext(runtime, context, { filename: "src/v0149-pixel-assets.js" });
  return context.KorytoPixelAssets149;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 255] ^ crc >>> 8;
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}

function pngChunks(bytes) {
  const chunks = [];
  let offset = 8;
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    chunks.push({
      type: bytes.subarray(offset + 4, offset + 8).toString("ascii"),
      data: bytes.subarray(offset + 8, offset + 8 + length),
      bytes: bytes.subarray(offset, end)
    });
    offset = end;
  }
  return chunks;
}

const api = runRuntime({ atlas: [atlasBase64], village: [atlasBase64], scenes: [], logo: [] });
assert.equal(api.validatePngBase64(atlasBase64).ok, true);
assert.equal(api.preload(), false);
assert.equal(api.visualAudit().fallbackReason, "art-direction-not-approved", "missing optional packs may use the documented fallback gate");

const chunks = pngChunks(atlasBytes);
const firstIdatIndex = chunks.findIndex(chunk => chunk.type === "IDAT");
const idatData = Buffer.concat(chunks.filter(chunk => chunk.type === "IDAT").map(chunk => chunk.data));
const split = Math.max(1, Math.floor(idatData.length / 2));
const prefixChunks = chunks.slice(0, firstIdatIndex).map(chunk => chunk.bytes);
const iend = chunks.find(chunk => chunk.type === "IEND").bytes;
const withEmptyIdat = Buffer.concat([
  signature,
  ...prefixChunks,
  makeChunk("IDAT", idatData.subarray(0, split)),
  makeChunk("IDAT", Buffer.alloc(0)),
  makeChunk("IDAT", idatData.subarray(split)),
  iend
]).toString("base64");
assert.equal(api.validatePngBase64(withEmptyIdat).ok, true, "an empty IDAT inside a consecutive non-empty stream is browser-valid");

const onlyEmptyIdat = Buffer.concat([
  signature,
  ...prefixChunks,
  makeChunk("IDAT", Buffer.alloc(0)),
  iend
]).toString("base64");
assert.equal(api.validatePngBase64(onlyEmptyIdat).reason, "invalid-iend", "a PNG still needs actual compressed image data");

const originalIdats = chunks.filter(chunk => chunk.type === "IDAT").map(chunk => chunk.bytes);
const unknownCritical = Buffer.concat([
  signature,
  ...prefixChunks,
  makeChunk("ABCD", Buffer.from([1, 2, 3])),
  ...originalIdats,
  iend
]).toString("base64");
assert.equal(api.validatePngBase64(unknownCritical).reason, "unknown-critical-chunk", "unknown critical chunks must quarantine a browser-incompatible PNG");

const invalidReservedBit = Buffer.concat([
  signature,
  ...prefixChunks,
  makeChunk("abcd", Buffer.from([1])),
  ...originalIdats,
  iend
]).toString("base64");
assert.equal(api.validatePngBase64(invalidReservedBit).reason, "invalid-chunk-reserved-bit", "lowercase PNG reserved bits must be rejected");

const corruptOptional = Buffer.concat([signature, Buffer.alloc(64)]).toString("base64");
const invalidScenes = runRuntime({ atlas: [atlasBase64], village: [atlasBase64], scenes: [corruptOptional], logo: [] });
assert.equal(invalidScenes.preload(), false);
const invalidScenesAudit = invalidScenes.visualAudit();
assert.match(invalidScenesAudit.fallbackReason, /^scenes:/, "a supplied corrupt optional scene pack must quarantine the whole art layer");
assert.ok(invalidScenesAudit.quarantined.includes("scenes"));

const malformedLogo = runRuntime({ atlas: [atlasBase64], village: [atlasBase64], scenes: [], logo: corruptOptional });
assert.equal(malformedLogo.preload(), false);
assert.match(malformedLogo.visualAudit().fallbackReason, /^logo:/, "a supplied non-array logo payload must also quarantine the art layer");

console.log("v0.14.9 review regressions passed: optional corruption quarantined and empty IDAT handled safely");
