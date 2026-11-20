import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { demoSnapshot } from '../lib/seed'
import type {
  CustomerInteraction,
  DataSnapshot,
  IconType,
  InteractionInput,
  Product,
  ProductInput,
  ProductStatus,
  Visit,
  VisitInput,
} from '../types'

export type DataMode = 'supabase' | 'demo'

type Row = Record<string, unknown>

const DEMO_STORAGE_KEY = 'market-research.demo.v3'

const PRODUCT_COLUMNS: Record<string, string> = {
  id: 'id',
  name: 'name',
  breedOrType: 'breed_or_type',
  targetPrice: 'target_price',
  minAcceptablePrice: 'min_acceptable_price',
  iconType: 'icon_type',
  iconValue: 'icon_value',
  status: 'status',
  soldPrice: 'sold_price',
  soldAt: 'sold_at',
  soldNote: 'sold_note',
  notes: 'notes',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

const VISIT_COLUMNS: Record<string, string> = {
  id: 'id',
  visitDate: 'visit_date',
  title: 'title',
  location: 'location',
  notes: 'notes',
  createdAt: 'created_at',
}

const INTERACTION_COLUMNS: Record<string, string> = {
  id: 'id',
  direction: 'direction',
  visitId: 'visit_id',
  productId: 'product_id',
  questions: 'questions',
  customQuestion: 'custom_question',
  offeredPrice: 'offered_price',
  customerSentiment: 'customer_sentiment',
  customerNotes: 'customer_notes',
  createdAt: 'created_at',
}

function toRow<T extends object>(object: Partial<T>, columns: Record<string, string>): Row {
  const row: Row = {}
  for (const [key, value] of Object.entries(object)) {
    const column = columns[key]
    if (!column) continue
    row[column] = value === undefined ? null : value
  }
  return row
}

function numOrUndefined(value: unknown): number | undefined {
  return value === null || value === undefined || value === '' ? undefined : Number(value)
}

function fromProductRow(row: Row): Product {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    breedOrType: String(row.breed_or_type ?? ''),
    targetPrice: Number(row.target_price ?? 0),
    minAcceptablePrice: numOrUndefined(row.min_acceptable_price),
    iconType: (row.icon_type ?? 'emoji') as IconType,
    iconValue: String(row.icon_value ?? '📦'),
    status: (row.status ?? 'AVAILABLE') as ProductStatus,
    soldPrice: numOrUndefined(row.sold_price),
    soldAt: (row.sold_at as string) ?? undefined,
    soldNote: (row.sold_note as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  }
}

function fromVisitRow(row: Row): Visit {
  return {
    id: Number(row.id),
    visitDate: String(row.visit_date ?? '').slice(0, 10),
    title: String(row.title ?? ''),
    location: (row.location as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

function fromInteractionRow(row: Row): CustomerInteraction {
  let questions: string[] = []
  const raw = row.questions
  if (Array.isArray(raw)) questions = raw.map(String)
  else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) questions = parsed.map(String)
    } catch {
      questions = []
    }
  }
  return {
    id: Number(row.id),
    direction: (row.direction as CustomerInteraction['direction']) ?? 'SELL',
    visitId: Number(row.visit_id),
    productId: Number(row.product_id),
    questions,
    customQuestion: (row.custom_question as string) ?? undefined,
    offeredPrice: numOrUndefined(row.offered_price),
    customerSentiment: (row.customer_sentiment as CustomerInteraction['customerSentiment']) ?? undefined,
    customerNotes: (row.customer_notes as string) ?? undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

function loadDemo(): DataSnapshot {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DataSnapshot
      if (
        Array.isArray(parsed.products) &&
        Array.isArray(parsed.visits) &&
        Array.isArray(parsed.interactions)
      ) {
        return parsed
      }
    }
  } catch {
    /* corrupted or unavailable storage — fall back to fresh sample data */
  }
  const seed = demoSnapshot()
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed))
  } catch {
    /* storage may be disabled; in-memory seed still works */
  }
  return seed
}

function saveDemo(snapshot: DataSnapshot): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    /* in-memory state remains usable */
  }
}

function nextId(records: Array<{ id?: number }>): number {
  return records.reduce((max, record) => Math.max(max, record.id ?? 0), 0) + 1
}

function mergePatch<T extends { id?: number }>(record: T, patch: Partial<T>): T {
  const next: T = { ...record, ...patch }
  for (const key of Object.keys(patch) as Array<keyof T>) {
    if (patch[key] === undefined) delete next[key]
  }
  return next
}

