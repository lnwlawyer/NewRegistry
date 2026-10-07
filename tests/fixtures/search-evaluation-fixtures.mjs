export const SEARCH_EVALUATION_ITEMS = [
  { id: 'foreign-land', tab: 'manual', title: 'การถือครองที่ดินของคนต่างด้าว', path: ['คู่มืองานทะเบียน', 'คนต่างด้าว'], snippet: 'หลักเกณฑ์การได้มาซึ่งที่ดินและข้อจำกัดตามกฎหมาย' },
  { id: 'foreign-company', tab: 'manual', title: 'นิติบุคคลที่มีผู้ถือหุ้นต่างด้าว', path: ['คู่มืองานทะเบียน', 'นิติบุคคล'], snippet: 'การตรวจสอบสัดส่วนผู้ถือหุ้นและพฤติการณ์ถือแทน' },
  { id: 'inheritance', tab: 'manual', title: 'การจดทะเบียนโอนมรดกที่ดิน', path: ['คู่มืองานทะเบียน', 'มรดก'], snippet: 'ขั้นตอนกรณีมีหรือไม่มีผู้จัดการมรดก' },
  { id: 'sale', tab: 'manual', title: 'การจดทะเบียนขายที่ดิน', path: ['คู่มืองานทะเบียน', 'ซื้อขาย'], snippet: 'เอกสารและขั้นตอนการจดทะเบียนขาย' },
  { id: 'mortgage', tab: 'manual', title: 'การจดทะเบียนจำนอง', path: ['คู่มืองานทะเบียน', 'จำนอง'], snippet: 'หลักเกณฑ์การจำนองอสังหาริมทรัพย์' },
  { id: 'foreign-decision', tab: 'decision', title: 'ตรวจสอบสิทธิของนิติบุคคลต่างด้าว', path: ['ระบบช่วยตัดสินใจ', 'คนต่างด้าว'], snippet: 'แนวทางวินิจฉัยก่อนจดทะเบียน' },
  { id: 'inheritance-archive', tab: 'archive', title: 'หนังสือเวียนเรื่องมรดก', path: ['คลังเอกสาร', 'มรดก'], snippet: 'แนวทางปฏิบัติเรื่องการรับมรดกที่ดิน' },
  { id: 'foreign-chatbot', tab: 'chatbot', title: 'คนต่างด้าว, ที่ดิน, ถือครอง', path: ['Chatbot', 'คนต่างด้าว'], snippet: 'คำตอบเกี่ยวกับการถือครองที่ดินของคนต่างด้าว' },
];

export const SEARCH_EVALUATION_CASES = [
  { name: 'natural foreign land question', query: 'คนต่างด้าวถือครองที่ดินได้อย่างไร', expectedTop1: 'foreign-land', expectedTopN: ['foreign-land','foreign-chatbot'], topN: 4 },
  { name: 'foreign company', query: 'นิติบุคคล ผู้ถือหุ้นต่างด้าว', expectedTop1: 'foreign-company', expectedTopN: ['foreign-company','foreign-decision'], topN: 4 },
  { name: 'inheritance natural phrase', query: 'ขอค้นหาเรื่องโอนมรดกที่ดินหน่อยครับ', expectedTop1: 'inheritance', expectedTopN: ['inheritance','inheritance-archive'], topN: 4 },
  { name: 'land sale', query: 'จดทะเบียนขายที่ดิน', expectedTop1: 'sale', expectedTopN: ['sale'], topN: 3 },
  { name: 'mortgage', query: 'จำนองอสังหาริมทรัพย์', expectedTop1: 'mortgage', expectedTopN: ['mortgage'], topN: 3 },
  { name: 'module filter', query: 'คนต่างด้าว', filter: 'decision', expectedTop1: 'foreign-decision', expectedTopN: ['foreign-decision'], topN: 3 },
];
