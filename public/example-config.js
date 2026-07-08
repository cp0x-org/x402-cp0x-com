window._env_ = {
  // Base URL of facilitators-proxy (the facilitator list lives in its config).
  // Leave empty when the proxy is reachable on the same origin under /api/
  // (docker-compose + nginx do this); set e.g. 'http://localhost:8090' in dev.
  FACILITATORS_API_URL: '',
  // Base URL of the cp0x x402 API serving our own paid resources
  // (/api/free/cp0x-resources), shown on the Resources (cp0x) page. Can point to
  // a different host than the facilitators proxy; falls back to
  // FACILITATORS_API_URL when left empty.
  CP0X_SERVICES_API_URL: '',
};
