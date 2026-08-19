import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDemoReport } from '../data/demoReports'
import { analyzeDemoScenario, demoScenarios } from '../services/analyzer'
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
    expect(saveReports([{ ...report, status: 'in_progress' }])).toBe(true)
    expect(loadReports()[0].status).toBe('in_progress')
  })

  it('persists the complete five-category lifecycle after a reload', () => {
    const reports = demoScenarios.map((scenario, index) => {
      const result = analyzeDemoScenario(scenario.id)
      return createDemoReport({
        id: `QF-LIFECYCLE-${index}`,
        category: result.category,
        title: result.title,
        description: result.description,
        severity: result.severity,
        confidence: result.confidence,
        analysisSource: result.source,
      })
    })
    expect(saveReports(reports)).toBe(true)
    expect(loadReports().map((report) => report.category)).toEqual(reports.map((report) => report.category))

    const inProgress = loadReports().map((report) => ({ ...report, status: 'in_progress' as const }))
    expect(saveReports(inProgress)).toBe(true)
    expect(loadReports().every((report) => report.status === 'in_progress')).toBe(true)
  })

  it('reports a storage failure instead of claiming success', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota exceeded') })
    expect(saveReports([createDemoReport()])).toBe(false)
    setItem.mockRestore()
  })

  it('generates collision-resistant IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
    expect([...ids].every((id) => /^QF-\d{4}-/.test(id))).toBe(true)
  })
})
