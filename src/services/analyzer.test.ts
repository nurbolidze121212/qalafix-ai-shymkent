import { describe, expect, it } from 'vitest'
import { analyzeDemoScenario, createManualResult, demoScenarios, displayTrashSubtype } from './analyzer'

describe('local analyzer result mapping', () => {
  it('covers the five jury scenarios', () => {
    expect(demoScenarios.map((scenario) => scenario.id)).toEqual([
      'trash', 'manhole', 'pothole', 'water_leak', 'broken_bench',
    ])
  })

  it.each([
    ['trash', 'Мусор', 'medium'],
    ['manhole', 'Безопасность / ЖКХ', 'critical'],
    ['pothole', 'Дороги', 'high'],
    ['water_leak', 'Водоснабжение', 'high'],
    ['broken_bench', 'Благоустройство', 'low'],
  ] as const)('maps %s to a Russian appeal', (modelClass, category, severity) => {
    const result = analyzeDemoScenario(modelClass)
    expect(result.category).toBe(category)
    expect(result.severity).toBe(severity)
    expect(result.source).toBe('demo-fallback')
    expect(result.needsReview).toBe(false)
    expect(result.description.length).toBeGreaterThan(30)
  })

  it('marks the other class for manual review', () => {
    const result = createManualResult('other')
    expect(result.source).toBe('manual')
    expect(result.needsReview).toBe(true)
  })

  it('uses four clear waste groups instead of over-specific labels', () => {
    expect(displayTrashSubtype('single_litter')).toBe('scattered_litter')
    expect(displayTrashSubtype('waste_pile')).toBe('illegal_dump')
    expect(displayTrashSubtype('overflowing_bin')).toBe('overflowing_bin')
  })
})
