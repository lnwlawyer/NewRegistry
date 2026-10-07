const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const cleanText = value => typeof value === 'string' ? value.trim() : '';

export const sanitizeBookmarkList = (value, limit = 100) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .filter(isRecord)
    .map(item => ({
      ...item,
      id: cleanText(item.id),
      title: cleanText(item.title),
      tab: cleanText(item.tab),
      path: Array.isArray(item.path) ? item.path.filter(v => typeof v === 'string').slice(0, 8) : [],
      ids: isRecord(item.ids) ? item.ids : {},
      ...(cleanText(item.url) ? { url: cleanText(item.url) } : {}),
    }))
    .filter(item => item.id && item.title && item.tab && !seen.has(item.id) && seen.add(item.id))
    .slice(0, limit);
};

export const sanitizeVisitedList = (value, limit = 500) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(v => typeof v === 'string').map(v => v.trim()).filter(Boolean))].slice(-limit);
};

export const sanitizeSearchHistory = (value, limit = 8) =>
  sanitizeBookmarkList(value, limit);

export const loadSafeJsonState = (storage, key, sanitizer) => {
  try {
    const raw = storage?.getItem?.(key);
    if (!raw) return sanitizer([]);
    return sanitizer(JSON.parse(raw));
  } catch {
    return sanitizer([]);
  }
};

export const saveSafeJsonState = (storage, key, value, sanitizer) => {
  const safe = sanitizer(value);
  try {
    storage?.setItem?.(key, JSON.stringify(safe));
  } catch {}
  return safe;
};
