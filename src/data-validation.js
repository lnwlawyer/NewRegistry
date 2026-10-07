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
