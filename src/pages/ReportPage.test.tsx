import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadReports } from '../utils/storage'
import ReportPage from './ReportPage'

vi.mock('../services/analyzer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/analyzer')>()
  return { ...actual, warmupLocalModel: vi.fn().mockResolvedValue(undefined) }
})

describe('report submission flow', () => {
  beforeEach(() => localStorage.clear())

  it('submits the main trash demo and persists it for map and dashboard', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><ReportPage /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: 'Переполненный контейнер' }))
    expect(screen.getByText('Обращение готово')).toBeInTheDocument()
    expect(screen.getByText('Мусор', { selector: 'strong' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Отправить обращение' }))
    expect(await screen.findByText('Обращение отправлено')).toBeInTheDocument()
    const [saved] = loadReports()
    expect(saved.category).toBe('Мусор')
    expect(saved.status).toBe('new')
    expect(saved.analysisSource).toBe('demo-fallback')
    expect(screen.getByRole('button', { name: 'На карте' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'В панели' })).toBeInTheDocument()
  })
})
