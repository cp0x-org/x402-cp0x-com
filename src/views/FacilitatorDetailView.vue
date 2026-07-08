<template>
  <div class="facilitator-page">
    <div class="facilitator-page__container">
      <router-link to="/" class="facilitator-page__back">← All facilitators</router-link>

      <template v-if="listLoading">
        <p class="facilitator-page__loading">Loading facilitator…</p>
      </template>

      <template v-else-if="listError">
        <div class="facilitator-page__error">
          <p>Could not load the facilitator list: {{ listError }}.</p>
          <button type="button" class="facilitator-page__retry" @click="init">Retry</button>
        </div>
      </template>

      <template v-else-if="!facilitator">
        <p class="facilitator-page__empty">
          Facilitator not found. It may have been removed from the configuration.
        </p>
      </template>

      <template v-else>
        <header class="facilitator-page__hero">
          <div class="facilitator-page__head">
            <h1 class="facilitator-page__title">{{ facilitator.name }}</h1>
            <span
              class="facilitator-page__status"
              :class="`facilitator-page__status--${status}`"
              :title="error"
            >
              <span class="facilitator-page__status-dot"></span>
              {{ status === 'checking' ? 'checking…' : status }}
            </span>
          </div>
          <a
            :href="facilitator.url"
            target="_blank"
            rel="noopener"
            class="facilitator-page__url"
            :title="facilitator.url"
          >{{ facilitator.url }}</a>
          <p v-if="totalLabel" class="facilitator-page__count">{{ totalLabel }}</p>
        </header>

        <section class="facilitator-page__section">
          <h2 class="facilitator-page__section-title">Search this facilitator</h2>
          <FacilitatorSearch
            :facilitators="[facilitator]"
            :placeholder="`Search services on ${facilitator.name}…`"
          />
        </section>

        <section class="facilitator-page__section">
          <div class="facilitator-page__section-head">
            <h2 class="facilitator-page__section-title">Services</h2>

            <div v-if="loaded && !error && items.length" class="facilitator-page__toolbar">
              <label class="facilitator-page__sort">
                <span class="facilitator-page__sort-label">Sort</span>
                <select v-model="sortKey" class="facilitator-page__sort-select">
                  <option value="default">Default order</option>
                  <option value="calls30d">Most calls (30d)</option>
                  <option value="payers30d">Most payers (30d)</option>
                </select>
              </label>

              <div class="facilitator-page__view" role="group" aria-label="View mode">
                <button
                  type="button"
                  class="facilitator-page__view-btn"
                  :class="{ 'is-active': viewMode === 'cards' }"
                  aria-label="Card view"
                  @click="viewMode = 'cards'"
                >
                  <IconLayoutGrid :size="18" />
                </button>
                <button
                  type="button"
                  class="facilitator-page__view-btn"
                  :class="{ 'is-active': viewMode === 'list' }"
                  aria-label="List view"
                  @click="viewMode = 'list'"
                >
                  <IconLayoutList :size="18" />
                </button>
              </div>
            </div>
          </div>

          <p v-if="loading" class="facilitator-page__loading">Loading resources…</p>

          <div v-else-if="error" class="facilitator-page__error">
            <p>Could not load resources from this facilitator: {{ error }}.</p>
            <button type="button" class="facilitator-page__retry" @click="load(offset)">Retry</button>
          </div>

          <p v-else-if="!items.length" class="facilitator-page__empty">
            This facilitator did not return any resources.
          </p>

          <template v-else>
            <p v-if="sortKey !== 'default'" class="facilitator-page__sort-note">
              Sorted within this page — activity data is not a query parameter, so ordering
              applies only to the {{ items.length }} currently loaded resources.
            </p>

            <div v-if="viewMode === 'cards'" class="facilitator-page__grid">
              <ResourceCard
                v-for="(item, index) in displayItems"
                :key="`${item.resource}-${index}`"
                :resource="item"
                :facilitator-name="facilitator.name"
              />
            </div>

            <div v-else class="facilitator-page__list">
              <ResourceListItem
                v-for="(item, index) in displayItems"
                :key="`${item.resource}-${index}`"
                :resource="item"
              />
            </div>

            <div v-if="showPager || items.length" class="facilitator-page__pager">
              <div class="facilitator-page__pager-nav">
                <button
                  type="button"
                  class="facilitator-page__pager-btn"
                  :disabled="!hasPrev || loading"
                  @click="load(Math.max(0, offset - pageStep))"
                >← Prev</button>
                <span class="facilitator-page__pager-info">{{ rangeLabel }}</span>
                <button
                  type="button"
                  class="facilitator-page__pager-btn"
                  :disabled="!hasNext || loading"
                  @click="load(offset + items.length)"
                >Next →</button>
              </div>

              <label class="facilitator-page__page-size">
                <span class="facilitator-page__page-size-label">Per page</span>
                <select v-model.number="pageSize" class="facilitator-page__page-size-select" :disabled="loading">
                  <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">{{ size }}</option>
                </select>
              </label>
            </div>
          </template>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { IconLayoutGrid, IconLayoutList } from '@tabler/icons-vue';
