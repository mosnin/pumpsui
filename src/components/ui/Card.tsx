import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-2xl transition-all duration-300',
  {
    variants: {
      variant: {
        // Default glassmorphism card
        default: [
          'bg-gradient-to-br from-[#161630] to-[#0D0D1F]',
          'border border-[#2A2A5A]',
          'backdrop-filter backdrop-blur-xl',
        ].join(' '),

        // Elevated — stronger glow
        elevated: [
          'bg-gradient-to-br from-[#1E1E45]/80 to-[#0D0D1F]/90',
          'border border-[#2A2A5A]',
          'backdrop-filter backdrop-blur-xl',
          'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        ].join(' '),

        // Glass with blur
        glass: [
          'glass-card',
          'backdrop-filter backdrop-blur-2xl',
        ].join(' '),

        // Gradient border card
        gradient: [
          'bg-gradient-to-br from-[#161630] to-[#0D0D1F]',
          'gradient-border',
          'backdrop-filter backdrop-blur-xl',
        ].join(' '),

        // Accent — highlighted with primary color
        accent: [
          'bg-gradient-to-br from-[#6366F1]/10 to-[#06B6D4]/5',
          'border border-[#6366F1]/30',
          'backdrop-filter backdrop-blur-xl',
        ].join(' '),

        // Ghost — minimal styling
        ghost: [
          'bg-transparent',
          'border border-[#2A2A5A]/50',
        ].join(' '),
      },
      hover: {
        true: 'hover:border-[#6366F1]/50 hover:shadow-[0_0_24px_rgba(99,102,241,0.15)] hover:-translate-y-0.5 cursor-pointer',
        false: '',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: false,
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1.5 pb-4', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-bold tracking-tight text-[#E2E8F0]',
      'font-[family-name:var(--font-space-grotesk,_var(--font-sans))]',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-[#64748B] leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4 border-t border-[#2A2A5A]/60', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
