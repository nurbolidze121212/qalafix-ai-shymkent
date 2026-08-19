import type { CityReport } from '../types/report'

export const reportMapFilters = [
  { id: 'trash', label: 'Мусор', category: 'Мусор' },
  { id: 'all', label: 'Все' },
  { id: 'high', label: 'Высокий риск', severity: 'high' as const },
  { id: 'critical', label: 'Критический', severity: 'critical' as const },
  { id: 'roads', label: 'Дороги', category: 'Дороги' },
  { id: 'safety', label: 'Безопасность', category: 'Безопасность / ЖКХ' },
  { id: 'water', label: 'Вода', category: 'Водоснабжение' },
  { id: 'improvement', label: 'Благоустройство', category: 'Благоустройство' },
  { id: 'light', label: 'Освещение', category: 'Освещение' },
] as const

export function initialMapFilter(category?: string | null) {
  if (!category) return 'trash'
  return reportMapFilters.find((filter) => 'category' in filter && filter.category === category)?.id ?? 'all'
}

export function filterMapReports(reports: CityReport[], filterId: string) {
  if (filterId === 'all') return reports
  const filter = reportMapFilters.find((item) => item.id === filterId)
  if (!filter) return reports
  if ('severity' in filter) return reports.filter((report) => report.severity === filter.severity)
  if ('category' in filter) return reports.filter((report) => report.category === filter.category)
  return reports
}
