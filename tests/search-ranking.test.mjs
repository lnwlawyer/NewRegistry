import assert from 'node:assert/strict';
import { normalizeSearchText, tokenizeSearchQuery, scoreSearchItem, rankSearchItems, rankTitleItems } from '../src/search-ranking.js';

assert.equal(normalizeSearchText('  คนต่างด้าว—ถือครองที่ดิน?  '), 'คนต่างด้าว ถือครองที่ดิน');
const tokens = tokenizeSearchQuery('ช่วยค้นหา เรื่อง คนต่างด้าวถือครองที่ดินได้อย่างไร หน่อยครับ');
assert.ok(tokens.includes('คนต่างด้าว'));
assert.ok(tokens.includes('ที่ดิน'));
assert.ok(!tokens.includes('ช่วยค้นหา'));
assert.ok(!tokens.includes('หน่อยครับ'));

const items = [
  { id:'body', tab:'manual', title:'แนวทางทั่วไป', path:['คู่มือ'], snippet:'ข้อจำกัดการถือครองที่ดินของคนต่างด้าว' },
  { id:'title', tab:'manual', title:'คนต่างด้าวถือครองที่ดิน', path:['คู่มือ'], snippet:'รายละเอียด' },
  { id:'path', tab:'archive', title:'หนังสือเวียน', path:['คนต่างด้าว','ที่ดิน'], snippet:'เอกสาร' },
  { id:'other', tab:'decision', title:'มรดก', path:['มรดก'], snippet:'ทายาท' },
];
const ranked = rankSearchItems(items, 'คนต่างด้าว ถือครองที่ดิน');
assert.equal(ranked[0].id, 'title', 'title match must outrank body/path matches');
assert.ok(ranked.some(x => x.id === 'body'));
assert.ok(ranked.some(x => x.id === 'path'));
assert.ok(!ranked.some(x => x.id === 'other'));

const filtered = rankSearchItems(items, 'คนต่างด้าว', 'archive');
assert.deepEqual(filtered.map(x => x.id), ['path']);

const tie = rankSearchItems([
  { id:'first', tab:'manual', title:'ที่ดิน', path:[], snippet:'' },
  { id:'second', tab:'manual', title:'ที่ดิน', path:[], snippet:'' },
], 'ที่ดิน');
assert.deepEqual(tie.map(x => x.id), ['first','second'], 'ties must preserve source order deterministically');

assert.equal(scoreSearchItem(items[1], 'คืออะไรครับ'), 0, 'stop-word-only query must not create matches');
assert.deepEqual(rankTitleItems([{title:'มรดกที่ดิน'},{title:'ขายที่ดิน'}], 'มรดก').map(x => x.title), ['มรดกที่ดิน']);

console.log('Search quality and relevance ranking guard: PASS');
console.log('Verified Thai normalization/token expansion, weighted ranking, filtering, deterministic ties, and title-list search.');
