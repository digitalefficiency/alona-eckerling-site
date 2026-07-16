"use client";
import { useCallback, useState } from "react";
import { uploadImage } from "@/lib/cms/actions";
import { T } from "@/lib/cms/desk-strings";

const MAX_EDGE = 1600;
const MAX_BYTES = 300 * 1024;

// THE single browser-side re-encode + upload path, shared by MediaPicker (single
// image), GalleryField (many), and the inline-image button in DocEditor. Extracting
// it means one security posture, one size budget, one EXIF-strip, everywhere.
//
// The canvas round-trip downscales to <=1600px, re-encodes to webp (JPEG on Safari
// builds without webp encoding), and strips EXIF (incl. phone GPS) as a free
// consequence. The SERVER still re-checks magic bytes, size and type — this is
// convenience, not the boundary (see lib/cms/safe-path.mjs).
async function reencode(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const encode = (type: string, q: number) =>
    new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
  let blob = await encode("image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", 0.82);
  if (!blob) throw new Error("encode");
  if (blob.size > MAX_BYTES) {
    const retry = await encode(blob.type, 0.68);
    if (retry && retry.size < blob.size) blob = retry;
  }
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (const byte of buf) bin += String.fromCharCode(byte);
  return btoa(bin);
}

export type UploadResult = { url: string } | { error: string };

// Returns { upload, busy, error, setError }. `upload(file, alt)` re-encodes and
// uploads, resolving to { url } or { error } — the caller decides what to do with the
// url (set a field, push into a gallery, splice markdown at the caret).
export function useImageUpload() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = useCallback(async (file: File, alt: string): Promise<UploadResult> => {
    setError("");
    setBusy(true);
    try {
      const base64 = await reencode(file);
      const r = await uploadImage(base64, alt || file.name.replace(/\.[^.]+$/, ""));
      if (r.ok && r.url) return { url: r.url };
      const msg = !r.ok ? (r.errors[0]?.msg ?? T("media.uploadFailed")) : T("media.uploadFailed");
      setError(msg);
      return { error: msg };
    } catch {
      const msg = T("media.readFailed");
      setError(msg);
      return { error: msg };
    } finally {
      setBusy(false);
    }
  }, []);

  return { upload, busy, error, setError };
}
