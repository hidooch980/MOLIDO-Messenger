const GRADIENTS: [string, string][] = [
  ["#3b82f6", "#22d3ee"],
  ["#8b5cf6", "#3b82f6"],
  ["#22d3ee", "#10b981"],
  ["#f43f5e", "#8b5cf6"],
  ["#eab308", "#f43f5e"],
  ["#10b981", "#3b82f6"],
];

function gradientFor(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

interface AvatarProps {
  name: string;
  size?: number;
  ring?: boolean;
}

/** An initials avatar with a deterministic per-user gradient — no image upload exists yet (see RISK_REGISTER.md). */
export function Avatar({ name, size = 36, ring = false }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const [from, to] = gradientFor(name);

  return (
    <span
      className={ring ? "avatar avatar-ring" : "avatar"}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
