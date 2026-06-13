export function toSlug(name) {
  return (
    String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'post'
  );
}

export function makeExcerpt(text, max = 300) {
  return String(text || '').slice(0, max);
}
