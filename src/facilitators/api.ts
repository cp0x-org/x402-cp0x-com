// Client for the x402 facilitator discovery API. All requests go through
// facilitators-proxy (see facilitators-proxy/) because some facilitators do
// not send CORS headers; the proxy passes upstream responses through
// unchanged. Facilitators are third-party services with loosely compatible
// responses, so every value coming off the wire is validated here and
// malformed entries are dropped instead of thrown.

import { facilitatorsApiUrl } from '@/config';
import type {
  DiscoveryPagination,
  FacilitatorConfig,
  FacilitatorResource,
  PaymentInfo,
  ResourceQuality,
  ResourcesPage,
  SearchResult,
} from './types';

const REQUEST_TIMEOUT_MS = 25_000;

/** Trims, prepends https:// when the scheme is missing and strips trailing slashes. */
export function normalizeFacilitatorUrl(raw: string): string {
  let url = (raw ?? '').trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, '');
}

/** Hostname of a URL, or the input itself when it is not parseable. */
export function safeUrlHostname(raw: string): string {
  try {
    return new URL(raw).hostname;
  } catch {
    return raw;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new Error('invalid JSON response');
  }
}

function parseQuality(value: unknown): ResourceQuality | undefined {
  if (!isRecord(value)) return undefined;
  return {
    l30DaysTotalCalls: asNumber(value.l30DaysTotalCalls),
    l30DaysUniquePayers: asNumber(value.l30DaysUniquePayers),
    lastCalledAt: asString(value.lastCalledAt),
  };
}

// OpenFacilitator (older format) reports activity as `trustScore.{calls,lastCalled}`
// instead of `quality`; map what lines up with the quality shape the UI expects.
function parseTrustScore(value: unknown): ResourceQuality | undefined {
  if (!isRecord(value)) return undefined;
  const calls = asNumber(value.calls);
  const lastCalledAt = asString(value.lastCalled);
  if (calls === undefined && !lastCalledAt) return undefined;
  return { l30DaysTotalCalls: calls, lastCalledAt };
}

// The x402 `accepts` array. OpenFacilitator's older format carries a single
// `paymentRequirements` object instead, so wrap it into a one-element array.
function normalizeAccepts(value: Record<string, unknown>): unknown[] | undefined {
  if (Array.isArray(value.accepts)) return value.accepts;
  if (isRecord(value.paymentRequirements)) return [value.paymentRequirements];
  return undefined;
}

function parseResource(value: unknown): FacilitatorResource | null {
  if (!isRecord(value)) return null;
  // Newer facilitators use `resource`; OpenFacilitator's older format uses `url`.
  const resource = asString(value.resource) ?? asString(value.url);
  if (!resource) return null;
  return {
    resource,
    type: asString(value.type),
    description: asString(value.description),
    method: asString(value.method),
    x402Version: asNumber(value.x402Version),
    accepts: normalizeAccepts(value),
    lastUpdated: asString(value.lastUpdated),
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
    serviceName: asString(value.serviceName) ?? asString(value.name),
    tags: Array.isArray(value.tags) ? value.tags.filter((t): t is string => typeof t === 'string') : undefined,
    quality: parseQuality(value.quality) ?? parseTrustScore(value.trustScore),
  };
}

function parseResourceList(value: unknown): FacilitatorResource[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseResource).filter((r): r is FacilitatorResource => r !== null);
}

function parsePagination(value: unknown): DiscoveryPagination | undefined {
  if (!isRecord(value)) return undefined;
  const limit = asNumber(value.limit);
  const offset = asNumber(value.offset);
  const total = asNumber(value.total);
  if (limit === undefined || offset === undefined || total === undefined) return undefined;
  return { limit, offset, total };
}

function facilitatorEndpoint(facilitatorId: string, suffix: string): string {
  return `${facilitatorsApiUrl}/api/free/facilitators/${encodeURIComponent(facilitatorId)}${suffix}`;
}

/** GET /api/free/facilitators — the facilitator list configured on the proxy. */
export async function fetchFacilitators(): Promise<FacilitatorConfig[]> {
  const data = await fetchJson(`${facilitatorsApiUrl}/api/free/facilitators`);
  if (!Array.isArray(data)) throw new Error('unexpected response shape');
  const result: FacilitatorConfig[] = [];
  for (const entry of data) {
    if (!isRecord(entry)) continue;
    const id = asString(entry.id);
    const url = asString(entry.url);
    if (!id || !url) continue;
    result.push({ id, name: asString(entry.name) ?? safeUrlHostname(url), url });
  }
  return result;
}