/**
 * Single entry point for every read/write. All components use this service,
 * so switching between Supabase and demo mode requires no UI changes.
 */
class DataService {
  readonly mode: DataMode = isSupabaseConfigured ? 'supabase' : 'demo'
  private cache: DataSnapshot = { products: [], visits: [], interactions: [] }
  private ready = false
  private listeners = new Set<() => void>()

  get isReady(): boolean {
    return this.ready
  }

  snapshot(): DataSnapshot {
    return this.cache
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener())
  }

  private commitDemo(next: DataSnapshot): void {
    this.cache = next
    saveDemo(next)
    this.emit()
  }

  /** Apply backend-confirmed rows directly — avoids re-fetching all tables per write. */
  private commitCache(next: Partial<DataSnapshot>): void {
    this.cache = { ...this.cache, ...next }
    this.ready = true
    this.emit()
  }

  async refresh(): Promise<void> {
    if (this.mode === 'supabase') {
      const client = getSupabase()
      const [products, visits, interactions] = await Promise.all([
        client.from('products').select('*').order('created_at', { ascending: false }),
        client.from('visits').select('*').order('visit_date', { ascending: false }),
        client.from('interactions').select('*').order('created_at', { ascending: false }),
      ])
      const error = products.error ?? visits.error ?? interactions.error
      if (error) throw error
      this.cache = {
        products: (products.data ?? []).map((row) => fromProductRow(row as Row)),
        visits: (visits.data ?? []).map((row) => fromVisitRow(row as Row)),
        interactions: (interactions.data ?? []).map((row) => fromInteractionRow(row as Row)),
      }
    } else {
      this.cache = loadDemo()
    }
    this.ready = true
    this.emit()
  }

  /** Health probe used by NetworkContext (Supabase query or demo origin check). */
  async ping(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false
    if (this.mode === 'supabase') {
      try {
        const { error } = await getSupabase().from('products').select('id').limit(1)
        return !error
      } catch {
        return false
      }
    }
    try {
      const response = await fetch(`${window.location.origin}/?__market_research_ping=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      })
      return response.ok || response.type === 'opaque'
    } catch {
      return false
    }
  }

  // ---------- Products ----------

  async createProduct(input: ProductInput): Promise<Product> {
    const now = new Date().toISOString()
    const record: Product = {
      ...input,
      id: undefined,
      createdAt: now,
      updatedAt: now,
    }
    if (this.mode === 'supabase') {
      const client = getSupabase()
      const { id: _id, ...rest } = record
      const { data, error } = await client
        .from('products')
        .insert(toRow(rest, PRODUCT_COLUMNS))
        .select()
        .single()
      if (error) throw error
      const created = fromProductRow(data as Row)
      this.commitCache({
        products: [created, ...this.cache.products.filter((product) => product.id !== created.id)],
      })
      return created
    }
    const product = { ...record, id: nextId(this.cache.products) }
    this.commitDemo({ ...this.cache, products: [...this.cache.products, product] })
    return product
  }

  async updateProduct(id: number, patch: Partial<Product>): Promise<void> {
    const changes = { ...patch, updatedAt: new Date().toISOString() }
    if (this.mode === 'supabase') {
      const { data, error } = await getSupabase()
        .from('products')
        .update(toRow(changes, PRODUCT_COLUMNS))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      const updated = fromProductRow(data as Row)
      this.commitCache({
        products: this.cache.products.map((product) => (product.id === id ? updated : product)),
      })
      return
    }
    this.commitDemo({
      ...this.cache,
      products: this.cache.products.map((product) =>
        product.id === id ? mergePatch(product, changes) : product,
      ),
    })
  }

  async deleteProduct(id: number): Promise<void> {
    if (this.mode === 'supabase') {
      const { error } = await getSupabase().from('products').delete().eq('id', id)
      if (error) throw error
      this.commitCache({
        products: this.cache.products.filter((product) => product.id !== id),
        interactions: this.cache.interactions.filter((interaction) => interaction.productId !== id),
      })
      return
    }
    this.commitDemo({
      products: this.cache.products.filter((product) => product.id !== id),
      visits: this.cache.visits,
      interactions: this.cache.interactions.filter((interaction) => interaction.productId !== id),
    })
  }

  // ---------- Visits ----------

  async createVisit(input: VisitInput): Promise<Visit> {
    const record: Visit = { ...input, id: undefined, createdAt: new Date().toISOString() }
    if (this.mode === 'supabase') {
      const client = getSupabase()
      const { id: _id, ...rest } = record
      const { data, error } = await client.from('visits').insert(toRow(rest, VISIT_COLUMNS)).select().single()
      if (error) throw error
      const created = fromVisitRow(data as Row)
      this.commitCache({
        visits: [created, ...this.cache.visits.filter((visit) => visit.id !== created.id)].sort((a, b) =>
          b.visitDate.localeCompare(a.visitDate),
        ),
      })
      return created
    }
    const visit = { ...record, id: nextId(this.cache.visits) }
    this.commitDemo({ ...this.cache, visits: [...this.cache.visits, visit] })
    return visit
  }

  async updateVisit(id: number, patch: Partial<Visit>): Promise<void> {
    if (this.mode === 'supabase') {
      const { data, error } = await getSupabase()
        .from('visits')
        .update(toRow(patch, VISIT_COLUMNS))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      const updated = fromVisitRow(data as Row)
      this.commitCache({
        visits: this.cache.visits.map((visit) => (visit.id === id ? updated : visit)),
      })
      return
    }
    this.commitDemo({
      ...this.cache,
      visits: this.cache.visits.map((visit) => (visit.id === id ? mergePatch(visit, patch) : visit)),
    })
  }

  async deleteVisit(id: number): Promise<void> {
    if (this.mode === 'supabase') {
      const { error } = await getSupabase().from('visits').delete().eq('id', id)
      if (error) throw error
      this.commitCache({
        visits: this.cache.visits.filter((visit) => visit.id !== id),
        interactions: this.cache.interactions.filter((interaction) => interaction.visitId !== id),
      })
      return
    }
    this.commitDemo({
      products: this.cache.products,
      visits: this.cache.visits.filter((visit) => visit.id !== id),
      interactions: this.cache.interactions.filter((interaction) => interaction.visitId !== id),
    })
  }

  // ---------- Interactions ----------

  async createInteraction(input: InteractionInput): Promise<CustomerInteraction> {
    const record: CustomerInteraction = {
      ...input,
      id: undefined,
      createdAt: new Date().toISOString(),
    }
    if (this.mode === 'supabase') {
      const client = getSupabase()
      const { id: _id, ...rest } = record
      const { data, error } = await client
        .from('interactions')
        .insert(toRow(rest, INTERACTION_COLUMNS))
        .select()
        .single()
      if (error) throw error
      const created = fromInteractionRow(data as Row)
      this.commitCache({
        interactions: [created, ...this.cache.interactions.filter((item) => item.id !== created.id)],
      })
      return created
    }
    const interaction = { ...record, id: nextId(this.cache.interactions) }
    this.commitDemo({
      ...this.cache,
      interactions: [...this.cache.interactions, interaction],
    })
    return interaction
  }

  async deleteInteraction(id: number): Promise<void> {
    if (this.mode === 'supabase') {
      const { error } = await getSupabase().from('interactions').delete().eq('id', id)
      if (error) throw error
      this.commitCache({
        interactions: this.cache.interactions.filter((interaction) => interaction.id !== id),
      })
      return
    }
    this.commitDemo({
      ...this.cache,
      interactions: this.cache.interactions.filter((interaction) => interaction.id !== id),
    })
  }

  // ---------- Maintenance ----------

  async clearAll(): Promise<void> {
    if (this.mode === 'supabase') {
      const client = getSupabase()
      await client.from('interactions').delete().neq('id', 0)
      await client.from('visits').delete().neq('id', 0)
      await client.from('products').delete().neq('id', 0)
      await this.refresh()
      return
    }
    this.commitDemo({ products: [], visits: [], interactions: [] })
  }

  async resetToSeed(): Promise<void> {
    const seed = demoSnapshot()
    if (this.mode === 'supabase') {
      const client = getSupabase()
      await client.from('interactions').delete().neq('id', 0)
      await client.from('visits').delete().neq('id', 0)
      await client.from('products').delete().neq('id', 0)
      const products = await client
        .from('products')
        .insert(seed.products.map((product) => toRow(product, PRODUCT_COLUMNS)))
      const visits = await client
        .from('visits')
        .insert(seed.visits.map((visit) => toRow(visit, VISIT_COLUMNS)))
      const interactions = await client
        .from('interactions')
        .insert(seed.interactions.map((interaction) => toRow(interaction, INTERACTION_COLUMNS)))
      const error = products.error ?? visits.error ?? interactions.error
      if (error) throw error
      await this.refresh()
      return
    }
    this.commitDemo(seed)
  }
}

export const dataService = new DataService()
