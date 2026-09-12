import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizePhoneNumber, getUserRoleHierarchy, isRoleAllowed } from '../src/utils/phone';

test('normalizes Ethiopian numbers', () => {
  assert.equal(normalizePhoneNumber('0912345678'), '+251912345678');
  assert.equal(normalizePhoneNumber('+251912345678'), '+251912345678');
});

test('role permissions block unsafe roles', () => {
  assert.equal(isRoleAllowed('PASSENGER', 'PASSENGER'), true);
  assert.equal(isRoleAllowed('PASSENGER', 'ADMIN'), false);
  assert.equal(isRoleAllowed('ADMIN', 'ADMIN'), true);
  assert.equal(isRoleAllowed('SUPPORT', 'ADMIN'), false);
});

test('role hierarchy includes admin equivalent', () => {
  assert.ok(getUserRoleHierarchy('ADMIN').includes('ADMIN'));
  assert.ok(getUserRoleHierarchy('SUPPORT').includes('SUPPORT'));
});
