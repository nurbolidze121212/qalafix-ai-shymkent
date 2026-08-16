import { beforeEach, describe, expect, it } from 'vitest'
import { generateId, loadReports, saveReports } from './storage'

describe('report storage', () => {
  beforeEach(() => localStorage.clear())

  it('restores safe demo data when storage is corrupted', () => {
    localStorage.setItem('qalafix_reports_v1', '{broken')
    expect(loadReports().length).toBeGreaterThan(0)
  })

  it('removes invalid report objects', () => {
    localStorage.setItem('qalafix_reports_v1', JSON.stringify([{ id: 'bad' }]))
    const reports = loadReports()
    expect(reports.length).toBeGreaterThan(0)
    expect(reports.every((report) => report.title && report.address)).toBe(true)
  })

  it('persists status changes', () => {
    const [report] = loadReports()
    saveReports([{ ...report, status: 'in_progress' }])
    expect(loadReports()[0].status).toBe('in_progress')
  })

  it('generates collision-resistant IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
    expect([...ids].every((id) => /^QF-\d{4}-/.test(id))).toBe(true)
  })
})
