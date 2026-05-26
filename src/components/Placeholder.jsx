// Plain light-gray placeholder used until a real photo is provided.
export default function Placeholder({ label = '', ratio = '4/3' }) {
  return (
    <div className="ph" style={{ aspectRatio: ratio }}>
      <span className="ph__label">{label}</span>
    </div>
  );
}
