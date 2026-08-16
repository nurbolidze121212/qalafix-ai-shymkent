import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  formatDetectedAddress,
  formatLocationAccuracy,
  getLocationErrorMessage,
  LocationRequestError,
  requestCurrentLocation,
} from './geolocation'

const originalGeolocation = navigator.geolocation

afterEach(() => {
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: originalGeolocation })
})

describe('geolocation', () => {
  it('returns coordinates from the browser permission flow', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success: PositionCallback) => success({
          coords: { latitude: 42.315, longitude: 69.605, accuracy: 12 },
        } as GeolocationPosition)),
      },
    })

    await expect(requestCurrentLocation()).resolves.toEqual({ latitude: 42.315, longitude: 69.605, accuracy: 12 })
  })

  it('uses a clear message when permission is denied', () => {
    expect(getLocationErrorMessage(new LocationRequestError('permission-denied'))).toContain('Разрешите геолокацию')
  })

  it('formats coordinates and accuracy for the interface', () => {
    const point = { latitude: 42.315, longitude: 69.605, accuracy: 7.6 }
    expect(formatDetectedAddress(point)).toBe('Шымкент · 42.31500, 69.60500')
    expect(formatLocationAccuracy(point.accuracy)).toBe('Местоположение определено · точность ±8 м')
  })
})
