import type { CustomerInteraction, Product, QuestionPreset, Visit } from '../types'
import { todayISO } from '../utils'

/** One-tap question chips used by the fast interaction logger. */
export const COMMON_QUESTIONS: QuestionPreset[] = [
  { id: 'stock', label: 'In stock?', emoji: '📦' },
  { id: 'flexible', label: 'Price flexible?', emoji: '💬' },
  { id: 'bulk', label: 'Bulk order?', emoji: '📚' },
  { id: 'quality', label: 'Material / quality?', emoji: '🔍' },
  { id: 'sample', label: 'Sample available?', emoji: '🎁' },
  { id: 'delivery', label: 'Delivery?', emoji: '🚚' },
  { id: 'warranty', label: 'Warranty?', emoji: '🛡️' },
  { id: 'returns', label: 'Return policy?', emoji: '↩️' },
]

export const QUICK_ADD_AMOUNTS = [10, 25, 50, 100]
export const PRICE_PRESETS = [200, 300, 400, 500, 650, 800]

export const EMOJI_CHOICES = [
  '📦', '🏷️', '🛍️', '👜', '🍵', '☕', '🕯️', '🧼',
  '📓', '📚', '🎁', '🧸', '👕', '🧢', '⚽', '💎',
]

export function demoProducts(): Product[] {
  const now = new Date().toISOString()
  return [
    {
      id: 1,
      name: 'Ceramic Mug Set',
      breedOrType: 'Home · Handmade',
      targetPrice: 850,
      minAcceptablePrice: 700,
      iconType: 'emoji',
      iconValue: '🍵',
      status: 'AVAILABLE',
      notes: 'Hand-glazed, set of four. Popular with gift buyers.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      name: 'Woven Tote Bag',
      breedOrType: 'Accessories · Cotton',
      targetPrice: 1200,
      minAcceptablePrice: 1000,
      iconType: 'emoji',
      iconValue: '👜',
      status: 'AVAILABLE',
      notes: 'Sturdy canvas, two sizes available.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 3,
      name: 'Soy Candle Trio',
      breedOrType: 'Home · Fragrance',
      targetPrice: 350,
      minAcceptablePrice: 280,
      iconType: 'emoji',
      iconValue: '🕯️',
      status: 'RESERVED',
      notes: 'Assorted scents, gift boxed.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 4,
      name: 'Leather Notebook',
      breedOrType: 'Stationery · A5',
      targetPrice: 950,
      minAcceptablePrice: 800,
      iconType: 'emoji',
      iconValue: '📓',
      status: 'AVAILABLE',
      notes: 'Refillable pages with an embossed cover.',
      createdAt: now,
      updatedAt: now,
    },
  ]
}

export function demoVisits(): Visit[] {
  const now = new Date().toISOString()
  return [
    {
      id: 1,
      visitDate: '2026-11-08',
      title: 'Weekend Market Fair',
      location: 'Downtown Market',
      notes: 'Busy morning, slow afternoon.',
      createdAt: now,
    },
    {
      id: 2,
      visitDate: '2026-11-15',
      title: 'City Plaza Market',
      location: 'City Plaza',
      notes: 'Good foot traffic near the entrance.',
      createdAt: now,
    },
    {
      id: 3,
      visitDate: todayISO(),
      title: 'Today · Field Visit',
      createdAt: now,
    },
  ]
}

export function demoInteractions(): CustomerInteraction[] {
  return [
    { id: 1, direction: 'SELL', visitId: 1, productId: 1, questions: ['In stock?', 'Price flexible?'], offeredPrice: 700, customerSentiment: 'HIGH_INTEREST', createdAt: '2026-11-08T10:12:00.000Z' },
    { id: 2, direction: 'SELL', visitId: 1, productId: 1, questions: ['Bulk order?'], offeredPrice: 800, customerSentiment: 'READY_TO_BUY', createdAt: '2026-11-08T11:40:00.000Z' },
    { id: 3, direction: 'SELL', visitId: 1, productId: 2, questions: ['Material / quality?'], offeredPrice: 1000, customerSentiment: 'CASUAL', createdAt: '2026-11-08T13:05:00.000Z' },
    { id: 4, direction: 'SELL', visitId: 2, productId: 1, questions: ['In stock?', 'Delivery?'], offeredPrice: 750, customerSentiment: 'BARGAIN', createdAt: '2026-11-15T09:30:00.000Z' },
    { id: 5, direction: 'BUY', visitId: 2, productId: 3, questions: ['Sample available?'], offeredPrice: 300, customerSentiment: 'HIGH_INTEREST', createdAt: '2026-11-15T12:15:00.000Z' },
    { id: 6, direction: 'BUY', visitId: 2, productId: 4, questions: ['Bulk order?', 'Warranty?'], offeredPrice: 900, customerSentiment: 'READY_TO_BUY', createdAt: '2026-11-15T15:20:00.000Z' },
  ]
}

export function demoSnapshot() {
  return {
    products: demoProducts(),
    visits: demoVisits(),
    interactions: demoInteractions(),
  }
}
