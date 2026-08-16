export type ReportStatus = 'new' | 'review' | 'in_progress' | 'resolved'

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export type AnalysisSource = 'local-model' | 'demo-fallback' | 'manual'

export type ModelClass = 'trash' | 'manhole' | 'pothole' | 'water_leak' | 'broken_bench' | 'other'

export type TrashSubtype = 'scattered_litter' | 'garbage_bags' | 'overflowing_bin' | 'waste_pile' | 'illegal_dump' | 'single_litter'

export interface CityReport {
  id: string
  category: string
  title: string
  description: string
  severity: Severity
  status: ReportStatus
  latitude: number
  longitude: number
  address: string
  createdAt: string
  confidence?: number
  duplicateCount?: number
  analysisSource?: AnalysisSource
}

export interface AnalysisResult {
  title: string
  category: string
  severity: Severity
  description: string
  confidence: number
  recommendedService: string
  source: AnalysisSource
  modelClass: ModelClass
  trashSubtype?: TrashSubtype
  needsReview: boolean
}

export interface DemoScenario {
  id: string
  title: string
  description: string
  category: string
  severity: Severity
  confidence: number
  recommendedService: string
  imageHint: string
}
