import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'block w-full rounded-2xl border border-[#d7e4d8] bg-white px-4 py-3 text-sm text-[#17201b] shadow-sm transition duration-150 placeholder:text-[#8f9a8b] focus:border-[#6b8d6f] focus:outline-none focus:ring-2 focus:ring-[#d8eed5]',
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { Input }
