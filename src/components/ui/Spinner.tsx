import * as React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'accent' | 'white' | 'muted';
  className?: string;
  label?: string;
}

const sizeMap = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-4',
};

const variantMap = {
  primary: 'border-[#6366F1]/30 border-t-[#6366F1]',
  accent: 'border-[#06B6D4]/30 border-t-[#06B6D4]',
  white: 'border-white/20 border-t-white',
  muted: 'border-[#2A2A5A] border-t-[#64748B]',
};

export function Spinner({
  size = 'md',
  variant = 'primary',
  className,
  label,
}: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn('inline-flex flex-col items-center gap-3', className)}
    >
      <div
        className={cn(
          'rounded-full animate-spin',
          sizeMap[size],
          variantMap[variant]
        )}
        aria-hidden="true"
      />
      {label && (
        <span className="text-sm text-[#64748B] animate-pulse">{label}</span>
      )}
      <span className="sr-only">Loading{label ? `: ${label}` : '...'}</span>
    </div>
  );
}

// Gradient spinner — more visually striking
export function GradientSpinner({
  size = 'md',
  className,
}: {
  size?: SpinnerProps['size'];
  className?: string;
}) {
  const sizeClass = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }[size];

  return (
    <div
      role="status"
      className={cn('relative inline-flex items-center justify-center animate-spin', sizeClass, className)}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="url(#spinner-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="40 20"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Full-page loading overlay
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060611]/90 backdrop-blur-sm">
      <GradientSpinner size="xl" />
      {message && (
        <p className="mt-4 text-[#94A3B8] text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
}
