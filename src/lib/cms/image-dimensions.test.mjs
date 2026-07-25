// image-dimensions.test.mjs — synthetic headers, so the test is deterministic
// and does not depend on the media tree being materialised on disk (the repo
// lives in an iCloud folder that evicts file contents; a corpus-backed test
// would be slow and would fail for reasons that have nothing to do with the
// code). The real corpus is validated by scripts/migrate/02-media.mjs itself.
import test from "node:test";
import assert from "node:assert/strict";
import { imageDimensions, mimeFor } from "./image-dimensions.mjs";

// ── builders ────────────────────────────────────────────────────────────────

/** Minimal JPEG: SOI, an APP0 segment to skip over, then SOF0 carrying the size. */
function jpegBuf(width, height, { marker = 0xc0, extraSegments = [] } = {}) {
  const parts = [Buffer.from([0xff, 0xd8])];
  for (const { id, len } of extraSegments) {
    const seg = Buffer.alloc(2 + len);
    seg.writeUInt8(0xff, 0);
    seg.writeUInt8(id, 1);
    const body = Buffer.alloc(len);
    body.writeUInt16BE(len, 0);
    parts.push(seg.subarray(0, 2), body);
  }
  const sof = Buffer.alloc(11);
  sof.writeUInt8(0xff, 0);
  sof.writeUInt8(marker, 1);
  sof.writeUInt16BE(8, 2); // segment length
  sof.writeUInt8(8, 4); // precision
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  parts.push(sof);
  return Buffer.concat(parts);
}

function pngBuf(width, height) {
  const b = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write("IHDR", 12, "ascii");
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}

function webpLossy(width, height) {
  const b = Buffer.alloc(32);
  b.write("RIFF", 0, "ascii");
  b.write("WEBP", 8, "ascii");
  b.write("VP8 ", 12, "ascii");
  b.writeUInt16LE(width & 0x3fff, 26);
  b.writeUInt16LE(height & 0x3fff, 28);
  return b;
}

function webpExtended(width, height) {
  const b = Buffer.alloc(32);
  b.write("RIFF", 0, "ascii");
  b.write("WEBP", 8, "ascii");
  b.write("VP8X", 12, "ascii");
  const w = width - 1;
  const h = height - 1;
  b[24] = w & 0xff;
  b[25] = (w >> 8) & 0xff;
  b[26] = (w >> 16) & 0xff;
  b[27] = h & 0xff;
  b[28] = (h >> 8) & 0xff;
  b[29] = (h >> 16) & 0xff;
  return b;
}

// ── jpeg ────────────────────────────────────────────────────────────────────

test("jpeg dimensions are read from SOF0, width and height not transposed", () => {
  // 1600x1200 and 1200x1600 must not read the same — transposition is the
  // classic silent bug here, and it would hand every portrait slot a landscape
  // aspect hint.
  assert.deepEqual(imageDimensions(jpegBuf(1600, 1200)), {
    width: 1600,
    height: 1200,
    mime: "image/jpeg",
  });
  assert.deepEqual(imageDimensions(jpegBuf(1200, 1600)), {
    width: 1200,
    height: 1600,
    mime: "image/jpeg",
  });
});

test("segments before the frame header are skipped, not misread", () => {
  const buf = jpegBuf(800, 600, { extraSegments: [{ id: 0xe0, len: 16 }, { id: 0xdb, len: 67 }] });
  assert.deepEqual(imageDimensions(buf), { width: 800, height: 600, mime: "image/jpeg" });
});

test("progressive jpeg (SOF2) is read like any other frame marker", () => {
  assert.deepEqual(imageDimensions(jpegBuf(640, 480, { marker: 0xc2 })), {
    width: 640,
    height: 480,
    mime: "image/jpeg",
  });
});

test("a Huffman table marker is not mistaken for a frame header", () => {
  // 0xC4 sits inside the SOF numeric range and is the reason isSOF excludes it.
  const buf = jpegBuf(320, 240, { extraSegments: [{ id: 0xc4, len: 30 }] });
  assert.deepEqual(imageDimensions(buf), { width: 320, height: 240, mime: "image/jpeg" });
});

test("a truncated jpeg returns null instead of throwing", () => {
  assert.equal(imageDimensions(jpegBuf(100, 100).subarray(0, 6)), null);
});

test("a malformed segment length does not loop forever", () => {
  const b = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(imageDimensions(b), null);
});

// ── png / webp ──────────────────────────────────────────────────────────────

test("png dimensions are read from IHDR", () => {
  assert.deepEqual(imageDimensions(pngBuf(2048, 1024)), {
    width: 2048,
    height: 1024,
    mime: "image/png",
  });
});

test("a RIFF file that is not WEBP is not treated as one", () => {
  const b = Buffer.alloc(32);
  b.write("RIFF", 0, "ascii");
  b.write("WAVE", 8, "ascii");
  assert.equal(imageDimensions(b), null);
});

test("lossy and extended webp both read", () => {
  assert.deepEqual(imageDimensions(webpLossy(1200, 800)), {
    width: 1200,
    height: 800,
    mime: "image/webp",
  });
  assert.deepEqual(imageDimensions(webpExtended(3000, 2000)), {
    width: 3000,
    height: 2000,
    mime: "image/webp",
  });
});

// ── nulls ───────────────────────────────────────────────────────────────────

test("unrecognised, empty and missing input all return null rather than throwing", () => {
  assert.equal(imageDimensions(Buffer.from("not an image at all, really")), null);
  assert.equal(imageDimensions(Buffer.alloc(0)), null);
  assert.equal(imageDimensions(null), null);
  assert.equal(imageDimensions(undefined), null);
});

// ── mime ────────────────────────────────────────────────────────────────────

test("mime is derived from the extension for the assets that are not images", () => {
  assert.equal(mimeFor("01-hero-film.webm"), "video/webm");
  assert.equal(mimeFor("01-hero-film.mp4"), "video/mp4");
  assert.equal(mimeFor("moroccan-fish.JPG"), "image/jpeg");
  assert.equal(mimeFor("weird.xyz"), "application/octet-stream");
});
