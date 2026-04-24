"use client";

import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { enterFullscreen, exitFullscreen, isFullscreen } from "@/lib/fullscreen";

/**
 * Small round icon button that toggles fullscreen. Styled for dark headers.
 * Auto-updates when the user exits via Esc.
 */
export function FullscreenToggle({ className }: { className?: string }) {
  const [full, setFull] = useState(false);

  useEffect(() => {
    const update = () => setFull(isFullscreen());
    update();
    document.addEventListener("fullscreenchange", update);
    document.addEventListener("webkitfullscreenchange", update);
    return () => {
      document.removeEventListener("fullscreenchange", update);
      document.removeEventListener("webkitfullscreenchange", update);
    };
  }, []);

  const Icon = full ? Minimize2 : Maximize2;
  const label = full ? "Exit fullscreen" : "Enter fullscreen";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => (full ? exitFullscreen() : enterFullscreen())}
      className={
        "press flex h-9 w-9 items-center justify-center rounded-full bg-surface-panel text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white " +
        (className ?? "")
      }
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
