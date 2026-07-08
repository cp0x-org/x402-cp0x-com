interface RuntimeEnv {
  FACILITATORS_API_URL?: string;
  CP0X_SERVICES_API_URL?: string;
}

declare global {
  interface Window {
    _env_?: RuntimeEnv;
  }
}

const env: RuntimeEnv = window._env_ ?? {};

/** Trims and strips trailing slashes; empty string means "same origin". */
function normalizeBase(value: unknown): string {
  return (typeof value === 'string' ? value : '').trim().replace(/\/+$/, '');
}

// Base URL of facilitators-proxy (the facilitator list + discovery proxy).
// Empty means same origin (nginx routes /api/); set e.g. 'http://localhost:8090'
// for local development.
export const facilitatorsApiUrl = normalizeBase(env.FACILITATORS_API_URL);

// Base URL of the cp0x x402 API that serves our own paid resources
// (/api/free/cp0x-resources). Separate from the facilitators proxy so the two
// can live on different hosts; falls back to FACILITATORS_API_URL when unset.
export const cp0xServicesApiUrl = normalizeBase(env.CP0X_SERVICES_API_URL ?? env.FACILITATORS_API_URL);
