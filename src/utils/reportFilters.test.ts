import { describe, expect, it } from 'vitest'
import { createDemoReport } from '../data/demoReports'
import { analyzeDemoScenario, demoScenarios } from '../services/analyzer'
import { filterMapReports, initialMapFilter } from './reportFilters'

describe('map report filters', () => {
  const reports = demoScenarios.map((scenario, index) => {
    const result = analyzeDemoScenario(scenario.id)
    return createDemoReport({
      id: `QF-TEST-${index}`,
      category: result.category,
      title: result.title,
      description: result.description,
      severity: result.severity,
    })
  })

  it('opens the matching map filter after every demo submission', () => {
    for (const report of reports) {
      const filter = initialMapFilter(report.category)
      expect(filterMapReports(reports, filter).some((item) => item.id === report.id)).toBe(true)
    }
  })

  it('keeps trash as the default and water as an explicit category', () => {
    expect(initialMapFilter()).toBe('trash')
    expect(initialMapFilter('Водоснабжение')).toBe('water')
    expect(filterMapReports(reports, 'water').every((report) => report.category === 'Водоснабжение')).toBe(true)
  })
})
