import { describe, expect, it } from 'vitest';
import { firstErrorField, hasFieldErrors, parseIntegerInput } from './validation';

describe('form validation helpers', () => {
  it('parses trimmed whole-number input', () => {
    expect(parseIntegerInput(' 12 ', { label: 'Score', min: 0 })).toEqual({ ok: true, value: 12 });
  });

  it('rejects blank required values', () => {
    expect(parseIntegerInput('', { label: 'Score', min: 0 })).toEqual({
      ok: false,
      errors: { value: 'Score is required.' }
    });
  });

  it('rejects decimals and non-numeric values', () => {
    expect(parseIntegerInput('1.5', { label: 'Score', min: 0 })).toEqual({
      ok: false,
      errors: { value: 'Score must be a whole number.' }
    });
    expect(parseIntegerInput('two', { label: 'Score', min: 0 })).toEqual({
      ok: false,
      errors: { value: 'Score must be a whole number.' }
    });
  });

  it('enforces minimum and maximum bounds', () => {
    expect(parseIntegerInput('-1', { label: 'Score', min: 0 })).toEqual({
      ok: false,
      errors: { value: 'Score must be at least 0.' }
    });
    expect(parseIntegerInput('101', { label: 'Score', max: 100 })).toEqual({
      ok: false,
      errors: { value: 'Score must be 100 or less.' }
    });
  });

  it('reports whether a field-error map contains messages', () => {
    expect(hasFieldErrors({ score: undefined })).toBe(false);
    expect(hasFieldErrors({ score: 'Score is required.' })).toBe(true);
    expect(firstErrorField({ score: undefined, mvp: 'Select MVP.' })).toBe('mvp');
  });
});
