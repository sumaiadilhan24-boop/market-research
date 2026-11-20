import type { BackupPayload, CustomerInteraction, Product, Visit } from '../types'
import { dataService } from './dataService'

function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}

export function buildBackup(): BackupPayload {
  const snapshot = dataService.snapshot()
  return {
    app: 'Market Research',
    version: 3,
    exportedAt: new Date().toISOString(),
    products: snapshot.products,
    visits: snapshot.visits,
    interactions: snapshot.interactions,
  }
}

export function exportJson(): void {
  downloadFile(
    `market-research-backup-${stamp()}.json`,
    JSON.stringify(buildBackup(), null, 2),
    'application/json',
  )
}

function csvCell(value: string | number | undefined): string {
  const text = value === undefined || value === null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export function exportCsv(): void {
  const { interactions, visits, products } = dataService.snapshot()
  const visitMap = new Map(visits.map((visit) => [visit.id, visit]))
  const productMap = new Map(products.map((product) => [product.id, product]))

  const header = [
    'interaction_id',
    'date',
    'time',
    'visit_title',
    'visit_date',
    'product_name',
    'questions',
    'custom_question',
    'offered_price',
    'sentiment',
    'notes',
  ]
    .map(csvCell)
    .join(',')

  const rows = interactions.map((interaction) => {
    const visit = visitMap.get(interaction.visitId)
    const product = productMap.get(interaction.productId)
    const created = new Date(interaction.createdAt)
    const valid = !Number.isNaN(created.getTime())
    return [
      csvCell(interaction.id),
      csvCell(valid ? created.toISOString().slice(0, 10) : ''),
      csvCell(valid ? created.toISOString().slice(11, 16) : ''),
      csvCell(visit?.title ?? ''),
      csvCell(visit?.visitDate ?? ''),
      csvCell(product?.name ?? ''),
      csvCell(interaction.questions.join('; ')),
      csvCell(interaction.customQuestion),
      csvCell(interaction.offeredPrice),
      csvCell(interaction.customerSentiment),
      csvCell(interaction.customerNotes),
    ].join(',')
  })

  downloadFile(`market-research-interactions-${stamp()}.csv`, [header, ...rows].join('\r\n'), 'text/csv;charset=utf-8')
}

function parseBackup(text: string): BackupPayload {
  const parsed = JSON.parse(text) as Partial<BackupPayload>
  if (
    !parsed ||
    (parsed.app !== 'Market Research' && parsed.app !== 'SaleCat') ||
    !Array.isArray(parsed.products) ||
    !Array.isArray(parsed.visits) ||
    !Array.isArray(parsed.interactions)
  ) {
    throw new Error('This file is not a valid Market Research backup.')
  }
  return parsed as BackupPayload
}

export interface ImportResult {
  products: number
  visits: number
  interactions: number
}

/** Restore a JSON backup with IDs remapped for the current database. */
export async function importJson(file: File, replace: boolean): Promise<ImportResult> {
  const backup = parseBackup(await file.text())
  if (replace) await dataService.clearAll()

  const productIds = new Map<number | undefined, number>()
  const visitIds = new Map<number | undefined, number>()

  for (const product of backup.products) {
    const created = await dataService.createProduct({
      name: product.name,
      breedOrType: product.breedOrType,
      targetPrice: product.targetPrice,
      minAcceptablePrice: product.minAcceptablePrice,
      iconType: product.iconType,
      iconValue: product.iconValue,
      status: product.status,
      notes: product.notes,
    })
    productIds.set(product.id, created.id!)
  }

  for (const visit of backup.visits) {
    const created = await dataService.createVisit({
      visitDate: visit.visitDate,
      title: visit.title,
      location: visit.location,
      notes: visit.notes,
    })
    visitIds.set(visit.id, created.id!)
  }

  let importedInteractions = 0
  for (const interaction of backup.interactions) {
    const visitId = visitIds.get(interaction.visitId)
    const productId = productIds.get(interaction.productId)
    if (visitId === undefined || productId === undefined) continue
    await dataService.createInteraction({
      visitId,
      productId,
      questions: interaction.questions,
      customQuestion: interaction.customQuestion,
      offeredPrice: interaction.offeredPrice,
      customerSentiment: interaction.customerSentiment,
      customerNotes: interaction.customerNotes,
    })
    importedInteractions += 1
  }

  return {
    products: backup.products.length,
    visits: backup.visits.length,
    interactions: importedInteractions,
  }
}

export type { BackupPayload, CustomerInteraction, Product, Visit }
