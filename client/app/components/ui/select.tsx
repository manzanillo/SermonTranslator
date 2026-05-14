import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'block w-full rounded-2xl border border-[#d7e4d8] bg-white px-4 py-3 text-sm text-[#17201b] shadow-sm transition duration-150 focus:border-[#6b8d6f] focus:outline-none focus:ring-2 focus:ring-[#d8eed5]',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    )
  },
)

Select.displayName = 'Select'

export { Select }