import FacilitatorSearch from '@/components/facilitators/FacilitatorSearch.vue';
import ResourceCard from '@/components/facilitators/ResourceCard.vue';
import ResourceListItem from '@/components/facilitators/ResourceListItem.vue';
import { fetchFacilitatorResources } from '@/facilitators/api';
import { loadFacilitators } from '@/facilitators/facilitators';
import { callsLast30Days, payersLast30Days } from '@/facilitators/format';
import { errorMessage } from '@/facilitators/useFacilitatorSearch';
import type { DiscoveryPagination, FacilitatorConfig, FacilitatorResource } from '@/facilitators/types';

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200, 500, 1000];
const DEFAULT_PAGE_SIZE = 20;
const VIEW_STORAGE_KEY = 'facilitator-resources-view';
const PAGE_SIZE_STORAGE_KEY = 'facilitator-resources-page-size';

type ViewMode = 'cards' | 'list';
type SortKey = 'default' | 'calls30d' | 'payers30d';

const route = useRoute();
const facilitator = ref<FacilitatorConfig>();
const listLoading = ref(true);
const listError = ref('');

const items = ref<FacilitatorResource[]>([]);
const pagination = ref<DiscoveryPagination>();
const offset = ref(0);
const loading = ref(false);
const loaded = ref(false);
const error = ref('');
let requestId = 0;

const viewMode = ref<ViewMode>(readStoredView());
const sortKey = ref<SortKey>('default');
const pageSize = ref<number>(readStoredPageSize());

function readStoredView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === 'list' ? 'list' : 'cards';
  } catch {
    return 'cards';
  }
}

function readStoredPageSize(): number {
  try {
    const stored = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
    return PAGE_SIZE_OPTIONS.includes(stored) ? stored : DEFAULT_PAGE_SIZE;
  } catch {
    return DEFAULT_PAGE_SIZE;
  }
}

// Changing the page size resets to the first page and reloads.
watch(pageSize, (size) => {
  try {
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size));
  } catch {
    /* storage unavailable — page size just won't persist */
  }
  if (facilitator.value) void load(0);
});

watch(viewMode, (mode) => {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, mode);
  } catch {
    /* storage unavailable (private mode) — view mode just won't persist */
  }
});

// Client-side sort over the currently loaded page. The discovery API has no
// sort parameter for activity, so ordering can only apply to received data;
// items missing the metric sink to the bottom. A stable sort keeps the
// original order for ties.
const displayItems = computed<FacilitatorResource[]>(() => {
  if (sortKey.value === 'default') return items.value;
  const metric = sortKey.value === 'calls30d' ? callsLast30Days : payersLast30Days;
  return [...items.value].sort((a, b) => (metric(b) ?? -1) - (metric(a) ?? -1));
});

const status = computed<'checking' | 'active' | 'inactive'>(() => {
  if (error.value) return 'inactive';
  if (loaded.value) return 'active';
  return 'checking';
});

const totalLabel = computed(() => {
  const total = pagination.value?.total;
  if (total !== undefined) return `${total.toLocaleString()} services`;
  if (loaded.value && !error.value) return `${items.value.length}${hasNext.value ? '+' : ''} services`;
  return '';
});

// Effective page size: servers may override the requested limit (e.g. CDP caps
// it at 20 even when a larger size is chosen).
const pageStep = computed(() => pagination.value?.limit ?? pageSize.value);

const hasPrev = computed(() => offset.value > 0);
const hasNext = computed(() => {
  if (pagination.value) return offset.value + items.value.length < pagination.value.total;
  // No pagination metadata: assume another page only when the server returned a
  // full page of exactly the requested size. Returning more means it ignored our
  // limit and handed back the whole list (e.g. OpenFacilitator); fewer means this
  // is the last page.
  return items.value.length === pageStep.value;
});
const showPager = computed(() => hasPrev.value || hasNext.value);

const rangeLabel = computed(() => {
  const from = offset.value + 1;
  const to = offset.value + items.value.length;
  const total = pagination.value?.total;
  return total !== undefined ? `${from}–${to} of ${total.toLocaleString()}` : `${from}–${to}`;
});

async function load(newOffset: number) {
  const target = facilitator.value;
  if (!target) return;
  const id = ++requestId;
  loading.value = true;
  error.value = '';
  try {
    const page = await fetchFacilitatorResources(target.id, { limit: pageSize.value, offset: newOffset });
    if (id !== requestId) return;
    items.value = page.items;
    pagination.value = page.pagination;
    // Some facilitators cap/override limit and offset — trust what the server reports.
    offset.value = page.pagination?.offset ?? newOffset;
    loaded.value = true;
  } catch (err) {
    if (id !== requestId) return;
    error.value = errorMessage(err);
    items.value = [];
    pagination.value = undefined;
    offset.value = newOffset;
  } finally {
    if (id === requestId) loading.value = false;
  }
}

