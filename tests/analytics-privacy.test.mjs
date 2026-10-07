import assert from 'node:assert/strict';
import { analyticsLoad, analyticsSave, recordPageview, recordSearch, recordChatbotMiss } from '../src/analytics.js';

const makeStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
    dump: key => data.get(key),
  };
};

const legacy = {
  pageviews: [{ tab: 'manual', title: 'คู่มือ', path: 'กฎหมาย', ts: 1 }],
  searches: [{ query: 'นายสมชาย โฉนด 12345', resultCount: 4, ts: 2 }],
  chatbotMisses: [{ query: 'เลขบัตร 1234567890123', category: 'คนต่างด้าว', ts: 3 }],
};
const storage = makeStorage({ app_analytics: JSON.stringify(legacy) });
const migrated = analyticsLoad(storage);
assert.equal(migrated.version, 2);
assert.deepEqual(migrated.searches, [{ resultCount: 4, ts: 2 }]);
assert.deepEqual(migrated.chatbotMisses, [{ category: 'คนต่างด้าว', ts: 3 }]);
assert.doesNotMatch(storage.dump('app_analytics'), /สมชาย|12345|1234567890123/, 'legacy user-entered text must be removed during load migration');

let data = migrated;
data = recordSearch(data, 7, 10);
data = recordChatbotMiss(data, 'นิติบุคคล', 11);
data = recordPageview(data, 'archive', 'หนังสือเวียน', ['คลังเอกสาร'], 12);
analyticsSave(storage, data);
const persisted = JSON.parse(storage.dump('app_analytics'));
assert.deepEqual(persisted.searches.at(-1), { resultCount: 7, ts: 10 });
assert.deepEqual(persisted.chatbotMisses.at(-1), { category: 'นิติบุคคล', ts: 11 });
assert.equal(persisted.pageviews.at(-1).title, 'หนังสือเวียน');

let bounded = migrated;
for (let i = 0; i < 230; i++) bounded = recordSearch(bounded, i, i);
for (let i = 0; i < 230; i++) bounded = recordChatbotMiss(bounded, 'หมวด', i);
for (let i = 0; i < 530; i++) bounded = recordPageview(bounded, 'manual', `หน้า ${i}`, [], i);
assert.equal(bounded.searches.length, 200);
assert.equal(bounded.chatbotMisses.length, 200);
assert.equal(bounded.pageviews.length, 500);

console.log('Analytics privacy and integrity regression guard: PASS');
console.log('Verified legacy text migration, no query persistence, bounded records, and normalized analytics schema.');
