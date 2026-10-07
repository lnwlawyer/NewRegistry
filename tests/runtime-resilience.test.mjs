import assert from 'node:assert/strict';
import { createSourceStates, classifySourceError, sourceErrorMessage, updateSourceState, hasSourceErrors } from '../src/runtime-resilience.js';

const labels = { manual: 'คู่มืองานทะเบียน', decision: 'ระบบช่วยตัดสินใจ', archive: 'คลังเอกสาร', chatbot: 'Chatbot: คนต่างด้าว' };
const initial = createSourceStates(labels);
assert.deepEqual(initial.map(x => x.status), ['loading', 'pending', 'pending', 'pending']);
assert.equal(initial[0].label, 'คู่มืองานทะเบียน');

let states = updateSourceState(initial, 'manual', 'done');
states = updateSourceState(states, 'decision', 'error', 'TIMEOUT');
assert.equal(states.find(x => x.key === 'manual').status, 'done', 'successful source must remain intact');
assert.deepEqual(states.find(x => x.key === 'decision'), { key: 'decision', label: 'ระบบช่วยตัดสินใจ', status: 'error', errorCode: 'TIMEOUT' });
assert.equal(hasSourceErrors(states), true);

states = updateSourceState(states, 'decision', 'loading');
assert.equal(states.find(x => x.key === 'manual').status, 'done', 'retry must not reset other sources');
assert.equal(states.find(x => x.key === 'decision').status, 'loading');
assert.equal(hasSourceErrors(states), false);

assert.equal(classifySourceError(Object.assign(new Error('timeout'), { name: 'TimeoutError', code: 'TIMEOUT' })), 'TIMEOUT');
assert.equal(classifySourceError(Object.assign(new Error('schema'), { code: 'MISSING_REQUIRED_HEADERS' })), 'INVALID_DATA');
assert.equal(classifySourceError(new Error('HTTP 503')), 'HTTP_ERROR');
assert.equal(classifySourceError(new TypeError('Failed to fetch')), 'NETWORK_ERROR');
assert.equal(classifySourceError(Object.assign(new Error('aborted'), { name: 'AbortError' })), 'ABORTED');

assert.equal(sourceErrorMessage('TIMEOUT'), 'เชื่อมต่อแหล่งข้อมูลนานเกินไป');
assert.equal(sourceErrorMessage('INVALID_DATA'), 'รูปแบบข้อมูลไม่ถูกต้อง');
assert.equal(sourceErrorMessage('HTTP_ERROR'), 'แหล่งข้อมูลตอบกลับผิดพลาด');
assert.equal(sourceErrorMessage('NETWORK_ERROR'), 'ไม่สามารถเชื่อมต่อแหล่งข้อมูลได้');

console.log('Runtime resilience and error recovery guard: PASS');
console.log('Verified independent source state, targeted retry preservation, error classification, and Thai recovery messages.');