async function init() {
  listLoading.value = true;
  listError.value = '';
  loaded.value = false;
  items.value = [];
  pagination.value = undefined;
  error.value = '';
  try {
    const all = await loadFacilitators();
    facilitator.value = all.find((f) => f.id === route.params.id);
  } catch (err) {
    listError.value = errorMessage(err);
    facilitator.value = undefined;
  } finally {
    listLoading.value = false;
  }
  if (facilitator.value) void load(0);
}

onMounted(init);

watch(() => route.params.id, init);
</script>

<style scoped lang="scss">
@use '@/scss/vars' as *;

.facilitator-page {
  min-height: 100vh;
  background: $background-dark;
  padding-top: 90px;

  @media screen and (max-width: 960px) {
    padding-top: 70px;
  }

  &__container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 40px 32px 96px;
    box-sizing: border-box;

    @media screen and (max-width: 960px) {
      padding: 24px 16px 80px;
    }
  }

  &__back {
    display: inline-block;
    margin-bottom: 24px;
    color: $color-cp0x;
    text-decoration: none;
    font-size: 14px;
    font-family: 'Space Mono', monospace;

    &:hover {
      text-decoration: underline;
    }
  }

  &__hero {
    margin-bottom: 40px;
    padding-bottom: 28px;
    border-bottom: 1px solid $border-color-light;
  }

  &__head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 10px;
  }

  &__title {
    margin: 0;
    font-size: 36px;
    font-weight: 700;
    color: $color-font-white;
    line-height: 1.15;
    overflow-wrap: anywhere;

    @media (max-width: 600px) {
      font-size: 28px;
    }
  }

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #888;
    border: 1px solid $border-color;
    border-radius: 999px;
    padding: 3px 10px;
    background: $background-color;

    &-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #888;
    }

    &--checking &-dot {
      background: $color-cp0x;
      animation: facilitator-detail-pulse 1s ease-in-out infinite;
    }

    &--active {
      color: #3ecf6a;

      .facilitator-page__status-dot {
        background: #3ecf6a;
      }
    }

    &--inactive {
      color: #e05555;

      .facilitator-page__status-dot {
        background: #e05555;
      }
    }
  }

  &__url {
    display: inline-block;
    max-width: 100%;
    color: $color-cp0x;
    text-decoration: none;
    font-family: 'Space Mono', monospace;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;

    &:hover {
      text-decoration: underline;
    }
  }

  &__count {
    margin: 10px 0 0;
    color: #b8b8b8;
    font-size: 14px;
  }

  &__section {
    margin-bottom: 48px;
  }

  &__section-title {
    margin: 0 0 16px;
    font-size: 22px;
    color: $color-font-white;
  }

  &__section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;

    .facilitator-page__section-title {
      margin: 0;
    }
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__sort {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  &__sort-label {
    font-size: 12px;
    color: #888;
    font-family: 'Space Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__sort-select {
    background: $background-color;
    border: 1px solid $border-color;
    border-radius: 8px;
    color: $color-font-white;
    font-size: 13px;
    padding: 7px 12px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;

    &:hover,
    &:focus {
      border-color: $color-cp0x;
    }
  }

  &__view {
    display: inline-flex;
    border: 1px solid $border-color;
    border-radius: 8px;
    overflow: hidden;
  }

  &__view-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 34px;
    background: $background-color;
    border: none;
    color: #888;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    & + & {
      border-left: 1px solid $border-color;
    }

    &:hover {
      color: $color-font-white;
    }

    &.is-active {
      background: $color-cp0x;
      color: $color-font-dark;
    }
  }

  &__sort-note {
    margin: 0 0 16px;
    font-size: 12px;
    line-height: 1.5;
    color: #888;
  }

  &__loading {
    margin: 0;
    padding: 32px;
    text-align: center;
    color: #888;
    font-size: 14px;
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

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 28px;
    flex-wrap: wrap;
  }

  &__pager-nav {
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
  }

  &__page-size {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  &__page-size-label {
    font-size: 12px;
    color: #888;
    font-family: 'Space Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__page-size-select {
    background: $background-color;
    border: 1px solid $border-color;
    border-radius: 8px;
    color: $color-font-white;
    font-size: 13px;
    padding: 7px 12px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;

    &:hover:not(:disabled),
    &:focus {
      border-color: $color-cp0x;
    }

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }

  &__pager-btn {
    background: $background-color;
    border: 1px solid $border-color;
    border-radius: 8px;
    color: $color-font-white;
    padding: 8px 20px;
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.15s;

    &:hover:not(:disabled) {
      border-color: $color-cp0x;
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }

  &__pager-info {
    color: #888;
    font-size: 13px;
    font-family: 'Space Mono', monospace;
  }
}

@keyframes facilitator-detail-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
