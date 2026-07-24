"use strict";
(() => {
  const api = globalThis.KorytoPixelAssets149;
  if (!api || api.__criticalChunkHardening) return;
  const originalValidate = api.validatePngBase64.bind(api);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const knownCritical = new Set(["IHDR", "PLTE", "IDAT", "IEND"]);

  function decode(value) {
    if (typeof value !== "string" || !value || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return null;
    const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
    const bytes = new Uint8Array(value.length / 4 * 3 - padding);
    let output = 0;
    for (let offset = 0; offset < value.length; offset += 4) {
      const quartet = value.slice(offset, offset + 4);
      if (offset + 4 < value.length && quartet.includes("=")) return null;
      const a = alphabet.indexOf(quartet[0]);
      const b = alphabet.indexOf(quartet[1]);
      const c = quartet[2] === "=" ? 0 : alphabet.indexOf(quartet[2]);
      const d = quartet[3] === "=" ? 0 : alphabet.indexOf(quartet[3]);
      if (a < 0 || b < 0 || c < 0 || d < 0) return null;
      const triplet = (a << 18) | (b << 12) | (c << 6) | d;
      if (output < bytes.length) bytes[output++] = triplet >>> 16 & 255;
      if (output < bytes.length) bytes[output++] = triplet >>> 8 & 255;
      if (output < bytes.length) bytes[output++] = triplet & 255;
    }
    return bytes;
  }

  function readU32(bytes, offset) {
    return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
  }

  function validatePngBase64(base64) {
    const basic = originalValidate(base64);
    if (!basic?.ok) return basic;
    const bytes = decode(base64);
    if (!bytes) return { ok:false, reason:"invalid-base64" };
    let offset = 8;
    const chunks = [];
    while (offset < bytes.length) {
      if (offset + 12 > bytes.length) return { ok:false, reason:"truncated-chunk-header", chunks };
      const length = readU32(bytes, offset);
      const typeStart = offset + 4;
      const type = String.fromCharCode(bytes[typeStart], bytes[typeStart + 1], bytes[typeStart + 2], bytes[typeStart + 3]);
      const next = offset + 12 + length;
      if (type[2] !== type[2].toUpperCase()) return { ok:false, reason:"invalid-chunk-reserved-bit", chunks, type };
      if (/^[A-Z]/.test(type) && !knownCritical.has(type)) return { ok:false, reason:"unknown-critical-chunk", chunks, type };
      chunks.push({ type, length });
      if (next > bytes.length) return { ok:false, reason:`truncated-${type.toLowerCase()}`, chunks };
      offset = next;
    }
    return basic;
  }

  Object.defineProperty(api, "validatePngBase64", { configurable:true, enumerable:true, value:validatePngBase64 });
  Object.defineProperty(api, "__criticalChunkHardening", { configurable:true, value:true });
  globalThis.KorytoPngHardening149 = { validatePngBase64, knownCritical:[...knownCritical] };
})();
