import assert from 'node:assert/strict';
import { inspectDataQuality, sanitizeDataQualityReport } from '../src/data-validation.js';

const manual = [
  { MainCategory: 'ทะเบียน', TopicTitle: 'ขาย', Meaning: 'ข้อมูลลับในแถวดี' },
  { MainCategory: 'ทะเบียน', TopicTitle: '', Meaning: 'ข้อความที่ต้องไม่ออก diagnostic' },
  { MainCategory: '', TopicTitle: 'จำนอง' },
];
const report = inspectDataQuality('manual', manual);
assert.equal(report.ok, true);
assert.equal(report.rowCount, 3);
assert.equal(report.validCount, 1);
assert.equal(report.rejectedCount, 2);
assert.equal(report.validRows.length, 1);
assert.deepEqual(report.issues, [
  { code: 'MISSING_TOPIC_TITLE', count: 1 },
  { code: 'MISSING_MAIN_CATEGORY', count: 1 },
]);

const safe = sanitizeDataQualityReport('manual', report);
assert.deepEqual(safe, {
  source: 'manual', rowCount: 3, validCount: 1, rejectedCount: 2,
  issues: [
    { code: 'MISSING_TOPIC_TITLE', count: 1 },
    { code: 'MISSING_MAIN_CATEGORY', count: 1 },
  ],
});
const serialized = JSON.stringify(safe);
assert.ok(!serialized.includes('ข้อมูลลับ'));
assert.ok(!serialized.includes('ข้อความที่ต้องไม่ออก diagnostic'));
assert.ok(!('validRows' in safe), 'diagnostic must not expose source row content');

const chatbot = inspectDataQuality('chatbot', [
  { Keywords: 'ต่างด้าว', Answer: 'คำตอบ' },
  { Keywords: '', Answer: 'คำตอบที่ไม่มี keyword' },
  { Keywords: 'ที่ดิน', Answer: '' },
]);
assert.equal(chatbot.validCount, 1);
assert.equal(chatbot.rejectedCount, 2);
assert.deepEqual(chatbot.issues, [
  { code: 'MISSING_KEYWORDS', count: 1 },
  { code: 'MISSING_ANSWER', count: 1 },
]);

const decision = inspectDataQuality('decision', [{ RequestType: 'ขาย' }, { RequestType: '' }]);
assert.equal(decision.validCount, 1);
assert.equal(decision.rejectedCount, 1);

const archive = inspectDataQuality('archive', [{ ArchiveCategory: 'กฎหมาย' }, { ArchiveCategory: '' }]);
assert.equal(archive.validCount, 1);
assert.equal(archive.rejectedCount, 1);

const brokenSchema = inspectDataQuality('manual', [{ Other: 'x' }]);
assert.equal(brokenSchema.ok, false);
assert.equal(brokenSchema.code, 'MISSING_REQUIRED_HEADERS');
assert.equal(brokenSchema.validRows.length, 0);

console.log('Production data quality and observability guard: PASS');
console.log('Verified fail-soft row filtering and aggregate-only diagnostics without source-row content.');
