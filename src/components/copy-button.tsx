"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
      className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
