import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { FieldErrors } from '../forms/validation';

interface FieldErrorProps {
  id: string;
  message?: string;
}

export const FieldError = ({ id, message }: FieldErrorProps) => {
  if (!message) return null;

  return (
    <p id={id} className="mt-1 text-[11px] font-semibold text-rose-700">
      {message}
    </p>
  );
};

interface FormErrorSummaryProps<Field extends string> {
  id: string;
  errors: FieldErrors<Field>;
  title?: string;
}

export const FormErrorSummary = <Field extends string>({
  id,
  errors,
  title = 'Review the highlighted fields'
}: FormErrorSummaryProps<Field>) => {
  const messages = Object.values(errors).filter(Boolean) as string[];
  if (messages.length < 2) return null;

  return (
    <div
      id={id}
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
    >
      <div className="flex items-center gap-1.5 font-black">
        <AlertTriangle size={13} />
        {title}
      </div>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 font-semibold">
        {messages.map(message => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
};
