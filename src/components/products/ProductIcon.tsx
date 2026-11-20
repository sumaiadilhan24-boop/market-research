import { useState } from 'react'
import type { Product } from '../../types'

interface ProductIconProps {
  product: Pick<Product, 'iconType' | 'iconValue' | 'name'>
  size?: number
  className?: string
}

export function ProductIcon({ product, size = 28, className = '' }: ProductIconProps) {
  const [broken, setBroken] = useState(false)
  const showImage = product.iconType === 'url' && !!product.iconValue && !broken

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center leading-none ${className}`}
      style={{ fontSize: size }}
      aria-label={product.name}
    >
      {showImage ? (
        <img
          src={product.iconValue}
          alt={product.name}
          className="rounded-lg object-cover"
          style={{ width: size + 12, height: size + 12 }}
          onError={() => setBroken(true)}
        />
      ) : (
        <span role="img">{product.iconValue || '📦'}</span>
      )}
    </span>
  )
}
