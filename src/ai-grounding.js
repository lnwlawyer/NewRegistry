const STOP_WORDS = new Set([
  'คือ', 'อะไร', 'อย่างไร', 'ยังไง', 'กรณี', 'เกี่ยวกับ', 'ของ', 'ใน', 'ที่', 'และ', 'หรือ',
  'ให้', 'ได้', 'มี', 'เป็น', 'ต้อง', 'ทำ', 'การ', 'ขอ', 'ช่วย', 'อธิบาย', 'หน่อย', 'ครับ', 'ค่ะ',
  'ช่วยอธิบาย', 'หน่อยครับ', 'หน่อยค่ะ',
]);

export const normalizeThaiSearchText = value => String(value || '')
  .toLowerCase()
  .normalize('NFKC')
  .replace(/[“”"'‘’()[\]{}.,!?;:/\\|<>+=_*#@~\-–—]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const expandToken = token => {
  const cleaned = token.replace(/^การ(?=.{2,})/, '').replace(/(?:ได้อย่างไร|อย่างไร|ยังไง|หรือไม่|ไหม|มั้ย)$/u, '');
  const parts = [cleaned];
  for (const marker of ['ที่ดิน', 'คนต่างด้าว', 'นิติบุคคล']) {
    if (cleaned.includes(marker) && cleaned !== marker) {
      parts.push(marker, ...cleaned.split(marker).filter(Boolean));
    }
  }
  return parts;
};

export const tokenizeQuery = value => {
  const normalized = normalizeThaiSearchText(value);
  if (!normalized) return [];
  return [...new Set(normalized.split(' ').flatMap(expandToken).filter(token => token.length >= 2 && !STOP_WORDS.has(token)))];
};

const scoreText = (query, tokens, value, weight = 1) => {
  const text = normalizeThaiSearchText(value);
  if (!text) return 0;
  let score = query && text.includes(query) ? 12 * weight : 0;
  for (const token of tokens) {
    if (text.includes(token)) score += weight;
  }
  return score;
};

export const retrieveGroundedSources = (query, manualDatabase = [], decisionRules = [], limits = {}) => {
  const normalizedQuery = normalizeThaiSearchText(query);
  const tokens = tokenizeQuery(query);
  if (!normalizedQuery || tokens.length === 0) return [];

  const manualLimit = limits.manual ?? 5;
  const totalLimit = limits.total ?? 7;
  const candidates = [];

  for (const main of manualDatabase || []) {
    for (const sub of main?.subCategories || []) {
      for (const topic of sub?.topics || []) {
        const title = topic?.title || '';
        for (const section of ['meaning', 'summary', 'laws', 'qna']) {
          for (const entry of topic?.content?.[section] || []) {
            const text = entry?.text || '';
            const score = scoreText(normalizedQuery, tokens, title, 4) + scoreText(normalizedQuery, tokens, text, 1);
            if (score > 0) candidates.push({ type: 'manual', title, section, text, score });
          }
        }
      }
    }
  }

  const manual = candidates
    .filter(item => item.type === 'manual')
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'th'))
    .slice(0, manualLimit);

  const decisions = [];
  for (const rule of decisionRules || []) {
    const score = scoreText(normalizedQuery, tokens, rule?.requestType, 4)
      + scoreText(normalizedQuery, tokens, rule?.diagnosis, 2)
      + scoreText(normalizedQuery, tokens, rule?.summary, 1)
      + scoreText(normalizedQuery, tokens, rule?.reference, 1);
    if (score > 0) decisions.push({ type: 'decision', ...rule, score });
  }

  return [...manual, ...decisions.sort((a, b) => b.score - a.score).slice(0, Math.max(0, totalLimit - manual.length))]
    .slice(0, totalLimit)
    .map((item, index) => ({ ...item, sourceId: `SRC-${String(index + 1).padStart(2, '0')}` }));
};

export const buildGroundingContext = sources => {
  if (!sources?.length) return { foundCount: 0, contextText: 'ข้อมูลอ้างอิงจากฐานข้อมูลงานทะเบียน:\n\n', sourceIds: [] };

  const lines = sources.map(source => {
    if (source.type === 'decision') {
      return `[${source.sourceId}] [Decision: ${source.requestType || '-'}] วินิจฉัย: ${source.diagnosis || '-'} | สรุป: ${source.summary || '-'} | กฎหมาย: ${source.reference || '-'}`;
    }
    return `[${source.sourceId}] [คู่มือ: ${source.title || '-'} / ${source.section || '-'}] ${String(source.text || '').slice(0, 500)}`;
  });

  return {
    foundCount: sources.length,
    contextText: `ข้อมูลอ้างอิงจากฐานข้อมูลงานทะเบียน:\n\n${lines.join('\n')}\n`,
    sourceIds: sources.map(source => source.sourceId),
  };
};

export const validateCitationIds = (answer, sourceIds) => {
  const allowed = new Set(sourceIds || []);
  const cited = [...String(answer || '').matchAll(/\[(SRC-\d{2})\]/g)].map(match => match[1]);
  const invalid = cited.filter(id => !allowed.has(id));
  return { cited: [...new Set(cited)], invalid: [...new Set(invalid)], hasCitation: cited.length > 0 };
};
