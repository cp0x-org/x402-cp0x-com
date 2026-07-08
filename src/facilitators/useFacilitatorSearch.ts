import { ref } from 'vue';
import type { Ref } from 'vue';
import type { FacilitatorConfig, FacilitatorSearchStatus, SearchHit } from './types';
import { searchX402Resources } from './api';

// Facilitators cap page sizes differently (CDP allows at most 20); the proxy
// clamps further, but don't ask for more than is broadly supported.
const SEARCH_LIMIT = 20;

export function errorMessage(err: unknown): string {
  if (err instanceof DOMException && err.name === 'TimeoutError') return 'request timed out';
  if (err instanceof Error && err.message) return err.message;
  return 'request failed';
}

// Fans a search query out to every facilitator in parallel; each facilitator
// reports its own status so unsupported/unreachable ones only degrade the
// result set instead of failing the whole search.
export function useFacilitatorSearch(facilitators: Ref<FacilitatorConfig[]>) {
  const searching = ref(false);
  const searched = ref(false);
  const lastQuery = ref('');
  const results = ref<SearchHit[]>([]);
  const statuses = ref<FacilitatorSearchStatus[]>([]);
  let runId = 0;

  async function run(query: string): Promise<void> {
    const q = query.trim();
    if (!q || searching.value) return;
    const id = ++runId;
    const targets = facilitators.value;

    searching.value = true;
    searched.value = true;
    lastQuery.value = q;
    results.value = [];
    statuses.value = targets.map((facilitator) => ({ facilitator, phase: 'searching', count: 0 }));

    await Promise.all(
      targets.map(async (facilitator, index) => {
        try {
          const res = await searchX402Resources(facilitator.id, q, { limit: SEARCH_LIMIT });
          if (id !== runId) return;
          statuses.value[index] = {
            facilitator,
            phase: 'done',
            count: res.resources.length,
            partial: res.partialResults,
          };
          results.value = [...results.value, ...res.resources.map((r) => ({ ...r, facilitator }))];
        } catch (err) {
          if (id !== runId) return;
          statuses.value[index] = { facilitator, phase: 'failed', count: 0, error: errorMessage(err) };
        }
      }),
    );

    if (id === runId) searching.value = false;
  }

  return { searching, searched, lastQuery, results, statuses, run };
}
