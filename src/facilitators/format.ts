// Shared display formatting for resource/quality data, used by both the search
// results table and the facilitator resource list.

import type { FacilitatorResource } from './types';

export interface ActivityLine {
  label: string;
  value: string;
}

/** Locale date string, or '' when the value is missing or unparseable. */
export function formatDate(raw?: string): string {
  if (!raw) return '';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

// Number of calls / unique payers in the last 30 days; only present on some
// facilitators' items, so missing fields are skipped rather than shown blank.
export function callsLast30Days(resource: FacilitatorResource): number | undefined {
  const v = resource.quality?.l30DaysTotalCalls;
  return typeof v === 'number' ? v : undefined;
}

export function payersLast30Days(resource: FacilitatorResource): number | undefined {
  const v = resource.quality?.l30DaysUniquePayers;
  return typeof v === 'number' ? v : undefined;
}

/**
 * Activity lines from `quality` (+ optionally the resource's own lastUpdated).
 * Returns an empty array when nothing is available.
 */
export function buildActivity(resource: FacilitatorResource, includeUpdated = false): ActivityLine[] {
  const lines: ActivityLine[] = [];

  const calls = callsLast30Days(resource);
  if (calls !== undefined) lines.push({ label: 'calls 30d', value: calls.toLocaleString() });

  const payers = payersLast30Days(resource);
  if (payers !== undefined) lines.push({ label: 'payers 30d', value: payers.toLocaleString() });

  const lastCalled = formatDate(resource.quality?.lastCalledAt);
  if (lastCalled) lines.push({ label: 'last call', value: lastCalled });

  if (includeUpdated) {
    const updated = formatDate(resource.lastUpdated);
    if (updated) lines.push({ label: 'updated', value: updated });
  }

  return lines;
}
