/**
 * Deterministic avatar for a named persona. Uses DiceBear's free, MIT-licensed
 * HTTP API with the `notionists-neutral` style - abstract, warm-line, no race-
 * or age-specific features, which suits people-moment scenarios without
 * committing to a particular visual identity for each direct report.
 *
 * The same name always produces the same avatar. SVG URL means it scales
 * cleanly and prints fine.
 */

const STYLE = "notionists-neutral";

function seed(name: string): string {
  return encodeURIComponent(name.trim().toLowerCase());
}

export function PersonaAvatar({
  name,
  size = 64,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const src = `https://api.dicebear.com/9.x/${STYLE}/svg?seed=${seed(name)}&backgroundColor=222326&radius=50`;
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      className={className}
      style={{ width: size, height: size, borderRadius: "50%", display: "block" }}
    />
  );
}