/** Proxied <facilitator>/discovery/resources?limit=&offset= — a page of the facilitator's catalog. */
export async function fetchFacilitatorResources(
  facilitatorId: string,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<ResourcesPage> {
  const data = await fetchJson(facilitatorEndpoint(facilitatorId, `/resources?limit=${limit}&offset=${offset}`));
  if (!isRecord(data)) throw new Error('unexpected response shape');
  return {
    // Newer facilitators return `items`; OpenFacilitator's older format uses `resources`.
    items: parseResourceList(data.items ?? data.resources),
    pagination: parsePagination(data.pagination),
  };
}

/** Proxied <facilitator>/discovery/search?query=&limit= — not supported by all facilitators. */
export async function searchX402Resources(
  facilitatorId: string,
  query: string,
  { limit = 50 }: { limit?: number } = {},
): Promise<SearchResult> {
  const data = await fetchJson(facilitatorEndpoint(facilitatorId, `/search?query=${encodeURIComponent(query)}&limit=${limit}`));
  if (!isRecord(data)) throw new Error('unexpected response shape');
  return {
    resources: parseResourceList(data.resources),
    partialResults: data.partialResults === true,
  };
}

/** Human-readable service name: explicit field, metadata, or the resource's hostname. */
export function extractServiceName(resource: FacilitatorResource): string {
  if (resource.serviceName) return resource.serviceName;
  if (resource.metadata) {
    for (const key of ['serviceName', 'name', 'title']) {
      const value = asString(resource.metadata[key]);
      if (value) return value;
    }
  }
  return safeUrlHostname(resource.resource);
}

// Amounts in `accepts` come as atomic units (`maxAmountRequired` in x402 v1,
// `amount` in CDP v2) with the token described in `extra`; decimals are only
// sometimes present, so fall back to the well-known 6 for USD stablecoins and
// otherwise show the raw value. `price` is already human-readable.
function formatAtomicAmount(raw: string, decimals: number): string {
  if (decimals <= 0) return raw;
  const padded = raw.padStart(decimals + 1, '0');
  const whole = padded.slice(0, -decimals);
  const frac = padded.slice(-decimals).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}

function extractAcceptAmount(accept: Record<string, unknown>): string | undefined {
  const extra = isRecord(accept.extra) ? accept.extra : undefined;
  const symbol = asString(extra?.name) ?? asString(extra?.symbol);

  const price = asString(accept.price);
  if (price) return symbol ? `${price} ${symbol}` : price;

  const raw = accept.amount ?? accept.maxAmountRequired;
  const rawStr = typeof raw === 'number' ? String(raw) : asString(raw);
  if (!rawStr) return undefined;
  if (!/^\d+$/.test(rawStr)) return symbol ? `${rawStr} ${symbol}` : rawStr;

  let decimals = asNumber(extra?.decimals);
  if (decimals === undefined && symbol && /usd/i.test(symbol)) decimals = 6;
  const value = decimals !== undefined ? formatAtomicAmount(rawStr, decimals) : rawStr;
  return symbol ? `${value} ${symbol}` : value;
}

/** network / scheme / amount for each usable entry of `accepts`, deduplicated. */
export function extractPaymentInfo(resource: FacilitatorResource): PaymentInfo[] {
  if (!Array.isArray(resource.accepts)) return [];
  const seen = new Set<string>();
  const infos: PaymentInfo[] = [];
  for (const accept of resource.accepts) {
    if (!isRecord(accept)) continue;
    const info: PaymentInfo = {
      network: asString(accept.network),
      scheme: asString(accept.scheme),
      amount: extractAcceptAmount(accept),
    };
    if (!info.network && !info.scheme && !info.amount) continue;
    const key = `${info.network}|${info.scheme}|${info.amount}`;
    if (seen.has(key)) continue;
    seen.add(key);
    infos.push(info);
  }
  return infos;
}

// Friendly names for common CAIP-2 network ids so the UI never shows raw refs
// like "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp".
const NETWORK_NAMES: Record<string, string> = {
  'eip155:1': 'Ethereum',
  'eip155:10': 'Optimism',
  'eip155:56': 'BNB Chain',
  'eip155:137': 'Polygon',
  'eip155:8453': 'Base',
  'eip155:84532': 'Base Sepolia',
  'eip155:42161': 'Arbitrum',
  'eip155:43114': 'Avalanche',
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'Solana',
  'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': 'Solana Devnet',
  'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z': 'Solana Testnet',
};

/** Human-readable network name for a CAIP-2 id; never returns the raw reference. */
export function networkName(id?: string): string | undefined {
  if (!id) return undefined;
  const known = NETWORK_NAMES[id];
  if (known) return known;
  const [namespace, reference] = id.split(':');
  if (namespace === 'solana') return 'Solana';
  if (namespace === 'eip155' && reference) return `Chain ${reference}`;
  return namespace ? namespace.charAt(0).toUpperCase() + namespace.slice(1) : id;
}
