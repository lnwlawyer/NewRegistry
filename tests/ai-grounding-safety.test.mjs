import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');

const forbidden = [
  ['Fallback to model general knowledge', /โปรดตอบตามความรู้พื้นฐานที่คุณมีเกี่ยวกับการที่ดินและกฎหมายไทย/i],
  ['Prompt permits general model knowledge', /หากข้อมูลอ้างอิงไม่เพียงพอ[^\n`]*ตอบตามความรู้พื้นฐาน/i],
];

const required = [
  ['Structured retrieval result', /return\s+buildGroundingContext\(sources\)/],
  ['No-evidence network gate', /if\s*\(foundCount\s*===\s*0\)[\s\S]*?setIsLoading\(false\);[\s\S]*?return;/],
  ['Grounding refusal message', /ไม่พบข้อมูลอ้างอิงเพียงพอในฐานข้อมูลของระบบสำหรับคำถามนี้/],
  ['Context-only instruction', /ตอบโดยใช้เฉพาะข้อมูลอ้างอิง \(Context\) ที่ให้มาเท่านั้น/],
  ['No-general-knowledge instruction', /ห้ามเติมข้อกฎหมาย ข้อเท็จจริง หรือความเห็นจากความรู้ทั่วไปของโมเดล/],
  ['Insufficient-context instruction', /ข้อมูลอ้างอิงที่พบยังไม่เพียงพอสำหรับประเด็นนี้/],
  ['Citation validation before display', /validateCitationIds\(aiReply,\s*sourceIds\)/],
  ['Unverified citation suppression', /ไม่สามารถยืนยันแหล่งอ้างอิงของคำตอบ AI ได้/],
];

const failures = [];
for (const [name, pattern] of forbidden) {
  if (pattern.test(source)) failures.push(`Forbidden pattern found: ${name}`);
}
for (const [name, pattern] of required) {
  if (!pattern.test(source)) failures.push(`Required grounding invariant missing: ${name}`);
}

const gateIndex = source.indexOf('if (foundCount === 0)');
const generateIndex = source.indexOf(':generateContent?key=');
if (gateIndex < 0 || generateIndex < 0 || gateIndex > generateIndex) {
  failures.push('Grounding gate must appear before the Gemini generateContent call');
}

if (failures.length) {
  console.error('AI grounding safety regression guard: FAIL');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('AI grounding safety regression guard: PASS');
console.log(`Checked ${forbidden.length} forbidden patterns + ${required.length} required invariants + network ordering`);
