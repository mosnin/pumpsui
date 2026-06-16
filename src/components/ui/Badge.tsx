import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: [
          'bg-[#6366F1]/15 text-[#818CF8]',
          'border border-[#6366F1]/25',
        ].join(' '),

        accent: [
          'bg-[#06B6D4]/15 text-[#22D3EE]',
          'border border-[#06B6D4]/25',
        ].join(' '),

        success: [
          'bg-emerald-500/15 text-emerald-400',
          'border border-emerald-500/25',
        ].join(' '),

        warning: [
          'bg-amber-500/15 text-amber-400',
          'border border-amber-500/25',
        ].join(' '),

        danger: [
          'bg-rose-500/15 text-rose-400',
          'border border-rose-500/25',
        ].join(' '),

        muted: [
          'bg-[#161630] text-[#64748B]',
          'border border-[#2A2A5A]',
        ].join(' '),

        gradient: [
          'bg-gradient-to-r from-[#6366F1]/20 to-[#06B6D4]/20',
          'text-[#E2E8F0]',
          'border border-[#6366F1]/30',
        ].join(' '),
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'danger' && 'bg-rose-400',
            variant === 'accent' && 'bg-[#06B6D4]',
            (!variant || variant === 'default') && 'bg-[#6366F1]',
            variant === 'muted' && 'bg-[#64748B]'
          )}
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
