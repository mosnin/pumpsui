import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      helperText,
      error,
      leftAdornment,
      rightAdornment,
      wrapperClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label className="text-sm font-medium text-[#94A3B8] tracking-wide">
            {label}
          </label>
        )}

        <div className="relative">
          {leftAdornment && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] flex items-center">
              {leftAdornment}
            </div>
          )}

          <input
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              // Base layout
              'w-full rounded-xl',
              'h-11 px-4 py-2.5',
              'text-sm text-[#E2E8F0]',
              'placeholder:text-[#64748B]',

              // Background
              'bg-[#0D0D1F]',
              'border border-[#2A2A5A]',

              // Transition
              'transition-all duration-200',

              // Focus state
              'focus:outline-none',
              'focus:border-[#6366F1]',
              'focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15),0_0_20px_rgba(99,102,241,0.1)]',

              // Hover
              'hover:border-[#3A3A7A]',

              // Error state
              error && [
                'border-rose-500/60',
                'focus:border-rose-500',
                'focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]',
              ],

              // Disabled
              'disabled:opacity-40 disabled:cursor-not-allowed',

              // Adornment padding
              leftAdornment && 'pl-10',
              rightAdornment && 'pr-10',

              className
            )}
            {...props}
          />

          {rightAdornment && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] flex items-center">
              {rightAdornment}
            </div>
          )}
        </div>

        {(helperText || error) && (
          <p
            className={cn(
              'text-xs leading-relaxed',
              error ? 'text-rose-400' : 'text-[#64748B]'
            )}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Numeric input variant optimized for token amounts
export interface AmountInputProps extends Omit<InputProps, 'type'> {
  symbol?: string;
  usdValue?: string;
  onMax?: () => void;
}

const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ symbol, usdValue, onMax, className, wrapperClassName, ...props }, ref) => {
    return (
      <div
        className={cn(
          'rounded-2xl bg-[#161630] border border-[#2A2A5A] p-4',
          'focus-within:border-[#6366F1] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]',
          'transition-all duration-200',
          wrapperClassName
        )}
      >
        <div className="flex items-center gap-3">
          <input
            ref={ref}
            type="number"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            placeholder="0.00"
            className={cn(
              'flex-1 bg-transparent text-2xl font-bold text-[#E2E8F0]',
              'placeholder:text-[#2A2A5A]',
              'outline-none border-none',
              '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              className
            )}
            {...props}
          />

          <div className="flex items-center gap-2 shrink-0">
            {onMax && (
              <button
                type="button"
                onClick={onMax}
                className="text-xs font-semibold text-[#6366F1] hover:text-[#818CF8] transition-colors px-2 py-1 rounded-md hover:bg-[#6366F1]/10"
              >
                MAX
              </button>
            )}
            {symbol && (
              <div className="flex items-center gap-1.5 bg-[#0D0D1F] border border-[#2A2A5A] rounded-xl px-3 py-2">
                <span className="text-sm font-semibold text-[#E2E8F0]">{symbol}</span>
              </div>
            )}
          </div>
        </div>

        {usdValue && (
          <p className="text-xs text-[#64748B] mt-1.5">≈ {usdValue}</p>
        )}
      </div>
    );
  }
);

AmountInput.displayName = 'AmountInput';

export { Input, AmountInput };
