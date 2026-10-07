const normalizeHeader = value => String(value || '').replace(/[\s\uFEFF\u200B]/g, '').toLowerCase();

const SCHEMAS = {
  manual: {
    required: [
      ['MainCategory', 'หมวดหมู่หลัก'],
      ['TopicTitle', 'ชื่อเรื่อง'],
    ],
  },
  decision: {
    required: [
      ['ประเภทคำขอ', 'RequestType'],
    ],
  },
  archive: {
    required: [
      ['หมวดหมู่หลัก', 'ArchiveCategory'],
    ],
  },
  chatbot: {
    required: [
      ['Keywords', 'คีย์เวิร์ด'],
      ['Answer', 'คำตอบ'],
    ],
  },
};

const hasAlias = (headers, aliases) => {
  const normalized = new Set(headers.map(normalizeHeader));
  return aliases.some(alias => normalized.has(normalizeHeader(alias)));
};

export const validateDataRows = (kind, rows) => {
  const schema = SCHEMAS[kind];
  if (!schema) return { ok: false, code: 'UNKNOWN_SCHEMA', message: `ไม่รู้จักชนิดข้อมูล: ${kind}` };
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, code: 'EMPTY_DATA', message: 'ไม่พบแถวข้อมูลจากแหล่งข้อมูล' };
  }

  const headers = [...new Set(rows.flatMap(row => row && typeof row === 'object' ? Object.keys(row) : []))];
  const missing = schema.required.filter(aliases => !hasAlias(headers, aliases));
  if (missing.length > 0) {
    return {
      ok: false,
      code: 'MISSING_REQUIRED_HEADERS',
      missing: missing.map(aliases => aliases.join(' / ')),
      message: `โครงสร้างข้อมูลไม่ครบ: ไม่พบคอลัมน์ที่จำเป็น ${missing.map(aliases => aliases.join(' / ')).join(', ')}`,
    };
  }

  return { ok: true, code: 'VALID', rowCount: rows.length, headers };
};

export const assertValidDataRows = (kind, rows) => {
  const result = validateDataRows(kind, rows);
  if (!result.ok) {
    const error = new Error(result.message);
    error.code = result.code;
    error.validation = result;
    throw error;
  }
  return rows;
};

const getValue = (row, aliases) => {
  if (!row || typeof row !== 'object') return '';
  for (const alias of aliases) {
    const key = Object.keys(row).find(candidate => normalizeHeader(candidate) === normalizeHeader(alias));
    if (key !== undefined) return String(row[key] ?? '').trim();
  }
  return '';
};

const ROW_RULES = {
  manual: [
    { code: 'MISSING_MAIN_CATEGORY', aliases: ['MainCategory', 'หมวดหมู่หลัก'] },
  ],
  decision: [
    { code: 'MISSING_REQUEST_TYPE', aliases: ['ประเภทคำขอ', 'RequestType'] },
  ],
  archive: [
    { code: 'MISSING_ARCHIVE_CATEGORY', aliases: ['หมวดหมู่หลัก', 'ArchiveCategory'] },
  ],
  chatbot: [
    { code: 'MISSING_KEYWORDS', aliases: ['Keywords', 'คีย์เวิร์ด'] },
    { code: 'MISSING_ANSWER', aliases: ['Answer', 'คำตอบ'] },
  ],
};

export const inspectDataQuality = (kind, rows) => {
  const schemaResult = validateDataRows(kind, rows);
  if (!schemaResult.ok) return { ...schemaResult, validRows: [], rejectedCount: Array.isArray(rows) ? rows.length : 0, issues: [{ code: schemaResult.code, count: Array.isArray(rows) ? rows.length : 0 }] };

  const rules = ROW_RULES[kind] || [];
  const issues = new Map();
  const validRows = [];

  for (const row of rows) {
    const failed = rules.filter(rule => !getValue(row, rule.aliases));
    if (failed.length === 0) {
      validRows.push(row);
      continue;
    }
    for (const rule of failed) issues.set(rule.code, (issues.get(rule.code) || 0) + 1);
  }

  return {
    ok: true,
    code: 'VALID_WITH_ROW_QUALITY',
    rowCount: rows.length,
    validCount: validRows.length,
    rejectedCount: rows.length - validRows.length,
    validRows,
    issues: [...issues.entries()].map(([code, count]) => ({ code, count })),
  };
};

export const sanitizeDataQualityReport = (sourceKey, report) => ({
  source: String(sourceKey || 'unknown'),
  rowCount: Number(report?.rowCount || 0),
  validCount: Number(report?.validCount || 0),
  rejectedCount: Number(report?.rejectedCount || 0),
  issues: Array.isArray(report?.issues) ? report.issues.map(issue => ({ code: String(issue.code || 'UNKNOWN'), count: Number(issue.count || 0) })) : [],
});
