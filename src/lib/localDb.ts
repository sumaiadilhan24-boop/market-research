import Dexie, { type Table } from 'dexie'
import type { CustomerInteraction, DataSnapshot, Product, Visit } from '../types'

const SEED_FLAG = 'market-research.local.seeded'

/**
 * Local IndexedDB backend used when Supabase credentials are not configured.
 * All records live in the browser and survive reloads, restarts and PWA launches.
 */
class LocalDatabase extends Dexie {
  products!: Table<Product, number>
  visits!: Table<Visit, number>
  interactions!: Table<CustomerInteraction, number>

  constructor() {
    super('MarketResearchDB')
    this.version(1).stores({
      products: '++id, name, status, createdAt',
      visits: '++id, visitDate, title, createdAt',
      interactions: '++id, direction, visitId, productId, createdAt',
    })
  }
}

const db = new LocalDatabase()

function isSeeded(): boolean {
  try {
    return localStorage.getItem(SEED_FLAG) === '1'
  } catch {
    return false
  }
}

function markSeeded(): void {
  try {
    localStorage.setItem(SEED_FLAG, '1')
  } catch {
    /* storage may be disabled — the next launch will simply seed again */
  }
}

export const localDb = {
  /** Seed sample data exactly once (clearing all data later will not re-seed). */
  async seedOnce(seed: DataSnapshot): Promise<void> {
    if (isSeeded()) return
    const count =
      (await db.products.count()) + (await db.visits.count()) + (await db.interactions.count())
    if (count > 0) {
      markSeeded()
      return
    }
    await db.transaction('rw', db.products, db.visits, db.interactions, async () => {
      await db.products.bulkAdd(seed.products)
      await db.visits.bulkAdd(seed.visits)
      await db.interactions.bulkAdd(seed.interactions)
    })
    markSeeded()
  },

  async snapshot(): Promise<DataSnapshot> {
    const [products, visits, interactions] = await Promise.all([
      db.products.toArray(),
      db.visits.toArray(),
      db.interactions.toArray(),
    ])
    return {
      products: products.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      visits: visits.sort((a, b) => b.visitDate.localeCompare(a.visitDate)),
      interactions: interactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }
  },

  async addProduct(product: Product): Promise<Product> {
    const { id: _id, ...rest } = product
    const id = await db.products.add(rest as Product)
    return { ...product, id }
  },

  async putProduct(product: Product): Promise<void> {
    await db.products.put(product)
  },

  async deleteProduct(id: number): Promise<void> {
    await db.transaction('rw', db.products, db.interactions, async () => {
      await db.interactions.where('productId').equals(id).delete()
      await db.products.delete(id)
    })
  },

  async addVisit(visit: Visit): Promise<Visit> {
    const { id: _id, ...rest } = visit
    const id = await db.visits.add(rest as Visit)
    return { ...visit, id }
  },

  async putVisit(visit: Visit): Promise<void> {
    await db.visits.put(visit)
  },

  async deleteVisit(id: number): Promise<void> {
    await db.transaction('rw', db.visits, db.interactions, async () => {
      await db.interactions.where('visitId').equals(id).delete()
      await db.visits.delete(id)
    })
  },

  async addInteraction(interaction: CustomerInteraction): Promise<CustomerInteraction> {
    const { id: _id, ...rest } = interaction
    const id = await db.interactions.add(rest as CustomerInteraction)
    return { ...interaction, id }
  },

  async deleteInteraction(id: number): Promise<void> {
    await db.interactions.delete(id)
  },

  async clearAll(): Promise<void> {
    await db.transaction('rw', db.products, db.visits, db.interactions, async () => {
      await db.interactions.clear()
      await db.visits.clear()
      await db.products.clear()
    })
    markSeeded()
  },

  async replaceAll(seed: DataSnapshot): Promise<void> {
    await db.transaction('rw', db.products, db.visits, db.interactions, async () => {
      await db.interactions.clear()
      await db.visits.clear()
      await db.products.clear()
      await db.products.bulkAdd(seed.products)
      await db.visits.bulkAdd(seed.visits)
      await db.interactions.bulkAdd(seed.interactions)
    })
    markSeeded()
  },
}
