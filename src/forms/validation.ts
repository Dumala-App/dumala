export type FieldErrors<Field extends string = string> = Partial<Record<Field, string>>;

export type ValidationResult<Value, Field extends string = string> =
  | { ok: true; value: Value }
  | { ok: false; errors: FieldErrors<Field> };

export const hasFieldErrors = <Field extends string>(errors: FieldErrors<Field>): boolean =>
  Object.values(errors).some(Boolean);

export const firstErrorField = <Field extends string>(errors: FieldErrors<Field>): Field | null => {
  const entry = Object.entries(errors).find(([, message]) => Boolean(message));
  return entry ? entry[0] as Field : null;
};

export const mergeFieldErrors = <Field extends string>(
  ...groups: Array<FieldErrors<Field>>
): FieldErrors<Field> => Object.assign({}, ...groups);

export interface IntegerParseOptions {
  label: string;
  min?: number;
  max?: number;
  required?: boolean;
}

export const parseIntegerInput = (
  rawValue: string,
  options: IntegerParseOptions
): ValidationResult<number> => {
  const value = rawValue.trim();
  if (!value) {
    return options.required === false
      ? { ok: true, value: 0 }
      : { ok: false, errors: { value: `${options.label} is required.` } };
  }

  if (!/^-?\d+$/.test(value)) {
    return { ok: false, errors: { value: `${options.label} must be a whole number.` } };
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    return { ok: false, errors: { value: `${options.label} is too large.` } };
  }

  if (options.min !== undefined && parsed < options.min) {
    return { ok: false, errors: { value: `${options.label} must be at least ${options.min}.` } };
  }

  if (options.max !== undefined && parsed > options.max) {
    return { ok: false, errors: { value: `${options.label} must be ${options.max} or less.` } };
  }

  return { ok: true, value: parsed };
};

export const focusFirstInvalidField = <Field extends string>(
  container: HTMLElement | null,
  errors: FieldErrors<Field>
) => {
  const field = firstErrorField(errors);
  if (!container || !field) return;

  const target = container.querySelector<HTMLElement>(`[data-validation-field="${field}"]`);
  target?.focus();
};
