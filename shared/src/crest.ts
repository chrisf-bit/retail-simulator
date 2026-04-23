/**
 * Deterministic crest generator. Given a team's chosen name, produces a stable
 * triple of (shape, icon, accent) drawn from the same pools every time. Both
 * the client (React) and the server (HTML report) use this to render the
 * same crest for the same team name.
 */

export const CREST_SHAPES = ["shield", "hexagon", "circle", "square", "diamond"] as const;
export const CREST_ICONS = ["storefront", "trolley", "basket", "tag", "scales", "key"] as const;
export const CREST_ACCENTS = ["dot", "stripe", "ring", "corner", "underline", "bar"] as const;

export type CrestShape = typeof CREST_SHAPES[number];
export type CrestIcon = typeof CREST_ICONS[number];
export type CrestAccent = typeof CREST_ACCENTS[number];

export interface Crest {
  shape: CrestShape;
  icon: CrestIcon;
  accent: CrestAccent;
}

// djb2 hash. Stable, fast, adequate for small-bucket bucket assignment.
function hash(input: string): number {
  let h = 5381;
  const str = (input ?? "").trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function crestFor(teamName: string): Crest {
  const h = hash(teamName || "team");
  const shape = CREST_SHAPES[h % CREST_SHAPES.length];
  // Use different strides for each field so short names still vary.
  const icon = CREST_ICONS[Math.floor(h / 7) % CREST_ICONS.length];
  const accent = CREST_ACCENTS[Math.floor(h / 53) % CREST_ACCENTS.length];
  return { shape, icon, accent };
}
