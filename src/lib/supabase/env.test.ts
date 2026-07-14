import { describe, expect, it } from 'vitest';
import { requireEnv } from './env';

describe('requireEnv', () => {
  it('returns the value when set', () => {
    expect(requireEnv('SOME_VAR', 'some-value')).toBe('some-value');
  });

  it('throws naming the variable when missing', () => {
    expect(() => requireEnv('SOME_VAR', undefined)).toThrow('SOME_VAR');
  });

  it('throws when set but empty', () => {
    expect(() => requireEnv('SOME_VAR', '')).toThrow('SOME_VAR');
  });
});
