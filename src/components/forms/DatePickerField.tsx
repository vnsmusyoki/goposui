import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type DatePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  error?: boolean;
  usePortal?: boolean;
  disabled?: boolean;
};

export default function DatePickerField({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  className = '',
  error = false,
  usePortal = false,
  disabled = false,
}: DatePickerFieldProps) {
  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;
  const [isOpen, setIsOpen] = useState(false);
  const popperContainer = usePortal
    ? ({ children }: { children?: ReactNode }) => {
        if (typeof document === 'undefined') {
          return <>{children}</>;
        }
        return createPortal(children, document.body);
      }
    : undefined;

  return (
    <div className={`relative ${className}`}>
      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <DatePicker
        selected={selectedDate}
        open={isOpen}
        onCalendarOpen={() => setIsOpen(true)}
        onCalendarClose={() => setIsOpen(false)}
        onChange={(date: Date | null) => {
          onChange(date ? formatLocalDate(date) : '');
          setIsOpen(false);
        }}
        disabled={disabled}
        dateFormat="yyyy-MM-dd"
        placeholderText={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        popperPlacement="bottom-start"
        popperClassName="z-[9999]"
        popperContainer={popperContainer}
        showPopperArrow={false}
        shouldCloseOnSelect
        className={`w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        } ${error ? 'border-destructive' : 'border-border'}`}
      />
    </div>
  );
}
