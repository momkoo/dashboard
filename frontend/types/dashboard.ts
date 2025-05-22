// Types for the dashboard components

export type WebSourceStatus = "active" | "error" | "processing" | "paused"

export interface WebSource {
  id: string
  name: string
  url: string
  status: WebSourceStatus
  lastCollected: string
  fields?: string[]
}

export interface CollectedData {
  id: string
  [key: string]: any
}
