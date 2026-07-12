import { getPhoneDigitsRemaining, normalizePhoneNumber, PHONE_NUMBER_MAX_DIGITS } from '@/lib/phone';

function RequiredMark() {
  return <span className="ml-1 inline-block align-middle text-sm font-bold leading-none text-red-600">*</span>;
}

type PhoneNumberInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  maxDigits?: number;
  className?: string;
};

export default function PhoneNumberInput({
  label,
  value,
  onChange,
  required = false,
  error,
  placeholder = '0712 345 678',
  helperText,
  disabled = false,
  maxDigits = PHONE_NUMBER_MAX_DIGITS,
  className = '',
}: PhoneNumberInputProps) {
  const remainingDigits = getPhoneDigitsRemaining(value, maxDigits);

  return (
    <label className={`block ${className}`.trim()}>
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && <RequiredMark />}
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="tel"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(normalizePhoneNumber(event.target.value, maxDigits))}
        className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${
          error ? 'border-red-500' : 'border-border'
        }`}
      />
      <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{helperText ?? 'Starts with 0 and must contain 10 digits.'}</span>
        <span>{remainingDigits} digits remaining</span>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}
