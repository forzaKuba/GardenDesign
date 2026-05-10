import { ButtonHTMLAttributes } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  danger?: boolean
  size?: 'sm' | 'md'
}

export function IconButton({ active, danger, size = 'md', className = '', children, ...rest }: IconButtonProps) {
  const base = size === 'sm'
    ? 'w-7 h-7 text-sm'
    : 'w-9 h-9 text-base'

  const color = danger
    ? 'text-red-400 hover:bg-red-900/40 hover:text-red-300'
    : active
      ? 'bg-green-700 text-white'
      : 'text-neutral-400 hover:bg-neutral-700 hover:text-neutral-100'

  return (
    <button
      {...rest}
      className={`${base} ${color} rounded-lg flex items-center justify-center transition-colors ${className}`}
    >
      {children}
    </button>
  )
}
