// Resolve an image reference from projects.json into a usable URL.
// - Absolute URLs (http...) or root-absolute paths (/...) are used as-is.
// - Everything else is treated as relative to the app base (e.g. "data/images/foo.jpg").
export function resolveAsset(src) {
  if (!src) return '';
  if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src;
  return `${import.meta.env.BASE_URL}${src}`;
}
