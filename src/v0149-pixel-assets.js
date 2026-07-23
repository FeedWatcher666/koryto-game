"use strict";
(() => {
  const VERSION = "0.14.9 TEST.10";
  const BUILD_VERSION = "0.14.9-test.10";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;
  const ASSET_VERSION = "v0149-quarantine-1";
  const ART_DIRECTION_APPROVED = false;
  const DATA_PREFIX = "data:image/png;base64,";
  const MAX_PNG_DIMENSION = 16384;
  const DISPLAY_TITLE = `Koryto ${VERSION} – komunální politické RPG`;
  const DISPLAY_DESCRIPTION = `Koryto ${VERSION}: třináctidenní komunální kampaň, kauzy, štáb, debaty, volby a bezpečné offline rozhraní.`;
  const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const ALLOWED_BIT_DEPTHS = {
    0: [1, 2, 4, 8, 16],
    2: [8, 16],
    3: [1, 2, 4, 8],
    4: [8, 16],
    6: [8, 16]
  };

  const assets = { atlas: "", village: "", scenes: "", logo: "" };
  const assetState = {
    ready: false,
    installed: false,
    fallbackReason: "",
    quarantined: [],
    chunkCounts: { atlas: 0, village: 0, scenes: 0, logo: 0 },
    base64Lengths: { atlas: 0, village: 0, scenes: 0, logo: 0 },
    validation: { atlas: null, village: null, scenes: null, logo: null }
  };

  function result(ok, reason, details = {}) {
    return { ok, reason, ...details };
  }

  function chunksOf() {
    return globalThis.KorytoAssetChunks149 || {};
  }

  function decodeBase64(value) {
    if (typeof value !== "string" || !value || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return null;
    const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
    const bytes = new Uint8Array(value.length / 4 * 3 - padding);
    let output = 0;
    for (let offset = 0; offset < value.length; offset += 4) {
      const quartet = value.slice(offset, offset + 4);
      if (offset + 4 < value.length && quartet.includes("=")) return null;
      const a = BASE64_ALPHABET.indexOf(quartet[0]);
      const b = BASE64_ALPHABET.indexOf(quartet[1]);
      const c = quartet[2] === "=" ? 0 : BASE64_ALPHABET.indexOf(quartet[2]);
      const d = quartet[3] === "=" ? 0 : BASE64_ALPHABET.indexOf(quartet[3]);
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

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
      table[index] = value >>> 0;
    }
    return table;
  })();

  function crc32(bytes, start, end) {
    let crc = 0xffffffff;
    for (let index = start; index < end; index += 1) crc = CRC_TABLE[(crc ^ bytes[index]) & 255] ^ crc >>> 8;
    return (crc ^ 0xffffffff) >>> 0;
  }

  function validatePngBase64(base64) {
    const bytes = decodeBase64(base64);
    if (!bytes) return result(false, "invalid-base64");
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (bytes.length < 45 || signature.some((byte, index) => bytes[index] !== byte)) return result(false, "invalid-signature");

    let offset = 8;
    let first = true;
    let seenHeader = false;
    let seenPalette = false;
    let seenData = false;
    let idatBytes = 0;
    let dataSequenceClosed = false;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = -1;
    const chunks = [];

    while (offset < bytes.length) {
      if (offset + 12 > bytes.length) return result(false, "truncated-chunk-header", { width, height, chunks });
      const length = readU32(bytes, offset);
      const typeStart = offset + 4;
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      const crcOffset = dataEnd;
      const next = crcOffset + 4;
      const type = String.fromCharCode(bytes[typeStart], bytes[typeStart + 1], bytes[typeStart + 2], bytes[typeStart + 3]);

      if (!/^[A-Za-z]{4}$/.test(type)) return result(false, "invalid-chunk-type", { width, height, chunks });
      if (length > bytes.length || next > bytes.length) return result(false, `truncated-${type.toLowerCase()}`, { width, height, chunks });
      if (readU32(bytes, crcOffset) !== crc32(bytes, typeStart, dataEnd)) return result(false, `crc-${type.toLowerCase()}`, { width, height, chunks });

      chunks.push({ type, length });
      if (first && type !== "IHDR") return result(false, "ihdr-not-first", { chunks });

      if (type === "IHDR") {
        if (seenHeader || length !== 13) return result(false, "invalid-ihdr", { chunks });
        width = readU32(bytes, dataStart);
        height = readU32(bytes, dataStart + 4);
        bitDepth = bytes[dataStart + 8];
        colorType = bytes[dataStart + 9];
        if (!width || !height || width > MAX_PNG_DIMENSION || height > MAX_PNG_DIMENSION) return result(false, "invalid-dimensions", { width, height, chunks });
        if (!ALLOWED_BIT_DEPTHS[colorType]?.includes(bitDepth) || bytes[dataStart + 10] !== 0 || bytes[dataStart + 11] !== 0 || bytes[dataStart + 12] > 1) {
          return result(false, "unsupported-ihdr", { width, height, bitDepth, colorType, chunks });
        }
        seenHeader = true;
      } else if (type === "PLTE") {
        const paletteEntries = length / 3;
        const indexedPaletteTooLarge = colorType === 3 && paletteEntries > (1 << bitDepth);
        if (!seenHeader || seenPalette || seenData || length === 0 || length % 3 !== 0 || length > 768 || indexedPaletteTooLarge || colorType === 0 || colorType === 4) {
          return result(false, "invalid-plte", { width, height, bitDepth, colorType, paletteEntries, chunks });
        }
        seenPalette = true;
      } else if (type === "IDAT") {
        if (!seenHeader) return result(false, "invalid-idat", { width, height, chunks });
        if (dataSequenceClosed) return result(false, "nonconsecutive-idat", { width, height, chunks });
        if (colorType === 3 && !seenPalette) return result(false, "missing-plte", { width, height, chunks });
        seenData = true;
        idatBytes += length;
      } else if (type === "IEND") {
        if (!seenHeader || !seenData || idatBytes === 0 || length !== 0) return result(false, "invalid-iend", { width, height, chunks });
        if (next !== bytes.length) return result(false, "trailing-data", { width, height, chunks });
        return result(true, "ok", { width, height, byteLength: bytes.length, chunks });
      }

      if (seenData && type !== "IDAT" && type !== "IEND") dataSequenceClosed = true;
      first = false;
      offset = next;
    }

    return result(false, "missing-iend", { width, height, chunks });
  }

  function chunksProvided(name) {
    const list = chunksOf()[name];
    return Array.isArray(list) ? list.length > 0 : list !== undefined && list !== null;
  }

  function assemblePng(name) {
    const list = chunksOf()[name];
    assetState.chunkCounts[name] = Array.isArray(list) ? list.length : 0;
    if (!Array.isArray(list) || list.length === 0 || list.some(part => typeof part !== "string")) {
      assetState.validation[name] = result(false, "missing-chunks");
      return "";
    }
    const base64 = list.join("").replace(/\s+/g, "");
    assetState.base64Lengths[name] = base64.length;
    const validation = validatePngBase64(base64);
    assetState.validation[name] = validation;
    return validation.ok ? `${DATA_PREFIX}${base64}` : "";
  }

  function lockCanonicalValue(target, property, value) {
    if (!target) return false;
    const marker = `__v0149Locked_${property}`;
    if (target[marker]) return true;
    try {
      target[property] = value;
      Object.defineProperty(target, property, {
        configurable: true,
        enumerable: true,
        get: () => value,
        set: () => {}
      });
      Object.defineProperty(target, marker, { configurable: true, value: true });
      return true;
    } catch (_) {
      try { target[property] = value; } catch (_) {}
      return false;
    }
  }

  function canonicalLabels() {
    if (typeof document === "undefined") return false;
    const titleNode = document.querySelector?.("title");
    if (titleNode) titleNode.textContent = DISPLAY_TITLE;
    lockCanonicalValue(document, "title", DISPLAY_TITLE);
    lockCanonicalValue(document.querySelector?.(".brand h1 span"), "textContent", `Dolní Vejprnice ${VERSION}`);
    const description = document.querySelector?.('meta[name="description"]');
    lockCanonicalValue(description, "content", DISPLAY_DESCRIPTION);
    description?.setAttribute?.("content", DISPLAY_DESCRIPTION);
    const footer = document.querySelector?.(".footer-note");
    if (footer) {
      const cleanFooter = String(footer.textContent || "").replace(/\s*·\s*0\.14(?:\.\d+)?\s+(?:TEST\.\d+|RC\d+)$/u, "");
      lockCanonicalValue(footer, "textContent", `${cleanFooter} · ${VERSION}`);
    }
    if (document.documentElement?.dataset) document.documentElement.dataset.korytoBuild = BUILD_VERSION;
    return true;
  }

  function clearAssetVariables() {
    if (typeof document === "undefined" || !document.documentElement?.style) return;
    for (const name of Object.keys(assets)) document.documentElement.style.setProperty(`--v0149-${name}`, "none");
  }

  function fallback(reason) {
    for (const name of Object.keys(assets)) assets[name] = "";
    assetState.ready = false;
    assetState.fallbackReason = reason;
    assetState.quarantined = Object.entries(assetState.validation)
      .filter(([name, validation]) => validation && !validation.ok && assetState.chunkCounts[name] > 0)
      .map(([name]) => name);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      clearAssetVariables();
      root?.classList?.remove("v0149-production-art");
      root?.classList?.add("v0149-assets-fallback");
      if (root?.dataset) {
        root.dataset.korytoAssets = "quarantined";
        root.dataset.korytoAssetReason = reason;
      }
    }
    return false;
  }

  function preload() {
    const assembled = {
      atlas: assemblePng("atlas"),
      village: assemblePng("village"),
      scenes: assemblePng("scenes"),
      logo: assemblePng("logo")
    };

    const invalidRequired = ["atlas", "village"].filter(name => !assembled[name]);
    if (invalidRequired.length) {
      const reason = invalidRequired.map(name => `${name}:${assetState.validation[name]?.reason || "invalid"}`).join(",");
      return fallback(reason);
    }

    const invalidOptional = ["scenes", "logo"].filter(name => chunksProvided(name) && !assembled[name]);
    if (invalidOptional.length) {
      const reason = invalidOptional.map(name => `${name}:${assetState.validation[name]?.reason || "invalid"}`).join(",");
      return fallback(reason);
    }

    if (!ART_DIRECTION_APPROVED) return fallback("art-direction-not-approved");

    Object.assign(assets, {
      atlas: assembled.atlas,
      village: assembled.village,
      scenes: assembled.scenes || assembled.village,
      logo: assembled.logo || assembled.atlas
    });
    assetState.ready = true;
    assetState.fallbackReason = "";
    assetState.quarantined = [];
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      for (const [name, value] of Object.entries(assets)) root.style.setProperty(`--v0149-${name}`, `url("${value}")`);
      root.classList.remove("v0149-assets-fallback");
      root.classList.add("v0149-production-art");
      root.dataset.korytoAssets = ASSET_VERSION;
    }
    return true;
  }

  function visualAudit() {
    return {
      version: VERSION,
      buildVersion: BUILD_VERSION,
      saveVersion: SAVE_VERSION,
      saveSchema: SAVE_SCHEMA,
      assetVersion: ASSET_VERSION,
      artDirectionApproved: ART_DIRECTION_APPROVED,
      assetsReady: assetState.ready,
      fallbackReason: assetState.fallbackReason,
      quarantined: [...assetState.quarantined],
      chunkCounts: { ...assetState.chunkCounts },
      base64Lengths: { ...assetState.base64Lengths },
      validation: Object.fromEntries(Object.entries(assetState.validation).map(([name, validation]) => [name, validation ? { ...validation, chunks: validation.chunks ? validation.chunks.map(chunk => ({ ...chunk })) : [] } : null]))
    };
  }

  function install() {
    canonicalLabels();
    if (typeof document === "undefined") return false;
    if (!assetState.installed) {
      document.addEventListener?.("click", canonicalLabels);
      document.addEventListener?.("change", canonicalLabels);
      assetState.installed = true;
    }
    return preload();
  }

  const api = {
    VERSION,
    BUILD_VERSION,
    SAVE_VERSION,
    SAVE_SCHEMA,
    ASSET_VERSION,
    ART_DIRECTION_APPROVED,
    validatePngBase64,
    canonicalLabels,
    preload,
    visualAudit,
    install
  };
  Object.defineProperties(api, {
    atlas: { enumerable: true, get: () => assets.atlas },
    village: { enumerable: true, get: () => assets.village },
    scenes: { enumerable: true, get: () => assets.scenes },
    logo: { enumerable: true, get: () => assets.logo }
  });

  globalThis.KorytoCanonicalBuild149 = { version: VERSION, buildVersion: BUILD_VERSION, title: DISPLAY_TITLE, description: DISPLAY_DESCRIPTION, apply: canonicalLabels };
  globalThis.KorytoPixelAssets149 = api;
  globalThis.KorytoTest149 = api;
  install();
})();
