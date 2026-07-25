// image-dimensions.mjs — read width and height out of an image header.
//
// WHY NOT sharp: the migration needs dimensions for 64 files, once. sharp is a
// native dependency with a platform-specific binary, and the whole deploy story
// already turns on that fact (a build on macOS ships darwin binaries that crash
// on the Linux VPS). Adding it to a one-shot migration script to read four
// integers would be paying that cost twice for nothing.
//
// The desk needs these numbers: next/image wants intrinsic dimensions, and the
// aspect-ratio hint in every image slot is derived from them. An image row with
// no dimensions is one the editor gets no guidance on.
//
// Header parsing only — no pixel data is decoded. Pure, zero deps, tested.

/** JPEG start-of-frame markers. C4 is a Huffman table, C8 is reserved, CC is arithmetic coding. */
const isSOF = (m) => m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;

function jpeg(buf) {
  let offset = 2; // past FFD8
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      // resynchronise: a corrupt or padded segment should not send us into a
      // wrong-but-plausible read
      offset++;
      continue;
    }
    const marker = buf[offset + 1];

    // standalone markers carry no length payload
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    if (marker === 0xff) {
      offset++; // fill byte
      continue;
    }

    if (isSOF(marker)) {
      return { width: buf.readUInt16BE(offset + 7), height: buf.readUInt16BE(offset + 5) };
    }

    const segLen = buf.readUInt16BE(offset + 2);
    if (segLen < 2) return null; // malformed; refuse rather than loop
    offset += 2 + segLen;
  }
  return null;
}

function png(buf) {
  if (buf.length < 24) return null;
  if (buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function webp(buf) {
  if (buf.length < 30) return null;
  const fourcc = buf.toString("ascii", 12, 16);

  if (fourcc === "VP8 ") {
    // lossy: 3-byte start code at 23, then 16-bit LE width/height, 14 bits each
    return {
      width: buf.readUInt16LE(26) & 0x3fff,
      height: buf.readUInt16LE(28) & 0x3fff,
    };
  }
  if (fourcc === "VP8L") {
    // lossless: 14 bits width-1, 14 bits height-1, packed little-endian from 21
    const bits = buf.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (fourcc === "VP8X") {
    // extended: 24-bit LE canvas width-1 at 24, height-1 at 27
    const w = buf[24] | (buf[25] << 8) | (buf[26] << 16);
    const h = buf[27] | (buf[28] << 8) | (buf[29] << 16);
    return { width: w + 1, height: h + 1 };
  }
  return null;
}

/**
 * Returns {width, height, mime} or null when the buffer is not a recognised
 * image. Null is a finding, not an exception: the caller reports the file and
 * carries on, because one unreadable header must not abort an inventory.
 */
export function imageDimensions(buf) {
  // 12 bytes is exactly what signature sniffing needs (the RIFF/WEBP check
  // reads bytes 8..12). Each format parser bounds-checks its own reads, so a
  // larger blanket guard here would reject small-but-valid input for no reason.
  if (!buf || buf.length < 12) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8) {
    const d = jpeg(buf);
    return d ? { ...d, mime: "image/jpeg" } : null;
  }
  if (buf.toString("hex", 0, 8) === "89504e470d0a1a0a") {
    const d = png(buf);
    return d ? { ...d, mime: "image/png" } : null;
  }
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const d = webp(buf);
    return d ? { ...d, mime: "image/webp" } : null;
  }
  return null;
}

/** Extension → mime, for the non-image assets in the tree (the hero film). */
export function mimeFor(filename) {
  const ext = String(filename).toLowerCase().split(".").pop();
  return (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      avif: "image/avif",
      gif: "image/gif",
      svg: "image/svg+xml",
      mp4: "video/mp4",
      webm: "video/webm",
    }[ext] ?? "application/octet-stream"
  );
}
