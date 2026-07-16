"use client";
import { useRef, useState } from "react";
import { DUR, EASE, cssDur, cssEase } from "@/lib/motion-tokens";
import { uploadImage } from "@/lib/cms/actions";
import { T } from "@/lib/cms/desk-strings";

const MAX_EDGE = 1600;
const MAX_BYTES = 300 * 1024;

// The browser does the heavy lifting: a canvas round-trip downscales to ≤1600px,
// re-encodes to webp (JPEG on Safari builds without webp encoding), and — as a
// free consequence of re-encoding — strips EXIF, including the GPS coordinates a
// phone photo carries. The SERVER still re-checks magic bytes, size and type:
// this function is convenience, not security (see lib/cms/safe-path.mjs).
async function reencode(file: File): Promise<{ base64: string; type: string }> {
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
  // One quality step down if still over budget — better than rejecting a photo
  // the client just took on their phone.
  if (blob.size > MAX_BYTES) {
    const retry = await encode(blob.type, 0.68);
    if (retry && retry.size < blob.size) blob = retry;
  }
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (const byte of buf) bin += String.fromCharCode(byte);
  return { base64: btoa(bin), type: blob.type };
}

export function MediaPicker({
  url,
  alt,
  onChange,
}: {
  url: string;
  alt: string;
  onChange: (url: string, alt: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const micro = { transitionDuration: cssDur(DUR.micro), transitionTimingFunction: cssEase(EASE.micro) };

  async function pick(file: File) {
    setError("");
    setBusy(true);
    try {
      const { base64 } = await reencode(file);
      const r = await uploadImage(base64, alt || file.name.replace(/\.[^.]+$/, ""));
      if (r.ok && r.url) onChange(r.url, alt || "");
      else if (!r.ok) setError(r.errors[0]?.msg ?? T("media.uploadFailed"));
    } catch {
      setError(T("media.readFailed"));
    }
    setBusy(false);
  }

  return (
    <div className="mt-2">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of a just-uploaded asset
        <img src={url} alt={alt} className="mb-3 w-full rounded-[4px] border border-line" />
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="w-full rounded-[4px] border border-line bg-bg2 px-4 py-3 text-sm font-bold text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
        style={micro}
      >
        {busy ? T("media.uploading") : url ? T("media.replace") : T("media.choose")}
      </button>
      <label className="mt-3 block">
        <span className="text-xs text-muted">{T("media.altLabel")}</span>
        <input
          value={alt}
          onChange={(e) => onChange(url, e.target.value)}
          className="mt-1 w-full rounded-[4px] border border-line bg-bg2 px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
      </label>
      {error && <p className="mt-2 text-sm font-semibold text-ink">{error}</p>}
    </div>
  );
}
