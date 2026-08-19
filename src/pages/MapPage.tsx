import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { loadReports } from '../utils/storage'
import { type CityReport } from '../types/report'
import { severityLabel, severityColor, statusLabel, formatDate } from '../utils/formatters'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { useDocumentTitle } from '../utils/useDocumentTitle'
import PageHeader from '../components/layout/PageHeader'
import { Filter, LoaderCircle, LocateFixed, MapPin } from 'lucide-react'
import { formatLocationAccuracy, getLocationErrorMessage, requestCurrentLocation, type LocationPoint } from '../utils/geolocation'
import { reverseGeocode } from '../services/reverseGeocoding'
import { filterMapReports, initialMapFilter, reportMapFilters } from '../utils/reportFilters'

const center = { lat: 42.316, lng: 69.605 }

function FixMapView() {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
  }, [map])
  return null
}

function ShowCurrentLocation({ point }: { point: LocationPoint }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([point.latitude, point.longitude], 16, { animate: true, duration: 0.7 })
  }, [map, point])
  return null
}

function severityIcon(severity: CityReport['severity'], category: string) {
  const isTrash = category === 'Мусор'
  const color = isTrash ? '#059669' : severity === 'critical' || severity === 'high' ? '#dc2626' : severity === 'medium' ? '#f59e0b' : '#10b981'
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:${isTrash ? 34 : 28}px;height:${isTrash ? 34 : 28}px;display:flex;align-items:center;justify-content:center;background:${color};color:white;border-radius:9999px;box-shadow:0 3px 10px rgba(15,23,42,0.28);border:3px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${isTrash ? '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/>' : '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'}</svg></div>`,
    iconSize: [isTrash ? 34 : 28, isTrash ? 34 : 28],
    iconAnchor: [isTrash ? 17 : 14, isTrash ? 17 : 14],
    popupAnchor: [0, -16],
  })
}

export default function MapPage() {
  useDocumentTitle('QalaFix AI — Карта')
  const [searchParams] = useSearchParams()
  const [reports] = useState<CityReport[]>(() => loadReports())
  const [filter, setFilter] = useState(() => initialMapFilter(searchParams.get('category')))
  const [userLocation, setUserLocation] = useState<LocationPoint | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const [userAddress, setUserAddress] = useState('')
  const [locationFailed, setLocationFailed] = useState(false)

  async function locateUser() {
    setLocating(true)
    setLocationMessage('')
    setLocationFailed(false)
    try {
      const point = await requestCurrentLocation()
      setUserLocation(point)
      setLocationMessage('Местоположение найдено. Определяем улицу…')
      try {
        const exactAddress = await reverseGeocode(point)
        setUserAddress(exactAddress)
        setLocationMessage(`${exactAddress} · точность ±${Math.max(1, Math.round(point.accuracy))} м`)
      } catch {
        setUserAddress('')
        setLocationMessage(formatLocationAccuracy(point.accuracy))
      }
    } catch (locationError) {
      setLocationFailed(true)
      setLocationMessage(getLocationErrorMessage(locationError))
    } finally {
      setLocating(false)
    }
  }

  const filtered = useMemo(() => filterMapReports(reports, filter), [reports, filter])

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      <PageHeader title="Карта проблем" action={<button type="button" disabled={locating} onClick={locateUser} aria-label="Определить моё местоположение" className="flex h-11 min-w-11 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-60">{locating ? <LoaderCircle className="animate-spin" size={20} /> : <LocateFixed size={20} />}</button>} />
      <div className="mb-4 hidden md:flex md:items-end md:justify-between">
        <div><h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Карта городских проблем</h1><p className="mt-1 text-sm text-slate-500">Мусор — в фокусе, остальные обращения остаются доступными</p></div>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">{filtered.length} на карте</span>
      </div>

      <div className="-mx-4 md:mx-0 md:rounded-[18px] md:border md:border-slate-200 md:bg-white md:p-4 md:shadow-[0_4px_18px_rgba(15,23,42,0.045)]">
        <div className="mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:flex-wrap md:px-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"><Filter size={16} /></span>
            {reportMapFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-label={`Фильтр: ${f.label}`}
                className={`min-h-9 shrink-0 rounded-xl border px-3 text-[11px] font-semibold transition-colors ${
                  filter === f.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200'
                }`}
              >
                {f.label}
              </button>
            ))}
        </div>

        <div className="mb-3 flex items-center justify-between gap-3 px-4 md:px-0">
          <p role="status" aria-live="polite" className={`min-h-5 text-xs font-semibold ${locationFailed ? 'text-red-600' : 'text-emerald-700'}`}>{locationMessage}</p>
          <button type="button" disabled={locating} onClick={locateUser} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 disabled:opacity-60">
            {locating ? <LoaderCircle className="animate-spin" size={16} /> : <LocateFixed size={16} />} {locating ? 'Определяем…' : 'Где я'}
          </button>
        </div>

        <div className="relative h-[60dvh] min-h-[430px] w-full overflow-hidden border-y border-slate-200 md:h-[560px] md:rounded-[18px] md:border">
          <ErrorBoundary fallback={<div className="flex h-full items-center justify-center text-sm text-slate-500">Карта временно недоступна</div>}>
            {reports.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Нет обращений для отображения</div>
            ) : (
              <MapContainer center={[center.lat, center.lng]} zoom={12} className="h-full w-full" scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FixMapView />
            {userLocation && <>
              <ShowCurrentLocation point={userLocation} />
              <CircleMarker center={[userLocation.latitude, userLocation.longitude]} radius={10} pathOptions={{ color: '#ffffff', weight: 4, fillColor: '#2563eb', fillOpacity: 1 }}>
                <Tooltip permanent direction="top" offset={[0, -12]}>{userAddress || 'Вы здесь'}</Tooltip>
              </CircleMarker>
            </>}
            {filtered.map((r) => (
              <Marker
                key={r.id}
                position={[r.latitude, r.longitude]}
                icon={severityIcon(r.severity, r.category)}
              >
                <Popup>
                  <div className="min-w-[200px] text-sm">
                    <div className="font-semibold text-slate-900">{r.title}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${severityColor(r.severity)}`}>
                        {severityLabel(r.severity)}
                      </span>
                      <span className="text-xs text-slate-500">{statusLabel(r.status)}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">{r.address}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDate(r.createdAt)}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          )}
        </ErrorBoundary>
          {filtered[0] && (
            <div className="absolute inset-x-3 bottom-3 z-[500] rounded-[16px] border border-white/80 bg-white/95 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.18)] backdrop-blur md:hidden">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-emerald-50 text-emerald-600"><MapPin size={21} /></span>
                <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-bold text-slate-950">{filtered[0].title}</p><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${severityColor(filtered[0].severity)}`}>{severityLabel(filtered[0].severity)}</span></div><p className="mt-1 truncate text-[11px] text-slate-500">{filtered[0].address}</p><p className="mt-2 text-[10px] font-semibold text-emerald-700">{statusLabel(filtered[0].status)} · {formatDate(filtered[0].createdAt)}</p></div>
              </div>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="mt-4 hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 9).map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{r.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{r.category}</div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${severityColor(r.severity)}`}>
                    {severityLabel(r.severity)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                  <span>{r.address}</span>
                  <span className="text-slate-400">{formatDate(r.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 pt-3 text-[11px] text-slate-500 md:px-0">Показано {filtered.length} из {reports.length} обращений · адрес определяется через © OpenStreetMap только после нажатия «Где я»</div>
      </div>
    </div>
  )
}
