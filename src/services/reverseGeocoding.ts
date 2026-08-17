import { Capacitor, CapacitorHttp } from '@capacitor/core'
import type { LocationPoint } from '../utils/geolocation'

const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const CACHE_KEY = 'qalafix-address-cache-v1'
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000
const MAX_CACHE_ITEMS = 40
const USER_AGENT = 'QalaFixAI/1.2 (https://github.com/nurbolidze121212/qalafix-ai-shymkent)'

type AddressDetails = Record<string, string | undefined>

export type NominatimResponse = {
  display_name?: string
  address?: AddressDetails
}

type CacheItem = {
  address: string
  savedAt: number
}

let lastNetworkRequest = 0

function first(details: AddressDetails, keys: string[]) {
  return keys.map((key) => details[key]?.trim()).find(Boolean)
}

export function formatNominatimAddress(payload: NominatimResponse) {
  const details = payload.address ?? {}
  const city = first(details, ['city', 'town', 'municipality', 'village', 'county'])
  const road = first(details, ['road', 'pedestrian', 'residential', 'footway', 'path'])
  const house = first(details, ['house_number', 'house_name'])
  const district = first(details, ['suburb', 'neighbourhood', 'city_district', 'quarter'])
  const parts = [city, road, house, district].filter((value, index, values) => value && values.indexOf(value) === index)
  return parts.length >= 2 ? parts.join(', ') : payload.display_name?.trim() ?? parts.join(', ')
}

function cacheKey(point: LocationPoint) {
  return `${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`
}

function readCache() {
  if (typeof localStorage === 'undefined') return {} as Record<string, CacheItem>
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, CacheItem>
  } catch {
    return {} as Record<string, CacheItem>
  }
}

function getCachedAddress(point: LocationPoint) {
  const item = readCache()[cacheKey(point)]
  return item && Date.now() - item.savedAt < CACHE_TTL ? item.address : null
}

function cacheAddress(point: LocationPoint, address: string) {
  if (typeof localStorage === 'undefined') return
  try {
    const entries = Object.entries(readCache())
      .filter(([, item]) => Date.now() - item.savedAt < CACHE_TTL)
      .sort(([, left], [, right]) => right.savedAt - left.savedAt)
      .slice(0, MAX_CACHE_ITEMS - 1)
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...Object.fromEntries(entries),
      [cacheKey(point)]: { address, savedAt: Date.now() },
    }))
  } catch {
    // Address lookup must still work when storage is unavailable or full.
  }
}

async function throttlePublicService() {
  const wait = Math.max(0, 1_050 - (Date.now() - lastNetworkRequest))
  if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait))
  lastNetworkRequest = Date.now()
}

export async function reverseGeocode(point: LocationPoint) {
  const cached = getCachedAddress(point)
  if (cached) return cached

  await throttlePublicService()
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(point.latitude),
    lon: String(point.longitude),
    zoom: '18',
    addressdetails: '1',
    layer: 'address',
    'accept-language': 'ru,kk',
  })
  const url = `${REVERSE_URL}?${params.toString()}`
  let payload: NominatimResponse

  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.get({
      url,
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    })
    if (response.status < 200 || response.status >= 300) throw new Error('Сервис адресов временно недоступен')
    payload = response.data as NominatimResponse
  } else {
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error('Сервис адресов временно недоступен')
    payload = await response.json() as NominatimResponse
  }

  const address = formatNominatimAddress(payload)
  if (!address) throw new Error('Адрес для этой точки не найден')
  cacheAddress(point, address)
  return address
}
