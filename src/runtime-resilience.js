export const SOURCE_KEYS = ['manual', 'decision', 'archive', 'chatbot'];

export const createSourceStates = labels => SOURCE_KEYS.map((key, index) => ({
  key,
  label: labels?.[key] || key,
  status: index === 0 ? 'loading' : 'pending',
  errorCode: null,
}));

export const classifySourceError = error => {
  if (error?.name === 'AbortError') return 'ABORTED';
  if (error?.name === 'TimeoutError' || error?.code === 'TIMEOUT') return 'TIMEOUT';
  if (error?.code === 'MISSING_REQUIRED_HEADERS' || error?.code === 'EMPTY_DATA') return 'INVALID_DATA';
  if (/^HTTP\s+\d+/i.test(String(error?.message || ''))) return 'HTTP_ERROR';
  return 'NETWORK_ERROR';
};

export const sourceErrorMessage = code => ({
  TIMEOUT: 'เชื่อมต่อแหล่งข้อมูลนานเกินไป',
  INVALID_DATA: 'รูปแบบข้อมูลไม่ถูกต้อง',
  HTTP_ERROR: 'แหล่งข้อมูลตอบกลับผิดพลาด',
  NETWORK_ERROR: 'ไม่สามารถเชื่อมต่อแหล่งข้อมูลได้',
}[code] || 'โหลดข้อมูลไม่สำเร็จ');

export const updateSourceState = (sources, key, status, errorCode = null) =>
  (sources || []).map(source => source.key === key ? { ...source, status, errorCode } : source);

export const hasSourceErrors = sources => (sources || []).some(source => source.status === 'error');
