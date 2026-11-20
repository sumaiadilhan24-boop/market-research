import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-slate-200 bg-white shadow-card',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
