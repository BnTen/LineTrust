"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DISCLAIMER_SHORT_FR } from "@/lib/disclaimer";

export function TrajetShare({ title }: { title: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "error">(
    "idle",
  );

  async function onShare() {
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url, text: DISCLAIMER_SHORT_FR });
        setStatus("shared");
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2200);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus("error");
    }
  }

  const feedback =
    status === "copied"
      ? "Lien copié"
      : status === "shared"
        ? "Partagé"
        : status === "error"
          ? "Partage impossible — copie l’URL manuellement"
          : null;

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-11 w-fit px-5"
        onClick={onShare}
      >
        Partager ce trajet
      </Button>
      {feedback ? (
        <p className="text-sm text-ink-muted" role="status">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
