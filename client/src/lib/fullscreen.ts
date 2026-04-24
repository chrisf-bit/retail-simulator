/**
 * Request fullscreen on the document element. Must be called from a user
 * gesture (button click, keypress). Silently swallows errors if the browser
 * refuses or fullscreen is unavailable (older browsers, iframes with the
 * wrong permissions, etc).
 */
export function enterFullscreen(): Promise<void> | void {
  if (typeof document === "undefined") return;
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };
  const req = el.requestFullscreen ?? el.webkitRequestFullscreen ?? el.mozRequestFullScreen ?? el.msRequestFullscreen;
  if (!req) return;
  try {
    const r = req.call(el);
    if (r && typeof (r as Promise<void>).catch === "function") {
      (r as Promise<void>).catch(() => undefined);
    }
  } catch {
    // Ignore. Browser refused or we are in an unsupported context.
  }
}

export function exitFullscreen(): void {
  if (typeof document === "undefined") return;
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  };
  const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen ?? doc.mozCancelFullScreen ?? doc.msExitFullscreen;
  if (!exit) return;
  try {
    const r = exit.call(doc);
    if (r && typeof (r as Promise<void>).catch === "function") {
      (r as Promise<void>).catch(() => undefined);
    }
  } catch {
    // Ignore.
  }
}

export function isFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as Document & {
    webkitFullscreenElement?: Element;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
  };
  return !!(doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.mozFullScreenElement ?? doc.msFullscreenElement);
}
