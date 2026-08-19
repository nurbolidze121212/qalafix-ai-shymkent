import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDemoReport } from '../data/demoReports'
import { loadReports, saveReports } from '../utils/storage'
import DashboardPage from './DashboardPage'

describe('operator dashboard flow', () => {
  beforeEach(() => {
    localStorage.clear()
    saveReports([createDemoReport({
      id: 'QF-DASHBOARD-TEST',
      title: 'Переполненный контейнер',
      category: 'Мусор',
      status: 'new',
    })])
  })

  it('persists an operator status change after reopening the panel', async () => {
    const user = userEvent.setup()
    const firstRender = render(<MemoryRouter><DashboardPage /></MemoryRouter>)
    const status = screen.getByRole('combobox', { name: 'Статус обращения Переполненный контейнер' })
    await user.selectOptions(status, 'in_progress')
    expect(loadReports()[0].status).toBe('in_progress')

    firstRender.unmount()
    render(<MemoryRouter><DashboardPage /></MemoryRouter>)
    expect(screen.getByRole('combobox', { name: 'Статус обращения Переполненный контейнер' })).toHaveValue('in_progress')
  })
})
