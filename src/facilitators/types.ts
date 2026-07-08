// Types for the x402 facilitator discovery API (/discovery/resources, /discovery/search).
// Responses vary between facilitators, so every field except `resource` is optional
// and everything is validated at the fetch boundary (see api.ts).

export interface FacilitatorConfig {
  /** URL-safe identifier used in /facilitators/:id routes. */
  id: string;
  name: string;
  /** Normalized base URL without a trailing slash. */
  url: string;
}

export interface DiscoveryPagination {
  limit: number;
  offset: number;
  total: number;
}

export interface ResourceQuality {
  l30DaysTotalCalls?: number;
  l30DaysUniquePayers?: number;
  lastCalledAt?: string;
}

export interface FacilitatorResource {
  resource: string;
  type?: string;
  description?: string;
  method?: string;
  x402Version?: number;
  accepts?: unknown[];
  lastUpdated?: string;
  metadata?: Record<string, unknown>;
  // Fields returned by /discovery/search only.
  serviceName?: string;
  tags?: string[];
  quality?: ResourceQuality;
}

export interface ResourcesPage {
  items: FacilitatorResource[];
  pagination?: DiscoveryPagination;
}

export interface SearchResult {
  resources: FacilitatorResource[];
  partialResults: boolean;
}

/** network / scheme / amount extracted from one entry of `accepts`. */
export interface PaymentInfo {
  network?: string;
  scheme?: string;
  amount?: string;
}

export type SearchPhase = 'searching' | 'done' | 'failed';

export interface FacilitatorSearchStatus {
  facilitator: FacilitatorConfig;
  phase: SearchPhase;
  count: number;
  partial?: boolean;
  error?: string;
}

/** A search hit annotated with the facilitator it came from. */
export interface SearchHit extends FacilitatorResource {
  facilitator: FacilitatorConfig;
}
