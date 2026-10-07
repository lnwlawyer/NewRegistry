import assert from 'node:assert/strict';
import { tokenizeQuery, retrieveGroundedSources, buildGroundingContext, validateCitationIds } from '../src/ai-grounding.js';

const manual = [{
  subCategories: [{
    topics: [
      { title: 'การถือครองที่ดินของคนต่างด้าว', content: { laws: [{ text: 'คนต่างด้าวมีข้อจำกัดในการได้มาซึ่งที่ดินตามกฎหมาย' }], summary: [], meaning: [], qna: [] } },
      { title: 'การจดทะเบียนขาย', content: { summary: [{ text: 'การขายที่ดินต้องตรวจสอบเอกสารและสิทธิของคู่สัญญา' }], meaning: [], laws: [], qna: [] } },
    ],
  }],
}];
const decisions = [{
  requestType: 'คนต่างด้าวขอได้มาซึ่งที่ดิน',
  diagnosis: 'ให้ตรวจสอบคุณสมบัติและข้อจำกัดตามกฎหมาย',
  summary: 'ตรวจสอบสิทธิในการถือครอง',
  reference: 'ประมวลกฎหมายที่ดิน',
}];

const tokens = tokenizeQuery('ช่วยอธิบาย การถือครองที่ดิน ของ คนต่างด้าว หน่อยครับ');
assert.ok(tokens.includes('ถือครองที่ดิน'));
assert.ok(tokens.includes('ที่ดิน'));
assert.ok(tokens.includes('คนต่างด้าว'));
assert.ok(!tokens.includes('ช่วยอธิบาย') && !tokens.includes('หน่อยครับ'));
const sources = retrieveGroundedSources('คนต่างด้าวถือครองที่ดินได้อย่างไร', manual, decisions);
assert.ok(sources.length >= 2, 'natural-language query should retrieve manual and decision evidence');
assert.equal(sources[0].sourceId, 'SRC-01');
assert.ok(sources.every((source, index) => source.sourceId === `SRC-${String(index + 1).padStart(2, '0')}`));
assert.ok(sources.some(source => source.type === 'manual' && source.title.includes('คนต่างด้าว')));
assert.ok(sources.some(source => source.type === 'decision' && source.requestType.includes('คนต่างด้าว')));

const context = buildGroundingContext(sources);
assert.equal(context.foundCount, sources.length);
assert.deepEqual(context.sourceIds, sources.map(source => source.sourceId));
assert.match(context.contextText, /\[SRC-01\]/);
assert.match(context.contextText, /คู่มือ|Decision/);

assert.deepEqual(validateCitationIds('คำตอบตาม [SRC-01] และ [SRC-02]', context.sourceIds), {
  cited: ['SRC-01', 'SRC-02'], invalid: [], hasCitation: true,
});
assert.deepEqual(validateCitationIds('คำตอบไม่มีอ้างอิง', context.sourceIds), {
  cited: [], invalid: [], hasCitation: false,
});
assert.deepEqual(validateCitationIds('อ้าง [SRC-99]', context.sourceIds), {
  cited: ['SRC-99'], invalid: ['SRC-99'], hasCitation: true,
});
assert.deepEqual(retrieveGroundedSources('คืออะไรครับ', manual, decisions), [], 'stop-word-only query must not create false grounding');

console.log('AI retrieval and citation quality guard: PASS');
console.log('Verified Thai natural-language token retrieval, ranked bounded sources, stable source IDs, and citation validation.');
