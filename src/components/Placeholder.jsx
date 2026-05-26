// Striped placeholder thumbnail with a monospace label — used until real photos drop in.
const HUES = [220, 200, 30, 12, 260, 140];

export default function Placeholder({ label = 'project shot', seed = 0, ratio = '4/3' }) {
  const hue = HUES[((seed % HUES.length) + HUES.length) % HUES.length];
  const bg = `oklch(0.92 0.015 ${hue})`;
  const stripe = `oklch(0.86 0.02 ${hue})`;
  const ink = `oklch(0.35 0.02 ${hue})`;
  return (
    <div
      className="ph"
      style={{
        aspectRatio: ratio,
        background: `repeating-linear-gradient(135deg, ${bg} 0 14px, ${stripe} 14px 15px)`,
        color: ink,
      }}
    >
      <span className="ph__label">{label}</span>
      <span className="ph__corner">IMG</span>
    </div>
  );
}
