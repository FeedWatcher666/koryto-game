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
  const DISPLAY_TITLE = `Koryto ${VERSION} â€“ komunÃ¡lnÃ­ politickÃ© RPG`;
  const DISPLAY_DESCRIPTION = `Koryto ${VERSION}: tÅ™inÃ¡ctidennÃ­ komunÃ¡lnÃ­ kampaÅˆ, kauzy, Å¡tÃ¡b, debaty, volby a bezpeÄnÃ© offline rozhranÃ­.`;
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
        if (!seenHeader || length === 0) return result(false, "invalid-idat", { width, height, chunks });
        if (dataSequenceClosed) return result(false, "nonconsecutive-idat", { width, height, chunks });
        if (colorType === 3 && !seenPalette) return result(false, "missing-plte", { width, height, chunks });
        seenData = true;
      } else if (type === "IEND") {
        if (!seenHeader || !seenData || length !== 0) return result(false, "invalid-iend", { width, height, chunks });
        if (next !== bytes.length) return result(false, "trailing-data", { width, height, chunks });
        return result(true, "ok", { width, height, byteLength: bytes.length, chunks });
      }

      if (seenData && type !== "IDAT" && type !== "IEND") dataSequenceClosed = true;
      first = false;
      offset = next;
    }

    return result(false, "missing-iend", { width, height, chunks });
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
    lockCanonicalValue(document.querySelector?.(".brand h1 span"), "textContent", `DolnÃ­ Vejprnice ${VERSION}`);
    const description = document.querySelector?.('meta[name="description"]');
    lockCanonicalValue(description, "content", DISPLAY_DESCRIPTION);
    description?.setAttribute?.("content", DISPLAY_DESCRIPTION);
    const footer = document.querySelector?.(".footer-note");
    if (footer) {
      const cleanFooter = String(footer.textContent || "").replace(/\s*Â·\s*0\.14(?:\.\d+)?\s+(?:TEST\.\d+|RC\d+)$/u, "");
      lockCanonicalValue(footer, "textContent", `${cleanFooter} Â· ${VERSION}`);
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
    assetState.fallbackReasom¸€ôÉ•…Í½¸ì(€€€…ÍÍ•ÑMÑ…Ñ”¹ÅÕ…É…¹Ñ¥¹•€ô=‰©•Ğ¹•¹ÑÉ¥•Ì¡…ÍÍ•ÑMÑ…Ñ”¹Ù…±¥‘…Ñ¥½¸¤(€€€€€€¹™¥±Ñ•È ¡m¹…µ”°Ù…±¥‘…Ñ¥½¹t¤€ôøÙ…±¥‘…Ñ¥½¸€˜˜€…Ù…±¥‘…Ñ¥½¸¹½¬€˜˜…ÍÍ•ÑMÑ…Ñ”¹¡Õ¹­½Õ¹ÑÍm¹…µ•t€ø€À¤(€€€€€€¹µ…À ¡m¹…µ•t¤€ôø¹…µ”¤ì(€€€¥˜€¡ÑåÁ•½˜‘½Õµ•¹Ğ€„ôô€‰Õ¹‘•™¥¹•ˆ¤ì(€€€€€½¹ÍĞÉ½½Ğ€ô‘½Õµ•¹Ğ¹‘½Õµ•¹Ñ±•µ•¹Ğì(€€€€€±•…ÉÍÍ•ÑY…É¥…‰±•Ì ¤ì(€€€€€É½½Ğü¹±…ÍÍ1¥ÍĞü¹É•µ½Ù” ‰ØÀÄĞäµÁÉ½‘ÕÑ¥½¸µ…ÉĞˆ¤ì(€€€€€É½½Ğü¹±…ÍÍ1¥ÍĞü¹…‘ ‰ØÀÄĞäµ…ÍÍ•ÑÌµ™…±±‰…¬ˆ¤ì(€€€€€¥˜€¡É½½Ğü¹‘…Ñ…Í•Ğ¤ì(€€€€€€€É½½Ğ¹‘…Ñ…Í•Ğ¹­½ÉåÑ½ÍÍ•ÑÌ€ô€‰ÅÕ…É…¹Ñ¥¹•ˆì(€€€€€€€É½½Ğ¹‘…Ñ…Í•Ğ¹­½ÉåÑ½ÍÍ•ÑI•…Í½¸€ôÉ•…Í½¸ì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸™…±Í”ì(€ô((€™Õ¹Ñ¥½¸ÁÉ•±½… ¤ì(€€€½¹ÍĞ…ÍÍ•µ‰±•€ôì(€€€€€…Ñ±…Ìè…ÍÍ•µ‰±•A¹œ ‰…Ñ±…Ìˆ¤°(€€€€€Ù¥±±…”è…ÍÍ•µ‰±•A¹œ ‰Ù¥±±…”ˆ¤°(€€€€€Í•¹•Ìè…ÍÍ•µ‰±•A¹œ ‰Í•¹•Ìˆ¤°(€€€€€±½¼è…ÍÍ•µ‰±•A¹œ ‰±½¼ˆ¤(€€€ôì((€€€½¹ÍĞ¥¹Ù…±¥‘I•ÅÕ¥É•€ôl‰…Ñ±…Ìˆ°€‰Ù¥±±…”‰t¹™¥±Ñ•È¡¹…µ”€ôø€……ÍÍ•µ‰±•‘m¹…µ•t¤ì(€€€¥˜€¡¥¹Ù…±¥‘I•ÅÕ¥É•¹±•¹Ñ ¤ì(€€€€€½¹ÍĞÉ•…Í½¸€ô¥¹Ù…±¥‘I•ÅÕ¥É•¹µ…À¡¹…µ”€ôø€‘í¹…µ•ôè‘í…ÍÍ•ÑMÑ…Ñ”¹Ù…±¥‘…Ñ¥½¹m¹…µ•tü¹É•…Í½¸ñğ€‰¥¹Ù…±¥‰õ€¤¹©½¥¸ ˆ°ˆ¤ì(€€€€€É•ÑÕÉ¸™…±±‰…¬¡É•…Í½¸¤ì(€€€ô((€€€¥˜€ …IQ}%IQ%=9}AAI=Y¤É•ÑÕÉ¸™…±±‰…¬ ‰…ÉĞµ‘¥É•Ñ¥½¸µ¹½Ğµ…ÁÁÉ½Ù•ˆ¤ì((€€€=‰©•Ğ¹…ÍÍ¥¸¡…ÍÍ•ÑÌ°ì(€€€€€…Ñ±…Ìè…ÍÍ•µ‰±•¹…Ñ±…Ì°(€€€€€Ù¥±±…”è…ÍÍ•µ‰±•¹Ù¥±±…”°(€€€€€Í•¹•Ìè…ÍÍ•µ‰±•¹Í•¹•Ìñğ…ÍÍ•µ‰±•¹Ù¥±±…”°(€€€€€±½¼è…ÍÍ•µ‰±•¹±½¼ñğ…ÍÍ•µ‰±•¹…Ñ±…Ì(€€€ô¤ì(€€€…ÍÍ•ÑMÑ…Ñ”¹É•…‘ä€ôÑÉÕ”ì(€€€…ÍÍ•ÑMÑ…Ñ”¹™…±±‰…­I•…Í½¸€ô€ˆˆì(€€€…ÍÍ•ÑMÑ…Ñ”¹ÅÕ…É…¹Ñ¥¹•€ômtì(€€€¥˜€¡ÑåÁ•½˜‘½Õµ•¹Ğ€„ôô€‰Õ¹‘•™¥¹•ˆ¤ì(€€€€€½¹ÍĞÉ½½Ğ€ô‘½Õµ•¹Ğ¹‘½Õµ•¹Ñ±•µ•¹Ğì(€€€€€™½È€¡½¹ÍĞm¹…µ”°Ù…±Õ•t½˜=‰©•Ğ¹•¹ÑÉ¥•Ì¡…ÍÍ•ÑÌ¤¤É½½Ğ¹ÍÑå±”¹Í•ÑAÉ½Á•ÉÑä¡€´µØÀÄĞä´‘í¹…µ•õ€°ÕÉ° ˆ‘íÙ…±Õ•ôˆ¥€¤ì(€€€€€É½½Ğ¹±…ÍÍ1¥ÍĞ¹É•µ½Ù” ‰ØÀÄĞäµ…ÍÍ•ÑÌµ™…±±‰…¬ˆ¤ì(€€€€€É½½Ğ¹±…ÍÍ1¥ÍĞ¹…‘ ‰ØÀÄĞäµÁÉ½‘ÕÑ¥½¸µ…ÉĞˆ¤ì(€€€€€É½½Ğ¹‘…Ñ…Í•Ğ¹­½ÉåÑ½ÍÍ•ÑÌ€ôMMQ}YIM%=8ì(€€€ô(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô((€™Õ¹Ñ¥½¸Ù¥ÍÕ…±Õ‘¥Ğ ¤ì(€€€É•ÑÕÉ¸ì(€€€€€Ù•ÉÍ¥½¸èYIM%=8°(€€€€€‰Õ¥±‘Y•ÉÍ¥½¸è	U%1}YIM%=8°(€€€€€Í…Ù•Y•ÉÍ¥½¸èMY}YIM%=8°(€€€€€Í…Ù•M¡•µ„èMY}M!5°(€€€€€…ÍÍ•ÑY•ÉÍ¥½¸èMMQ}YIM%=8°(€€€€€…ÉÑ¥É•Ñ¥½¹ÁÁÉ½Ù•èIQ}%IQ%=9}AAI=Y°(€€€€€…ÍÍ•ÑÍI•…‘äè…ÍÍ•ÑMÑ…Ñ”¹É•…‘ä°(€€€€€™…±±‰…­I•…Í½¸è…ÍÍ•ÑMÑ…Ñ”¹™…±±‰…­I•…Í½¶âÀ¢V&çF–æVC¢²ââæ76WE7FFRçV&çF–æVEÒÀ¢6‡Væ´6÷VçG3¢²ââæ76WE7FFRæ6‡Væ´6÷VçG2ÒÀ¢&6ScDÆVæwF‡3¢²ââæ76WE7FFRæ&6ScDÆVæwF‡2ÒÀ¢fÆ–FF–öã¢ö&¦V7Bæg&öÔVçG&–W2„ö&¦V7BæVçG&–W2†76WE7FFRçfÆ–FF–öâ’æÖ‚…¶æÖRÂfÆ–FF–öåÒ’Óâ¶æÖRÂfÆ–FF–öâò²ââçfÆ–FF–öâÂ6‡Væ·3¢fÆ–FF–öâæ6‡Væ·2òfÆ–FF–öâæ6‡Væ·2æÖ†6‡Væ²Óâ‡²ââæ6‡Væ²Ò’’¢µÒÒ¢çVÆÅÒ’¢Ó°¢Ğ ¢gVæ7F–öâ–ç7FÆÂ‚’°¢6æöæ–6ÄÆ&VÇ2‚“°¢–b‡G—VöbFö7VÖVçBÓÓÒ'VæFVf–æVB"’&WGW&âfÇ6S°¢–b‚76WE7FFRæ–ç7FÆÆVB’°¢Fö7VÖVçBæFDWfVçDÆ—7FVæW#òâ‚&6Æ–6²"Â6æöæ–6ÄÆ&VÇ2“°¢Fö7VÖVçBæFDWfVçDÆ—7FVæW#òâ‚&6†ævR"Â6æöæ–6ÄÆ&VÇ2“°¢76WE7FFRæ–ç7FÆÆVBÒG'VS°¢Ğ¢&WGW&â&VÆöB‚“°¢Ğ ¢6öç7B’Ò°¢dU%4”ôâÀ¢%T”ÄEõdU%4”ôâÀ¢4dUõdU%4”ôâÀ¢4dUõ44„TÔÀ¢54UEõdU%4”ôâÀ¢%EôD•$T5D”ôåô$õdTBÀ¢fÆ–FFUæt&6ScBÀ¢6æöæ–6ÄÆ&VÇ2À¢&VÆöBÀ¢f—7VÄVF—BÀ¢–ç7FÆÀ¢Ó°¢ö&¦V7BæFVf–æU&÷W'F–W2†’Â°¢FÆ3¢²VçVÖW&&ÆS¢G'VRÂvWC¢‚’Óâ76WG2æFÆ2ÒÀ¢f–ÆÆvS¢²VçVÖW&&ÆS¢G'VRÂvWC¢‚’Óâ76WG2çf–ÆÆvRÒÀ¢66VæW3¢²VçVÖW&&ÆS¢G'VRÂvWC¢‚’Óâ76WG2ç66VæW2ÒÀ¢Æövó¢²VçVÖW&&ÆS¢G'VRÂvWC¢‚’Óâ76WG2æÆövòĞ¢Ò“° ¢vÆö&ÅF†—2ä¶÷'—Fô6æöæ–6Ä'V–ÆCC’Ò²fW'6–öã¢dU%4”ôâÂ'V–ÆEfW'6–öã¢%T”ÄEõdU%4”ôâÂF—FÆS¢D•5Ä•õD•DÄRÂFW67&—F–öã¢D•5Ä•ôDU45$•D”ôâÂÇ“¢6æöæ–6ÄÆ&VÇ2Ó°¢vÆö&ÅF†—2ä¶÷'—Fõ—†VÄ76WG3C’Ò“°¢vÆö&ÅF†—2ä¶÷'—FõFW7CC’Ò“°¢–ç7FÆÂ‚“°§Ò’‚“°