import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg'
type Color = 'indigo' | 'cyan' | 'white'

interface LoadingSpinnerProps {
  size?: Size
  color?: Color
  className?: string
}

const sizeMap: Record<Size, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

const colorMap: Record<Color, string> = {
  indigo: 'border-indigo-500/30 border-t-indigo-500',
  cyan: 'border-cyan-500/30 border-t-cyan-400',
  white: 'border-white/30 border-t-white',
}

export function LoadingSpinner({
  size = 'md',
  color = 'indigo',
  className,
}: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full',
        sizeMap[size],
        colorMap[color],
        className,
      )}
    />
  )
}
