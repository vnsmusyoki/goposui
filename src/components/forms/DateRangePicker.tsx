import type { ReactNode } from 'react';
import DatePickerField from '@/components/forms/DatePickerField';

export type DateRangeValue = {
  from: Date | null;
  to: Date | null;
};

type DateRangePickerProps = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
  fromLabel?: ReactNode;
  toLabel?: ReactNode;
};

export function DateRangePicker({
  value,
  onChange,
  className = '',
  fromLabel = 'From',
  toLabel = 'To',
}: DateRangePickerProps) {
  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${className}`}>
      <label className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">{fromLabel}</span>
        <DatePickerField
          value={value.from ? value.from.toISOString().slice(0, 10) : ''}
          onChange={(next) => onChange({ ...value, from: next ? new Date(`${next}T00:00:00`) : null })}
          placeholder="Start date"
        />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">{toLabel}</span>
        <DatePickerField
          value={value.to ? value.to.toISOString().slice(0, 10) : ''}
          onChange={(next) => onChange({ ...value, to: next ? new Date(`${next}T23:59:59`) : null })}
          placeholder="End date"
        />
      </label>
    </div>
  );
}
