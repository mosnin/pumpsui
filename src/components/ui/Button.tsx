import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-xl font-semibold text-sm',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-offset-[#060611]',
    'disabled:pointer-events-none disabled:opacity-40',
    'select-none cursor-pointer',
  ].join(' '),
  {
    variants: {
      variant: {
        // Primary gradient — the main CTA
        primary: [
          'bg-gradient-to-r from-[#6366F1] to-[#06B6D4]',
          'text-white shadow-lg',
          'hover:shadow-[0_0_24px_rgba(99,102,241,0.5),0_0_48px_rgba(6,182,212,0.2)]',
          'hover:scale-[1.02] active:scale-[0.98]',
          'focus-visible:ring-[#6366F1]',
          'relative overflow-hidden',
          'before:absolute before:inset-0 before:bg-white/0 before:hover:bg-white/10 before:transition-colors',
        ].join(' '),

        // Secondary — outlined with gradient border
        secondary: [
          'bg-transparent',
          'text-[#E2E8F0]',
          'border border-[#2A2A5A]',
          'hover:border-[#6366F1] hover:bg-[#6366F1]/10',
          'hover:shadow-[0_0_16px_rgba(99,102,241,0.2)]',
          'focus-visible:ring-[#6366F1]',
        ].join(' '),

        // Ghost — subtle background
        ghost: [
          'bg-transparent text-[#94A3B8]',
          'hover:bg-[#161630] hover:text-[#E2E8F0]',
          'focus-visible:ring-[#6366F1]',
        ].join(' '),

        // Danger — red-toned for destructive actions
        danger: [
          'bg-gradient-to-r from-rose-600 to-red-500',
          'text-white',
          'hover:shadow-[0_0_20px_rgba(225,29,72,0.4)]',
          'hover:scale-[1.02] active:scale-[0.98]',
          'focus-visible:ring-rose-500',
        ].join(' '),

        // Outline accent — cyan-tinted
        accent: [
          'bg-transparent',
          'text-[#06B6D4]',
          'border border-[#06B6D4]/40',
          'hover:border-[#06B6D4] hover:bg-[#06B6D4]/10',
          'hover:shadow-[0_0_16px_rgba(6,182,212,0.25)]',
          'focus-visible:ring-[#06B6D4]',
        ].join(' '),

        // Link — no background/border
        link: [
          'bg-transparent text-[#6366F1]',
          'underline-offset-4 hover:underline',
          'hover:text-[#818CF8]',
          'focus-visible:ring-[#6366F1]',
          'rounded-none',
        ].join(' '),
      },
      size: {
        xs: 'h-7 px-3 text-xs rounded-lg',
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-13 px-7 text-base',
        xl: 'h-14 px-8 text-base',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0 rounded-lg',
        'icon-lg': 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
