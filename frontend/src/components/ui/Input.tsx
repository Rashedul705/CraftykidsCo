import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  required,
  error,
  helperText,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-semibold text-[#2B2B2B] flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-[#D6403B] ml-1">*</span>}
          </span>
        </label>
      )}

      {children}

      {error ? (
        <p className="text-xs text-[#9B2420] flex items-center gap-1 mt-0.5" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#6B6B6B] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, required, error, helperText, className, ...props }, ref) => {
    const inputElement = (
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full bg-white text-[#2B2B2B] placeholder:text-[#6B6B6B]/60 text-sm sm:text-base px-3.5 py-2.5 rounded-[12px] border transition-colors outline-none min-h-[44px]',
          error
            ? 'border-[#D6403B] focus:border-[#D6403B] focus:ring-1 focus:ring-[#D6403B]'
            : 'border-[#EFE9E0] focus:border-[#D6403B] focus:ring-1 focus:ring-[#D6403B]',
          'disabled:bg-[#FAF7F2] disabled:cursor-not-allowed disabled:text-[#6B6B6B]',
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
    );

    if (label || error || helperText) {
      return (
        <FormField id={id} label={label} required={required} error={error} helperText={helperText}>
          {inputElement}
        </FormField>
      );
    }

    return inputElement;
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, required, error, helperText, className, rows = 3, ...props }, ref) => {
    const textareaElement = (
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={cn(
          'w-full bg-white text-[#2B2B2B] placeholder:text-[#6B6B6B]/60 text-sm sm:text-base px-3.5 py-2.5 rounded-[12px] border transition-colors outline-none resize-y',
          error
            ? 'border-[#D6403B] focus:border-[#D6403B] focus:ring-1 focus:ring-[#D6403B]'
            : 'border-[#EFE9E0] focus:border-[#D6403B] focus:ring-1 focus:ring-[#D6403B]',
          'disabled:bg-[#FAF7F2] disabled:cursor-not-allowed disabled:text-[#6B6B6B]',
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
    );

    if (label || error || helperText) {
      return (
        <FormField id={id} label={label} required={required} error={error} helperText={helperText}>
          {textareaElement}
        </FormField>
      );
    }

    return textareaElement;
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ id, label, required, error, helperText, className, children, ...props }, ref) => {
    const selectElement = (
      <select
        ref={ref}
        id={id}
        className={cn(
          'w-full bg-white text-[#2B2B2B] text-sm sm:text-base px-3.5 py-2.5 rounded-[12px] border transition-colors outline-none min-h-[44px] cursor-pointer',
          error
            ? 'border-[#D6403B] focus:border-[#D6403B] focus:ring-1 focus:ring-[#D6403B]'
            : 'border-[#EFE9E0] focus:border-[#D6403B] focus:ring-1 focus:ring-[#D6403B]',
          'disabled:bg-[#FAF7F2] disabled:cursor-not-allowed disabled:text-[#6B6B6B]',
          className
        )}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
    );

    if (label || error || helperText) {
      return (
        <FormField id={id} label={label} required={required} error={error} helperText={helperText}>
          {selectElement}
        </FormField>
      );
    }

    return selectElement;
  }
);

Select.displayName = 'Select';
