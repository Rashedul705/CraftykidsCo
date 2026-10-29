import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { sha256Hash, normalizePhoneForMeta } from '../src/lib/meta-capi';
import { generateEventId } from '../src/lib/analytics';

describe('Meta Pixel & Facebook Conversions API (CAPI) Test Suite', () => {
  test('SHA-256 Hashing correctly trims, lowercases and computes hex digest', () => {
    const rawEmail = ' TestUser@CraftyKidsCo.Com ';
    const expected = crypto.createHash('sha256').update('testuser@craftykidsco.com').digest('hex');
    const result = sha256Hash(rawEmail);
    assert.equal(result, expected);
  });

  test('normalizePhoneForMeta converts BD phones to E.164 without plus or spaces', () => {
    assert.equal(normalizePhoneForMeta('01712345678'), '8801712345678');
    assert.equal(normalizePhoneForMeta('+8801812345678'), '8801812345678');
    assert.equal(normalizePhoneForMeta('8801912345678'), '8801912345678');
    assert.equal(normalizePhoneForMeta('013-1234-5678'), '8801312345678');
    assert.equal(normalizePhoneForMeta(''), undefined);
  });

  test('SHA-256 Hashing of normalized phone', () => {
    const phone = '01712345678';
    const normalized = normalizePhoneForMeta(phone);
    const expected = crypto.createHash('sha256').update('8801712345678').digest('hex');
    assert.equal(sha256Hash(normalized), expected);
  });

  test('Event ID generator format validation', () => {
    const id1 = generateEventId('purch');
    const id2 = generateEventId('purch');

    assert.match(id1, /^purch_\d+_[a-z0-9]+$/);
    assert.match(id2, /^purch_\d+_[a-z0-9]+$/);
    assert.notEqual(id1, id2);
  });
});
