import { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand text-white hover:bg-[#149121] focus-visible:ring-brand shadow-sm',
  secondary:
    'bg-white text-brand border border-[#c6e2cd] hover:bg-[#f3faf4] focus-visible:ring-[#d8efdd]',
  ghost:
    'bg-transparent text-brand hover:bg-[#eff7ef] focus-visible:ring-[#d8efdd]',
}

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-[3.5rem] w-full items-center justify-center rounded-[0.5rem] px-6 py-3 text-base font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
