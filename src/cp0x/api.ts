// Client for this API's own paid x402 catalog. GET /api/free/cp0x-resources is
// served by the backend (see internal/handler/cp0x) and, like the facilitator
// proxy, goes through the same origin (nginx routes /api/) or cp0xServicesApiUrl
// in local development. Values are validated here and malformed entries dropped.

import { cp0xServicesApiUrl } from '@/config';
import type { Cp0xResource, Cp0xResourcesPage } from './types';

const REQUEST_TIMEOUT_MS = 25_000;

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

function parseResource(value: unknown): Cp0xResource | null {
  if (!isRecord(value)) return null;
  const resource = asString(value.resource);
  if (!resource) return null;
  return {
    resource,
    type: asString(value.type),
    x402Version: asNumber(value.x402Version),
    name: asString(value.name),
    description: asString(value.description),
    tags: Array.isArray(value.tags) ? value.tags.filter((t): t is string => typeof t === 'string') : undefined,
    price: asString(value.price),
  };
}

/** GET /api/free/cp0x-resources — this API's own paid x402 endpoints. */
export async function fetchCp0xResources(): Promise<Cp0xResourcesPage> {
  const data = await fetchJson(`${cp0xServicesApiUrl}/api/free/cp0x-resources`);
  if (!isRecord(data)) throw new Error('unexpected response shape');
  const items = Array.isArray(data.items)
    ? data.items.map(parseResource).filter((r): r is Cp0xResource => r !== null)
    : [];
  const total = isRecord(data.pagination) ? asNumber(data.pagination.total) ?? items.length : items.length;
  return { x402Version: asNumber(data.x402Version), items, total };
}
