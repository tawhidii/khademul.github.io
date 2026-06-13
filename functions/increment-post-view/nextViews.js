export function nextViews(doc) {
  return ((doc && doc.views) || 0) + 1;
}
