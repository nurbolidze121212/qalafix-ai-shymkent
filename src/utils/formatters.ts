import { type Severity, type ReportStatus } from '../types/report'

export function formatDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function severityLabel(severity: Severity) {
  switch (severity) {
    case 'low':
      return 'Низкий'
    case 'medium':
      return 'Средний'
    case 'high':
      return 'Высокий'
    case 'critical':
      return 'Критический'
  }
}

export function severityColor(severity: Severity) {
  switch (severity) {
    case 'low':
      return 'bg-emerald-100 text-emerald-700'
    case 'medium':
      return 'bg-amber-100 text-amber-700'
    case 'high':
      return 'bg-red-100 text-red-700'
    case 'critical':
      return 'bg-red-100 text-red-700'
  }
}

export function statusLabel(status: ReportStatus) {
  switch (status) {
    case 'new':
      return 'Новая'
    case 'review':
      return 'На рассмотрении'
    case 'in_progress':
      return 'В работе'
    case 'resolved':
      return 'Решена'
  }
}

export function statusColor(status: ReportStatus) {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-700'
    case 'review':
      return 'bg-indigo-100 text-indigo-700'
    case 'in_progress':
      return 'bg-amber-100 text-amber-700'
    case 'resolved':
      return 'bg-emerald-100 text-emerald-700'
  }
}
