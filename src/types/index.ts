/** Shared TypeScript data models for Market Research. */

export type ProductStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD'
export type IconType = 'emoji' | 'lucide' | 'url'
export type InteractionDirection = 'BUY' | 'SELL'
export type CustomerSentiment =
  | 'HIGH_INTEREST'
  | 'CASUAL'
  | 'BARGAIN'
  | 'BARGAIN_HUNTER'
  | 'READY_TO_BUY'

export interface Product {
  id?: number
  name: string
  breedOrType: string
  targetPrice: number
  minAcceptablePrice?: number
  iconType: IconType
  iconValue: string
  status: ProductStatus
  soldPrice?: number
  soldAt?: string
  soldNote?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Visit {
  id?: number
  visitDate: string
  title: string
  location?: string
  notes?: string
  createdAt: string
}

export interface CustomerInteraction {
  id?: number
  /** SELL = a buyer made an offer; BUY = a seller quoted a price to us. */
  direction?: InteractionDirection
  visitId: number
  productId: number
  questions: string[]
  customQuestion?: string
  offeredPrice?: number
  customerSentiment?: CustomerSentiment
  customerNotes?: string
  createdAt: string
}

export interface QuestionPreset {
  id: string
  label: string
  emoji: string
}

export interface BackupPayload {
  app: string
  version: number
  exportedAt: string
  products: Product[]
  visits: Visit[]
  interactions: CustomerInteraction[]
}

export type ProductInput = Omit<
  Product,
  'id' | 'createdAt' | 'updatedAt' | 'soldPrice' | 'soldAt' | 'soldNote'
>
export type VisitInput = Omit<Visit, 'id' | 'createdAt'>
export type InteractionInput = Omit<CustomerInteraction, 'id' | 'createdAt'>

export interface DataSnapshot {
  products: Product[]
  visits: Visit[]
  interactions: CustomerInteraction[]
}

export type TabKey = 'visits' | 'products' | 'insights' | 'data'

export const STATUS_META: Record<ProductStatus, { label: string; badge: string; dot: string }> = {
  AVAILABLE: {
    label: 'Available',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-300',
    dot: 'bg-emerald-500',
  },
  RESERVED: {
    label: 'Reserved',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    dot: 'bg-amber-500',
  },
  SOLD: {
    label: 'Sold',
    badge: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
    dot: 'bg-sky-500',
  },
}

export const SENTIMENT_META: Record<
  CustomerSentiment,
  { label: string; emoji: string; active: string }
> = {
  HIGH_INTEREST: {
    label: 'Interested',
    emoji: '🔥',
    active: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-300',
  },
  CASUAL: {
    label: 'Casual',
    emoji: '🙂',
    active: 'bg-slate-200 text-slate-800 ring-1 ring-inset ring-slate-300',
  },
  BARGAIN: {
    label: 'Bargaining',
    emoji: '🤝',
    active: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-300',
  },
  BARGAIN_HUNTER: {
    label: 'Bargain hunter',
    emoji: '🤝',
    active: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-300',
  },
  READY_TO_BUY: {
    label: 'Ready to buy',
    emoji: '💰',
    active: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200',
  },
}
