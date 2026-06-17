'use client';

import { InputHTMLAttributes } from 'react';
import { handleCurrencyInput } from '@/lib/formatter';

interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
}

export default function CurrencyInput({
  value,
  onValueChange,
  className = '',
  ...props
}: CurrencyInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={(event) => onValueChange(handleCurrencyInput(event.target.value))}
      className={className}
    />
  );
}
