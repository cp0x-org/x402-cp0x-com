// Types for this API's own paid x402 catalog (GET /api/free/cp0x-resources).
// The response mirrors a facilitator discovery response, but is built from the
// backend's x402 pricing config (see internal/handler/cp0x). Every field except
// `resource` is treated as optional and validated at the fetch boundary.

export interface Cp0xResource {
  /** Full, directly callable URL of the paid endpoint. */
  resource: string;
  type?: string;
  x402Version?: number;
  name?: string;
  description?: string;
  tags?: string[];
  /** Human-readable price, e.g. "$0.005". */
  price?: string;
}

export interface Cp0xResourcesPage {
  x402Version?: number;
  items: Cp0xResource[];
  total: number;
}
