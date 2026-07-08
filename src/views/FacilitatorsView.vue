<template>
  <div class="facilitators-page">
    <div class="facilitators-page__container">
      <header class="facilitators-page__hero">
        <h1 class="facilitators-page__title">x402 Facilitators</h1>
        <p class="facilitators-page__lead">
          Facilitators verify and settle x402 payments and index paid services. Browse the known
          facilitators below or search for services across all of them at once.
        </p>
      </header>

      <section v-if="facilitators.length" class="facilitators-page__section">
        <FacilitatorSearch :facilitators="facilitators" placeholder="Search services across all facilitators…" />
      </section>

      <section class="facilitators-page__section">
        <p v-if="listLoading" class="facilitators-page__loading">Loading facilitators…</p>

        <div v-else-if="listError" class="facilitators-page__error">
          <p>Could not load the facilitator list: {{ listError }}.</p>
          <button type="button" class="facilitators-page__retry" @click="loadList">Retry</button>
        </div>

        <p v-else-if="!facilitators.length" class="facilitators-page__empty">
          No facilitators configured. Add them to the <code>facilitators-proxy</code> config to populate this page.
        </p>

        <div v-else class="facilitators-page__grid">
          <router-link
            v-for="facilitator in facilitators"
            :key="facilitator.id"
            :to="`/facilitators/${facilitator.id}`"
            class="facilitator-card"
          >
            <div class="facilitator-card__head">
              <h2 class="facilitator-card__name">{{ facilitator.name }}</h2>
              <span
                class="facilitator-card__status"
                :class="`facilitator-card__status--${healthOf(facilitator.id).status}`"
                :title="healthOf(facilitator.id).error"
              >
                <span class="facilitator-card__status-dot"></span>
                {{ statusLabel(healthOf(facilitator.id).status) }}
              </span>
            </div>
            <a
              :href="facilitator.url"
              target="_blank"
              rel="noopener"
              class="facilitator-card__url"
              :title="facilitator.url"
              @click.stop
            >{{ facilitator.url }}</a>
            <div class="facilitator-card__count">
              <template v-if="healthOf(facilitator.id).status === 'checking'">checking services…</template>
              <template v-else-if="healthOf(facilitator.id).status === 'active'">
                {{ healthOf(facilitator.id).countLabel }} services
              </template>
              <template v-else>services unavailable</template>
            </div>
          </router-link>
        </div>
      </section>

      <section class="facilitators-page__section facilitators-page__faq">
        <h2 class="facilitators-page__faq-title">FAQ</h2>

        <details class="faq-item">
          <summary class="faq-item__q">How does searching for services work?</summary>
          <div class="faq-item__a">
            <p>
              Search is <strong>semantic</strong>: your query is sent to each facilitator's
              <code>/discovery/search</code> endpoint, which returns the most relevant services ranked by
              meaning rather than exact text matches, along with a <code>partialResults</code> flag telling
              you whether the response was truncated.
            </p>
            <p>
              Search results are <strong>not paginated</strong> — the endpoint returns a single capped set of
              top matches, so there are no pages to browse. If a facilitator reports partial results, refine
              your query to get more specific matches instead of expecting a “next page”.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-item__q">Why do some facilitators show “failed / unsupported” when I search?</summary>
          <div class="faq-item__a">
            <p>
              Not every facilitator implements the discovery endpoints. When one doesn't support
              <code>/discovery/search</code> (or is temporarily unreachable), it is marked
              <strong>failed / unsupported</strong> and simply contributes no results. The rest of the search
              still works and partial results from the supported facilitators are shown as usual.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-item__q">How is browsing a facilitator's resources different from search?</summary>
          <div class="faq-item__a">
            <p>
              Opening a facilitator lists its full catalog via <code>/discovery/resources</code>. Unlike search,
              this listing <strong>is paginated</strong> — you can page through all resources and choose how many
              to load per page (20–1000). Note that some facilitators ignore the page parameters and return their
              whole list at once; the UI handles that gracefully.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-item__q">How does sorting by calls / payers work?</summary>
          <div class="faq-item__a">
            <p>
              Facilitators don't accept any sort parameter, so sorting happens
              <strong>client-side on the data already fetched</strong> for the current page. That means the order
              is computed only from the resources currently loaded — each page is sorted independently, and the
              ranking by calls (30d) or unique payers (30d) is not global across the whole catalog.
            </p>
            <p>
              Load a larger page size if you want the sort to consider more resources at once. Items without
              activity data sink to the bottom.
            </p>
          </div>
        </details>
      </section>
    </div>

    <section class="facilitators-page__footer">
      <FooterSection />
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import FooterSection from '@/sections/FooterSection.vue';
import FacilitatorSearch from '@/components/facilitators/FacilitatorSearch.vue';
import { fetchFacilitatorResources } from '@/facilitators/api';
import { loadFacilitators } from '@/facilitators/facilitators';
import { errorMessage } from '@/facilitators/useFacilitatorSearch';
import type { FacilitatorConfig } from '@/facilitators/types';

const STATUS_PROBE_LIMIT = 20;

type HealthStatus = 'checking' | 'active' | 'inactive';

interface FacilitatorHealth {
  status: HealthStatus;
  countLabel?: string;
  error?: string;
}

const facilitators = ref<FacilitatorConfig[]>([]);
const listLoading = ref(true);
const listError = ref('');
const health = reactive<Record<string, FacilitatorHealth>>({});

function healthOf(id: string): FacilitatorHealth {
  return health[id] ?? { status: 'checking' };
}

