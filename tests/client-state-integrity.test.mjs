import assert from 'node:assert/strict';
import {
  loadSafeJsonState,
  saveSafeJsonState,
  sanitizeBookmarkList,
  sanitizeVisitedList,
  sanitizeSearchHistory,
} from '../src/client-state.js';

const valid = { id: 'manual-1', title: 'การจดทะเบียนขาย', tab: 'manual', path: ['คู่มือ', 'ขาย'], ids: { mainId: 'm1' } };
assert.deepEqual(sanitizeBookmarkList({ broken: true }), []);
assert.deepEqual(sanitizeBookmarkList([null, 'bad', {}, valid]), [valid]);
assert.equal(sanitizeBookmarkList([...Array(120)].map((_, i) => ({ ...valid, id: 'id-'+i }))).length, 100);
assert.deepEqual(sanitizeVisitedList({ bad: true }), []);
assert.deepEqual(sanitizeVisitedList([' a ', 'a', '', null, 'b']), ['a', 'b']);
assert.equal(sanitizeVisitedList([...Array(520)].map((_, i) => 'url-'+i)).length, 500);
assert.equal(sanitizeSearchHistory([...Array(20)].map((_, i) => ({ ...valid, id: 'h-'+i }))).length, 8);

const memory = new Map([['broken', '{not-json'], ['wrong-shape', '{"x":1}']]);
const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
assert.deepEqual(loadSafeJsonState(storage, 'broken', sanitizeBookmarkList), []);
assert.deepEqual(loadSafeJsonState(storage, 'wrong-shape', sanitizeBookmarkList), []);
const saved = saveSafeJsonState(storage, 'bookmarks', [valid, valid], sanitizeBookmarkList);
assert.equal(saved.length, 1);
assert.equal(JSON.parse(memory.get('bookmarks')).length, 1);

const unavailable = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
assert.deepEqual(loadSafeJsonState(unavailable, 'x', sanitizeBookmarkList), []);
assert.deepEqual(saveSafeJsonState(unavailable, 'x', [valid], sanitizeBookmarkList), [valid]);

console.log('Client state integrity and recovery guard: PASS');
console.log('Verified malformed JSON, wrong shapes, duplicate/oversized state, and unavailable storage fail safely.');
