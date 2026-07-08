import { fetchFacilitators } from './api';
import type { FacilitatorConfig } from './types';

// The facilitator list lives on facilitators-proxy and changes only on server
// restart, so one fetch per page load is enough. The in-flight promise is
// shared between callers; a failure clears it so the next call retries.
let pending: Promise<FacilitatorConfig[]> | null = null;

export function loadFacilitators(): Promise<FacilitatorConfig[]> {
  if (!pending) {
    pending = fetchFacilitators().catch((err) => {
      pending = null;
      throw err;
    });
  }
  return pending;
}