function statusLabel(status: HealthStatus): string {
  if (status === 'checking') return 'checking…';
  return status;
}

async function check(facilitator: FacilitatorConfig) {
  try {
    const page = await fetchFacilitatorResources(facilitator.id, { limit: STATUS_PROBE_LIMIT, offset: 0 });
    const total = page.pagination?.total;
    const countLabel =
      total !== undefined
        ? total.toLocaleString()
        : page.items.length >= STATUS_PROBE_LIMIT
          ? `${STATUS_PROBE_LIMIT}+`
          : String(page.items.length);
    health[facilitator.id] = { status: 'active', countLabel };
  } catch (err) {
    health[facilitator.id] = { status: 'inactive', error: errorMessage(err) };
  }
}

async function loadList() {
  listLoading.value = true;
  listError.value = '';
  try {
    facilitators.value = await loadFacilitators();
    for (const facilitator of facilitators.value) {
      health[facilitator.id] = { status: 'checking' };
      void check(facilitator);
    }
  } catch (err) {
    listError.value = errorMessage(err);
  } finally {
    listLoading.value = false;
  }
}

onMounted(loadList);
</script>

<style scoped lang="scss">
@use '@/scss/vars' as *;

.facilitators-page {
  min-height: 100vh;
  background: $background-dark;
  padding-top: 90px;

  @media screen and (max-width: 960px) {
    padding-top: 70px;
  }

  &__container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 56px 32px 96px;
    box-sizing: border-box;

    @media screen and (max-width: 960px) {
      padding: 32px 16px 80px;
    }
  }

  &__title {
    font-size: 44px;
    font-weight: 700;
    margin: 0 0 20px;
    color: $color-font-white;
    line-height: 1.15;

    @media (max-width: 600px) {
      font-size: 32px;
    }
  }

  &__lead {
    font-size: 17px;
    color: $color-font-white2;
    line-height: 1.65;
    margin: 0;
    max-width: 720px;
  }

  &__hero {
    margin-bottom: 40px;
    padding-bottom: 32px;
    border-bottom: 1px solid $border-color-light;
  }

  &__section {
    margin-bottom: 48px;
  }

  &__loading {
    margin: 0;
    padding: 32px;
    text-align: center;
    color: #888;
    font-size: 14px;
  }

  &__error {
    padding: 24px;
    background: $background-color;
    border: 1px solid rgba(224, 85, 85, 0.5);
    border-radius: 12px;
    color: #e08585;
    font-size: 14px;

    p {
      margin: 0 0 14px;
    }
  }

  &__retry {
    background: transparent;
    border: 1px solid $border-color-hover;
    border-radius: 8px;
    color: $color-font-white;
    padding: 8px 20px;
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.15s;

    &:hover {
      border-color: $color-cp0x;
    }
  }

  &__empty {
    margin: 0;
    padding: 32px;
    text-align: center;
    color: #888;
    font-size: 14px;
    background: $background-color;
    border: 1px dashed $border-color;
    border-radius: 12px;

    code {
      background: $background-dark;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Space Mono', monospace;
      font-size: 13px;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  &__faq {
    border-top: 1px solid $border-color-light;
    padding-top: 40px;
  }

  &__faq-title {
    font-size: 26px;
    color: $color-font-white;
    margin: 0 0 20px;
  }

  &__footer {
    background: $background-dark;
  }
}

.faq-item {
  border: 1px solid $border-color;
  border-radius: 12px;
  background: $background-color;
  margin-bottom: 12px;
  overflow: hidden;

  &__q {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    font-size: 15px;
    font-weight: 600;
    color: $color-font-white;
    cursor: pointer;
    list-style: none;
    user-select: none;

    &::-webkit-details-marker {
      display: none;
    }

    &::before {
      content: '+';
      font-family: 'Space Mono', monospace;
      font-size: 18px;
      color: $color-cp0x;
      line-height: 1;
      transition: transform 0.15s;
    }
  }

  &[open] &__q::before {
    content: '−';
  }

  &__a {
    padding: 0 20px 18px 42px;
    color: #b8b8b8;
    font-size: 14px;
    line-height: 1.65;

    p {
      margin: 0 0 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    strong {
      color: $color-font-white2;
    }

    code {
      background: $background-dark;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Space Mono', monospace;
      font-size: 12.5px;
      color: $color-cp0x;
    }
  }
}

.facilitator-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: $background-color;
  border: 1px solid $border-color;
  border-radius: 12px;
  padding: 22px 24px;
  text-decoration: none;
  min-width: 0;
  transition: border-color 0.15s;

  &:hover {
    border-color: $color-cp0x;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__name {
    margin: 0;
    font-size: 20px;
    color: $color-font-white;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #888;
    border: 1px solid $border-color;
    border-radius: 999px;
    padding: 3px 10px;
    background: $background-dark;

    &-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #888;
    }

    &--checking &-dot {
      background: $color-cp0x;
      animation: facilitator-pulse 1s ease-in-out infinite;
    }

    &--active {
      color: #3ecf6a;

      .facilitator-card__status-dot {
        background: #3ecf6a;
      }
    }

    &--inactive {
      color: #e05555;

      .facilitator-card__status-dot {
        background: #e05555;
      }
    }
  }

  &__url {
    color: $color-cp0x;
    text-decoration: none;
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      text-decoration: underline;
    }
  }

  &__count {
    color: #b8b8b8;
    font-size: 14px;
  }
}

@keyframes facilitator-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
