import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { demoSnapshot } from '../lib/seed'
import { localDb } from '../lib/localDb'
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

/** Supabase when configured, otherwise a fully local IndexedDB database. */
export type DataMode = 'supabase' | 'local'

type Row = Record<string, unknown>

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

function mergePatch<T extends { id?: number }>(record: T, patch: Partial<T>): T {
  const next: T = { ...record, ...patch }
  for (const key of Object.keys(patch) as Array<keyof T>) {
    if (patch[key] === undefined) delete next[key]
  }
  return next
}

/**
 * Single entry point for every read/write. Components never need to know
 * whether records live in Supabase or in the browser's IndexedDB.
 */
class DataService {
  readonly mode: DataMode = isSupabaseConfigured ? 'supabase' : 'local'
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
      await localDb.seedOnce(demoSnapshot())
      this.cache = await localDb.snapshot()
    }
    this.ready = true
    this.emit()
  }

  /** Health probe used by NetworkContext (Supabase query or local origin check). */
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
    const created = await localDb.addProduct(record)
    this.commitCache({
      products: [created, ...this.cache.products.filter((product) => product.id !== created.id)],
    })
    return created
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
    const current = this.cache.products.find((product) => product.id === id)
    if (!current) return
    const updated = mergePatch(current, changes)
    await localDb.putProduct(updated)
    this.commitCache({
      products: this.cache.products.map((product) => (product.id === id ? updated : product)),
    })
  }

  async deleteProduct(id: number): Promise<void> {
    if (this.mode === 'supabase') {
      const { error } = await getSupabase().from('products').delete().eq('id', id)
      if (error) throw error
    } else {
      await localDb.deleteProduct(id)
    }
    this.commitCache({
      products: this.cache.products.filter((product) => product.id !== id),
      interactions: this.cache.interactions.filter((interaction) => interaction.productId !== id),
    })
  }

  // ---------- Visits ----------

  async createVisit(input: VisitInput): Promise<Visit> {
    const record: Visit = { ...input, id: undefined, createdAt: new Date().toISOString() }
    let created: Visit
    if (this.mode === 'supabase') {
      const client = getSupabase()
      const { id: _id, ...rest } = record
      const { data, error } = await client.from('visits').insert(toRow(rest, VISIT_COLUMNS)).select().single()
      if (error) throw error
      created = fromVisitRow(data as Row)
    } else {
      created = await localDb.addVisit(record)
    }
    this.commitCache({
      visits: [created, ...this.cache.visits.filter((visit) => visit.id !== created.id)].sort((a, b) =>
        b.visitDate.localeCompare(a.visitDate),
      ),
    })
    return created
  }

  async updateVisit(id: number, patch: Partial<Visit>): Promise<void> {
    let updated: Visit
    if (this.mode === 'supabase') {
      const { data, error } = await getSupabase()
        .from('visits')
        .update(toRow(patch, VISIT_COLUMNS))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      updated = fromVisitRow(data as Row)
    } else {
      const current = this.cache.visits.find((visit) => visit.id === id)
      if (!current) return
      updated = mergePatch(current, patch)
      await localDb.putVisit(updated)
    }
    this.commitCache({
      visits: this.cache.visits.map((visit) => (visit.id === id ? updated : visit)),
    })
  }

  async deleteVisit(id: number): Promise<void> {
    if (this.mode === 'supabase') {
      const { error } = await getSupabase().from('visits').delete().eq('id', id)
      if (error) throw error
    } else {
      await localDb.deleteVisit(id)
    }
    this.commitCache({
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
    let created: CustomerInteraction
    if (this.mode === 'supabase') {
      const client = getSupabase()
      const { id: _id, ...rest } = record
      const { data, error } = await client
        .from('interactions')
        .insert(toRow(rest, INTERACTION_COLUMNS))
        .select()
        .single()
      if (error) throw error
      created = fromInteractionRow(data as Row)
    } else {
      created = await localDb.addInteraction(record)
    }
    this.commitCache({
      interactions: [created, ...this.cache.interactions.filter((item) => item.id !== created.id)],
    })
    return created
  }

  async deleteInteraction(id: number): Promise<void> {
    if (this.mode === 'supabase') {
      const { error } = await getSupabase().from('interactions').delete().eq('id', id)
      if (error) throw error
    } else {
      await localDb.deleteInteraction(id)
    }
    this.commitCache({
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
    await localDb.clearAll()
    this.commitCache({ products: [], visits: [], interactions: [] })
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
    await localDb.replaceAll(seed)
    this.commitCache(seed)
  }
}

export const dataService = new DataService()
