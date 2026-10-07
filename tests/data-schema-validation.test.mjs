import assert from 'node:assert/strict';
import { validateDataRows, assertValidDataRows } from '../src/data-validation.js';

const valid = [
  ['manual', [{ 'หมวดหมู่หลัก': 'จดทะเบียน', 'ชื่อเรื่อง': 'ขาย' }]],
  ['manual', [{ MainCategory: 'จดทะเบียน', TopicTitle: 'ขาย' }]],
  ['decision', [{ '\uFEFF ประเภทคำขอ ': 'ขาย' }]],
  ['decision', [{ RequestType: 'ขาย' }]],
  ['archive', [{ 'หมวดหมู่หลัก': 'กฎหมาย' }]],
  ['archive', [{ ArchiveCategory: 'กฎหมาย' }]],
  ['chatbot', [{ 'คีย์เวิร์ด': 'ต่างด้าว', 'คำตอบ': '...' }]],
  ['chatbot', [{ Keywords: 'ต่างด้าว', Answer: '...' }]],
];
for (const [kind, rows] of valid) {
  const result = validateDataRows(kind, rows);
  assert.equal(result.ok, true, `${kind} bilingual schema should be accepted`);
  assert.equal(assertValidDataRows(kind, rows), rows);
}

assert.equal(validateDataRows('manual', []).code, 'EMPTY_DATA');
assert.equal(validateDataRows('unknown', [{ x: 1 }]).code, 'UNKNOWN_SCHEMA');

const missingManual = validateDataRows('manual', [{ MainCategory: 'จดทะเบียน' }]);
assert.equal(missingManual.ok, false);
assert.equal(missingManual.code, 'MISSING_REQUIRED_HEADERS');
assert.deepEqual(missingManual.missing, ['TopicTitle / ชื่อเรื่อง']);

const missingChatbot = validateDataRows('chatbot', [{ Keywords: 'ต่างด้าว' }]);
assert.equal(missingChatbot.code, 'MISSING_REQUIRED_HEADERS');
assert.throws(
  () => assertValidDataRows('chatbot', [{ Keywords: 'ต่างด้าว' }]),
  error => error.code === 'MISSING_REQUIRED_HEADERS' && error.validation?.ok === false
);

// Validation must inspect the union of row keys so sparse CSV rows do not create false negatives.
assert.equal(validateDataRows('manual', [
  { MainCategory: 'จดทะเบียน' },
  { TopicTitle: 'ขาย' },
]).ok, true);

console.log('Source data schema validation guard: PASS');
console.log('Verified bilingual required headers, empty/malformed rejection, sparse-row tolerance, and fail-safe errors.');
