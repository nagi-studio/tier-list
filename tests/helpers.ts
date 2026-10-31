import assert from 'node:assert/strict';

/** Assert fixture entries exist instead of bypassing noUncheckedIndexedAccess. */
export function must<T>(value: T | null | undefined): T {
  assert.ok(value != null, 'Expected fixture value to exist');
  return value;
}
