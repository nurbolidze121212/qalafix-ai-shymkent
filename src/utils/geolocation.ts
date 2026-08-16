import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export type LocationPoint = {
  latitude: number
  longitude: number
  accuracy: number
}

export type LocationErrorCode = 'permission-denied' | 'services-disabled' | 'timeout' | 'unavailable'

export class LocationRequestError extends Error {
  constructor(public readonly code: LocationErrorCode) {
    super(code)
    this.name = 'LocationRequestError'
  }
}

const options = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 30_000,
  enableLocationFallback: true,
}

function normalizeLocationError(error: unknown): LocationRequestError {
  if (error instanceof LocationRequestError) return error

  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : ''

  if (code === '1' || code === 'OS-PLUG-GLOC-0003' || code === 'OS-PLUG-GLOC-0009') {
    return new LocationRequestError('permission-denied')
  }
  if (code === '3' || code === 'OS-PLUG-GLOC-0010') {
    return new LocationRequestError('timeout')
  }
  if (code === 'OS-PLUG-GLOC-0007' || code === 'OS-PLUG-GLOC-0017') {
    return new LocationRequestError('services-disabled')
  }
  return new LocationRequestError('unavailable')
}

function requestBrowserLocation(): Promise<LocationPoint> {
  if (!navigator.geolocation) {
    return Promise.reject(new LocationRequestError('unavailable'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      }),
      (error) => reject(normalizeLocationError(error)),
      options,
    )
  })
}

async function requestNativeLocation(): Promise<LocationPoint> {
  let permissions = await Geolocation.checkPermissions()
  if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
    permissions = await Geolocation.requestPermissions({ permissions: ['location'] })
  }
  if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
    throw new LocationRequestError('permission-denied')
  }

  const position = await Geolocation.getCurrentPosition({
    ...options,
    enableHighAccuracy: permissions.location === 'granted',
  })
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
  }
}

export async function requestCurrentLocation(): Promise<LocationPoint> {
  try {
    return Capacitor.isNativePlatform() ? await requestNativeLocation() : await requestBrowserLocation()
  } catch (error) {
    throw normalizeLocationError(error)
  }
}

export function formatDetectedAddress(point: LocationPoint) {
  return `Шымкент · ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
}

export function getLocationErrorMessage(error: unknown) {
  const normalized = normalizeLocationError(error)
  if (normalized.code === 'permission-denied') {
    return 'Доступ к местоположению запрещён. Разрешите геолокацию в настройках телефона или укажите адрес вручную.'
  }
  if (normalized.code === 'services-disabled') {
    return 'Включите геолокацию на телефоне и попробуйте ещё раз.'
  }
  if (normalized.code === 'timeout') {
    return 'Не удалось быстро получить координаты. Выйдите на открытое место и повторите.'
  }
  return 'Местоположение сейчас недоступно. Укажите адрес вручную.'
}

export function formatLocationAccuracy(accuracy: number) {
  return `Местоположение определено · точность ±${Math.max(1, Math.round(accuracy))} м`
}
