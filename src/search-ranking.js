const STOP_WORDS = new Set(['คือ','อะไร','อย่างไร','ยังไง','กรณี','เกี่ยวกับ','ของ','ใน','ที่','และ','หรือ','ให้','ได้','มี','เป็น','ต้อง','การ','ขอ','ช่วย','ค้นหา','ช่วยค้นหา','ช่วยหา','เรื่อง','หน่อย','หน่อยครับ','หน่อยค่ะ','ครับ','ค่ะ']);

export const normalizeSearchText = value => String(value || '')
  .toLowerCase().normalize('NFKC')
  .replace(/[“”"'‘’()[\]{}.,!?;:/\\|<>+=_*#@~\-–—]/g, ' ')
  .replace(/\s+/g, ' ').trim();

const expandToken = token => {
  const cleaned = token.replace(/^(?:ช่วยค้นหา|ช่วยหา|ค้นหา)(?=.{2,})/u, '').replace(/^การ(?=.{2,})/, '').replace(/(?:หน่อยครับ|หน่อยค่ะ|ได้อย่างไร|อย่างไร|ยังไง|หรือไม่|ไหม|มั้ย)$/u, '');
  const parts = [cleaned];
  for (const marker of ['ที่ดิน','คนต่างด้าว','นิติบุคคล','จดทะเบียน','มรดก']) {
    if (cleaned.includes(marker) && cleaned !== marker) parts.push(marker, ...cleaned.split(marker).filter(Boolean));
  }
  return parts;
};

export const tokenizeSearchQuery = value => {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];
  return [...new Set(normalized.split(' ').flatMap(expandToken).filter(token => token.length >= 2 && !STOP_WORDS.has(token)))];
};

const fieldScore = (value, normalizedQuery, tokens, weight) => {
  const text = normalizeSearchText(value);
  if (!text) return 0;
  let score = 0;
  if (text === normalizedQuery) score += 100 * weight;
  else if (normalizedQuery && text.startsWith(normalizedQuery)) score += 60 * weight;
  else if (normalizedQuery && text.includes(normalizedQuery)) score += 40 * weight;
  for (const token of tokens) {
    if (text === token) score += 20 * weight;
    else if (text.startsWith(token)) score += 12 * weight;
    else if (text.includes(token)) score += 6 * weight;
  }
  return score;
};

export const scoreSearchItem = (item, query) => {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeSearchQuery(query);
  if (!normalizedQuery || tokens.length === 0) return 0;
  return fieldScore(item?.title, normalizedQuery, tokens, 4)
    + fieldScore((item?.path || []).join(' '), normalizedQuery, tokens, 2)
    + fieldScore(item?.snippet, normalizedQuery, tokens, 1);
};

export const rankSearchItems = (items, query, activeFilter = 'all', limit = 40) =>
  (items || [])
    .map((item, index) => ({ ...item, score: scoreSearchItem(item, query), _searchOrder: index }))
    .filter(item => item.score > 0 && (activeFilter === 'all' || item.tab === activeFilter))
    .sort((a, b) => b.score - a.score || a._searchOrder - b._searchOrder)
    .slice(0, limit)
    .map(({ _searchOrder, ...item }) => item);

export const rankTitleItems = (items, query) => {
  if (!normalizeSearchText(query)) return items || [];
  return (items || [])
    .map((item, index) => ({ item, index, score: fieldScore(item?.title, normalizeSearchText(query), tokenizeSearchQuery(query), 4) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(entry => entry.item);
};


const MATCH_LABELS = {
  title: 'ชื่อเรื่อง',
  path: 'หมวดหมู่',
  snippet: 'เนื้อหา',
};

export const explainSearchMatch = (item, query) => {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeSearchQuery(query);
  if (!normalizedQuery || tokens.length === 0) return [];

  return [
    ['title', item?.title],
    ['path', (item?.path || []).join(' ')],
    ['snippet', item?.snippet],
  ]
    .map(([field, value]) => ({
      field,
      label: MATCH_LABELS[field],
      score: fieldScore(value, normalizedQuery, tokens, field === 'title' ? 4 : field === 'path' ? 2 : 1),
    }))
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score || ['title', 'path', 'snippet'].indexOf(a.field) - ['title', 'path', 'snippet'].indexOf(b.field));
};

export const getSearchHighlightTerms = query =>
  [...new Set([normalizeSearchText(query), ...tokenizeSearchQuery(query)].filter(term => term.length >= 2))]
    .sort((a, b) => b.length - a.length);
