"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/photos";
import type { ActionState } from "./action-form";
import { secondaryButtonClass } from "./ui";

const MAX_DIMENSION = 1600;
const MAX_BYTES = 1_900_000; // the bucket rejects files over 2 MB

/**
 * Shrinks a photo in the browser before upload (PRD: cost limits). Output is
 * JPEG so the card and link-preview renderer can read it.
 */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.85, 0.75, 0.65, 0.5]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error("This photo is too large even after compression.");
}

export function PhotoUpload({
  weddingId,
  folder,
  onUploaded,
  label = "Upload photo",
  disabled,
}: {
  weddingId: string;
  folder?: "goals";
  onUploaded: (path: string) => Promise<ActionState>;
  label?: string;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(file: File) {
    setError(null);
    setBusy(true);
    try {
      if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
      const blob = await compress(file);
      const path = `${weddingId}/${folder ? `${folder}/` : ""}${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await createClient()
        .storage.from(PHOTO_BUCKET)
        .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (uploadError) throw new Error("Upload failed. Please try again.");
      const result = await onUploaded(path);
      if (!result?.ok) throw new Error(result?.message ?? "Could not save the photo.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
        }}
      />
      <button
        type="button"
        className={secondaryButtonClass}
        disabled={busy || disabled}
        onClick={() => input.current?.click()}
      >
        {busy ? "Uploading…" : label}
      </button>
      {error && (
        <span className="text-sm text-red-700" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
