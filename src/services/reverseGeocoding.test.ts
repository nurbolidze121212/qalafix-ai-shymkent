import { describe, expect, it } from 'vitest'
import { formatNominatimAddress } from './reverseGeocoding'

describe('reverse geocoding address formatting', () => {
  it('builds a compact street and house address', () => {
    expect(formatNominatimAddress({
      display_name: '25, улица Тауке хана, Шымкент, Казахстан',
      address: {
        city: 'Шымкент',
        road: 'улица Тауке хана',
        house_number: '25',
        neighbourhood: 'Аль-Фарабийский район',
      },
    })).toBe('Шымкент, улица Тауке хана, 25, Аль-Фарабийский район')
  })

  it('falls back to the provider display name when details are sparse', () => {
    expect(formatNominatimAddress({ display_name: 'Шымкент, Казахстан' })).toBe('Шымкент, Казахстан')
  })
})
