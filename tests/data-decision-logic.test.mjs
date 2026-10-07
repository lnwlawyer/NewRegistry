import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const startMarker = 'const parseCSV =';
const endMarker = 'const gsHighlight =';
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);
assert.ok(start >= 0 && end > start, 'pure data-processing block must remain discoverable in index.html');

const block = html.slice(start, end);
const names = ['parseCSV', 'transformManualData', 'transformDecisionData', 'evalCondition', 'transformChatbotData', 'transformArchiveData'];
const exportCode = `\nthis.__tested = { ${names.join(', ')} };`;
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(block + exportCode, sandbox);
const { parseCSV, transformManualData, transformDecisionData, evalCondition, transformChatbotData, transformArchiveData } = sandbox.__tested;

const plain = value => JSON.parse(JSON.stringify(value));

// CSV: quoting, escaped quotes, CRLF, embedded newline, empty rows
{
  const csv = 'Name,Note,Value\r\n"Alpha","hello, world",1\r\n"Beta","line 1\nline 2",2\r\n"Quote","He said ""yes""",3\r\n,,\r\n';
  assert.deepEqual(plain(parseCSV(csv)), [
    { Name: 'Alpha', Note: 'hello, world', Value: '1' },
    { Name: 'Beta', Note: 'line 1\nline 2', Value: '2' },
    { Name: 'Quote', Note: 'He said "yes"', Value: '3' },
  ]);
}

// Manual transform: Thai headers, grouping, section splitting and PDF pairing
{
  const rows = [
    {
      'หมวดหมู่หลัก': 'การจดทะเบียน',
      'หมวดหมู่ย่อย': 'ซื้อขาย',
      'ชื่อเรื่อง': 'การขายที่ดิน',
      'ความหมาย': 'ความหมายหนึ่ง --- ความหมายสอง',
      MeaningPDF: 'เอกสาร 1|https://example.test/1.pdf --- เอกสาร 2|https://example.test/2.pdf',
      'กฎหมาย': 'มาตรา 1',
    },
    {
      MainCategory: 'การจดทะเบียน',
      SubCategory: 'ซื้อขาย',
      TopicTitle: 'การขายฝาก',
      Summary: 'ขั้นตอน',
    },
  ];
  const result = plain(transformManualData(rows));
  assert.equal(result.length, 1);
  assert.equal(result[0].subCategories.length, 1);
  assert.equal(result[0].subCategories[0].topics.length, 2);
  assert.equal(result[0].subCategories[0].topics[0].content.meaning.length, 2);
  assert.equal(result[0].subCategories[0].topics[0].content.meaning[1].pdfUrls[0].title, 'เอกสาร 2');
}

// Decision transform: BOM/spacing tolerant headers, conditions, defaults, priority sort, documents
{
  const rows = [
    {
      RequestType: 'คำขอ B', RuleId: 'B', Priority: '20',
      Field1: 'ราคา', Operator1: 'มากกว่า', Value1: '100', Logic1: 'AND',
      Status: 'WARNING', Diagnosis: 'B', Documents: 'บัตรประชาชน\nโฉนด',
    },
    {
      '\uFEFF ประเภทคำขอ ': 'คำขอ A', 'รหัสกฎ': 'A', 'ลำดับความสำคัญ': '5',
      'เงื่อนไข:ชื่อฟิลด์(1)': 'ประเภท', 'เงื่อนไข:ตัวดำเนินการ(1)': 'เท่ากับ',
      'เงื่อนไข:ค่า(1)': 'ขาย', 'หัวข้อวินิจฉัย': 'A',
    },
  ];
  const rules = plain(transformDecisionData(rows));
  assert.deepEqual(rules.map(r => r.ruleId), ['A', 'B']);
  assert.equal(rules[1].status, 'warning');
  assert.deepEqual(rules[1].documents, ['บัตรประชาชน', 'โฉนด']);
  assert.equal(rules[0].conditions[0].logic, 'AND');
}

// Decision operators and boundary behavior
{
  const c = (operator, value, userVal) => evalCondition({ field: 'x', operator, value }, userVal);
  assert.equal(c('เท่ากับ', 'ขาย', 'ขาย'), true);
  assert.equal(c('ไม่เท่ากับ', 'ขาย', 'ให้'), true);
  assert.equal(c('อยู่ในกลุ่ม', 'ขาย, ให้', 'ให้'), true);
  assert.equal(c('ไม่อยู่ในกลุ่ม', 'ขาย, ให้', 'เช่า'), true);
  assert.equal(c('มากกว่า', '10', '11'), true);
  assert.equal(c('มากกว่าหรือเท่ากับ', '10', '10'), true);
  assert.equal(c('น้อยกว่า', '10', '9'), true);
  assert.equal(c('น้อยกว่าหรือเท่ากับ', '10', '10'), true);
  assert.equal(c('ระหว่าง', '10-20', '10'), true);
  assert.equal(c('ระหว่าง', '10-20', '20'), true);
  assert.equal(c('มีคำว่า', 'ที่ดิน', 'จดทะเบียนที่ดิน'), true);
  assert.equal(c('มากกว่า', 'x', '11'), false);
  assert.equal(c('เท่ากับ', '0', '0'), true);
  assert.equal(evalCondition({ field: '', operator: 'เท่ากับ', value: 'x' }, ''), true);
  assert.equal(evalCondition({ field: 'x', operator: 'unknown', value: 'x' }, 'x'), false);
}

// Chatbot transform: bilingual headers, keyword normalization, invalid row filtering
{
  const result = plain(transformChatbotData([
    { Keywords: 'ต่างด้าว, ที่ดิน ', Answer: 'คำตอบ 1' },
    { 'คีย์เวิร์ด': 'มรดก', 'คำตอบ': 'คำตอบ 2' },
    { Keywords: '', Answer: 'ไม่ควรอยู่' },
  ], 'คนต่างด้าว'));
  assert.equal(result.length, 2);
  assert.deepEqual(result[0].keywords, ['ต่างด้าว', 'ที่ดิน']);
  assert.equal(result[1].answer, 'คำตอบ 2');
  assert.equal(result[0].category, 'คนต่างด้าว');
}

// Archive transform: known and dynamic categories, hierarchy and document defaults
{
  const result = plain(transformArchiveData([
    { ArchiveCategory: 'กฎหมาย', ArchiveSub1: 'ประมวลกฎหมาย', ArchiveSub2: 'ที่ดิน', DocumentTitle: 'ประมวลกฎหมายที่ดิน', DocumentURL: 'https://example.test/law' },
    { 'หมวดหมู่หลัก': 'หมวดใหม่', 'เมนูย่อย 1': 'กลุ่ม', 'เมนูย่อย 2': 'เรื่อง', 'ลิงก์เอกสาร': 'https://example.test/new' },
  ]));
  const law = result.find(x => x.title === 'กฎหมาย');
  const dynamic = result.find(x => x.title === 'หมวดใหม่');
  assert.equal(law.subCategories[0].topics[0].documents[0].title, 'ประมวลกฎหมายที่ดิน');
  assert.equal(dynamic.subCategories[0].topics[0].documents[0].title, 'เอกสารไม่มีชื่อ');
}

console.log('Data and decision logic regression suite: PASS');
console.log('Covered CSV parsing, manual/decision/chatbot/archive transforms, and decision operators.');
