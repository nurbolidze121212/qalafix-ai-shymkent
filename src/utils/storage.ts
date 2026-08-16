import { type CityReport } from '../types/report'
import { initialReports } from '../data/demoReports'

const STORAGE_KEY = 'qalafix_reports_v1'

export function loadReports(): CityReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      saveReports(initialReports)
      return initialReports
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      saveReports(initialReports)
      return initialReports
    }
    const valid = parsed.filter(isCityReport)
    if (valid.length !== parsed.length) saveReports(valid.length ? valid : initialReports)
    return valid.length ? valid : initialReports
  } catch {
    saveReports(initialReports)
    return initialReports
  }
}

export function saveReports(reports: CityReport[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
  } catch {
    // storage full or unavailable
  }
}

export function generateId(): string {
  const now = new Date()
  const year = now.getFullYear()
  const unique = globalThis.crypto?.randomUUID?.().slice(0, 8).toUpperCase()
    ?? `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase()
  return `QF-${year}-${unique}`
}

function isCityReport(value: unknown): value is CityReport {
  if (!value || typeof value !== 'object') return false
  const report = value as Partial<CityReport>
  return typeof report.id === 'string'
    && typeof report.title === 'string'
    && typeof report.description === 'string'
    && typeof report.category === 'string'
    && typeof report.address === 'string'
    && typeof report.latitude === 'number'
    && typeof report.longitude === 'number'
    && typeof report.createdAt === 'string'
    && ['low', 'medium', 'high', 'critical'].includes(report.severity ?? '')
    && ['new', 'review', 'in_progress', 'resolved'].includes(report.status ?? '')
}
