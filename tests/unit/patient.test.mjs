import test from 'node:test';
import assert from 'node:assert/strict';
import { birthDateError, phoneError, minimumBirthDate, patientServiceError } from '../../src/utils/patient.js';
import { age } from '../../src/api/mappers.js';
import { today } from '../../src/utils/format.js';

test('impossible and very old birthdays are rejected', () => {
  for (const value of ['0300-01-01', '2025-02-30', '2000-13-01', 'not-a-date']) assert.ok(birthDateError(value));
});
test('future birthdays are rejected', () => assert.ok(birthDateError('2999-01-01')));
test('missing required birthday is rejected', () => { assert.ok(birthDateError('', true)); assert.equal(birthDateError(''), ''); });
test('newborn and leap-day birthdays are accepted', () => { assert.equal(birthDateError(today()), ''); assert.equal(birthDateError('2000-02-29'), ''); assert.equal(age(today()), 0); });
test('invalid birthdays are not shown as impossible ages', () => { assert.equal(age('0300-01-01'), '—'); assert.equal(age('2999-01-01'), '—'); assert.equal(age('2025-02-30'), '—'); });
test('minimum birthday follows the current year', () => assert.equal(minimumBirthDate(), `${new Date().getFullYear() - 130}-01-01`));
test('phone validation supports international formatting and rejects malformed values', () => {
  for (const value of ['09123456789', '+63 912 345 6789', '(02) 8123-4567']) assert.equal(phoneError(value, true), '');
  for (const value of ['abc', '123', '+63abc9123456789', '1234567890123456']) assert.ok(phoneError(value));
  assert.ok(phoneError('', true)); assert.equal(phoneError(''), '');
});
test('service errors hide configuration details but preserve actionable validation', () => {
  assert.doesNotMatch(patientServiceError({status:503,message:'Check DATABASE_URL and pooler settings'}), /DATABASE_URL|pooler/);
  assert.equal(patientServiceError({status:422,message:'Choose an available slot'}), 'Choose an available slot');
});
