<template>
  <div class="resources-page">
    <div class="resources-page__container">
      <header class="resources-page__hero">
        <h1 class="resources-page__title">Resources</h1>
        <p class="resources-page__lead">
          Paid x402 endpoints served by cp0x over
          <a href="https://morpho.org/" target="_blank" rel="noopener">Morpho</a>. Each is a directly
          callable HTTP resource priced per request — pay with an x402 signature and get the data back.
        </p>
      </header>

      <section class="resources-page__section">
        <p v-if="loading" class="resources-page__loading">Loading resources…</p>

        <div v-else-if="error" class="resources-page__error">
          <p>Could not load the resources: {{ error }}.</p>
          <button type="button" class="resources-page__retry" @click="load">Retry</button>
        </div>

        <p v-else-if="!resources.length" class="resources-page__empty">
          No resources available right now.
        </p>

        <template v-else>
          <div class="resources-page__toolbar">
            <p class="resources-page__count">{{ resources.length }} resources</p>

            <div class="resources-page__view" role="group" aria-label="View mode">
              <button
                type="button"
                class="resources-page__view-btn"
                :class="{ 'is-active': viewMode === 'cards' }"
                aria-label="Card view"
                @click="viewMode = 'cards'"
              >
                <IconLayoutGrid :size="18" />
              </button>
              <button
                type="button"
                class="resources-page__view-btn"
                :class="{ 'is-active': viewMode === 'list' }"
                aria-label="List view"
                @click="viewMode = 'list'"
              >
                <IconLayoutList :size="18" />
              </button>
            </div>
          </div>

          <div v-if="viewMode === 'cards'" class="resources-page__grid">
            <article v-for="resource in resources" :key="resource.resource" class="service-card">
              <div class="service-card__head">
                <h2 class="service-card__name">{{ resource.name || resource.resource }}</h2>
                <span v-if="resource.price" class="service-card__price">{{ resource.price }}</span>
              </div>
              <a
                :href="resource.resource"
                target="_blank"
                rel="noopener"
                class="service-card__url"
                :title="resource.resource"
              >{{ resource.resource }}</a>
              <p v-if="resource.description" class="service-card__desc">{{ resource.description }}</p>
              <div v-if="badges(resource).length" class="service-card__badges">
                <span v-for="badge in badges(resource)" :key="badge" class="service-card__badge">{{ badge }}</span>
              </div>
              <div v-if="resource.tags && resource.tags.length" class="service-card__tags">
                <span v-for="tag in resource.tags" :key="tag" class="service-card__tag">{{ tag }}</span>
              </div>
            </article>
          </div>

          <div v-else class="resources-page__list">
            <article v-for="resource in resources" :key="resource.resource" class="service-row">
              <div class="service-row__main">
                <div class="service-row__headline">
                  <h2 class="service-row__name">{{ resource.name || resource.resource }}</h2>
                  <div v-if="badges(resource).length" class="service-row__badges">
                    <span v-for="badge in badges(resource)" :key="badge" class="service-row__badge">{{ badge }}</span>
                  </div>
                </div>
                <a
                  :href="resource.resource"
                  target="_blank"
                  rel="noopener"
                  class="service-row__url"
                  :title="resource.resource"
                >{{ resource.resource }}</a>
                <p v-if="resource.description" class="service-row__desc">{{ resource.description }}</p>
                <div v-if="resource.tags && resource.tags.length" class="service-row__tags">
                  <span v-for="tag in resource.tags" :key="tag" class="service-row__tag">{{ tag }}</span>
                </div>
              </div>
              <div class="service-row__aside">
                <span v-if="resource.price" class="service-row__price">{{ resource.price }}</span>
              </div>
            </article>
          </div>
        </template>
      </section>
    </div>

    <section class="resources-page__footer">
      <FooterSection />
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { IconLayoutGrid, IconLayoutList } from '@tabler/icons-vue';
import FooterSection from '@/sections/FooterSection.vue';
import { fetchCp0xResources } from '@/cp0x/api';
import { errorMessage } from '@/facilitators/useFacilitatorSearch';
import type { Cp0xResource } from '@/cp0x/types';

const VIEW_STORAGE_KEY = 'resources-view';

type ViewMode = 'cards' | 'list';

const resources = ref<Cp0xResource[]>([]);
const loading = ref(true);
const error = ref('');
const viewMode = ref<ViewMode>(readStoredView());

function readStoredView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === 'list' ? 'list' : 'cards';
  } catch {
    return 'cards';
  }
}

watch(viewMode, (mode) => {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, mode);
  } catch {
    /* storage unavailable (private mode) — view mode just won't persist */
  }
});

function badges(resource: Cp0xResource): string[] {
  const list: string[] = [];
  if (resource.type) list.push(resource.type);
  if (resource.x402Version !== undefined) list.push(`x402 v${resource.x402Version}`);
  return list;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const page = await fetchCp0xResources();
    resources.value = page.items;
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped lang="scss">
@use '@/scss/vars' as *;

.resources-page {
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

    a {
      color: $color-cp0x;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  &__hero {
    margin-bottom: 40px;
    padding-bottom: 32px;
    border-bottom: 1px solid $border-color-light;
  }

  &__section {
    margin-bottom: 48px;
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
  }

  &__count {
    margin: 0;
    color: #888;
    font-size: 13px;
    font-family: 'Space Mono', monospace;
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

  &__footer {
    background: $background-dark;
  }
}

.service-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: $background-color;
  border: 1px solid $border-color;
  border-radius: 12px;
  padding: 22px 24px;
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
    font-size: 18px;
    color: $color-font-white;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  &__price {
    flex-shrink: 0;
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: #3ecf6a;
    border: 1px solid $border-color;
    border-radius: 999px;
    padding: 3px 12px;
    background: $background-dark;
    white-space: nowrap;
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

  &__desc {
    margin: 0;
    color: #b8b8b8;
    font-size: 13px;
    line-height: 1.55;
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__badge {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $color-cp0x;
    border: 1px solid $border-color;
    border-radius: 4px;
    padding: 2px 7px;
    background: $background-dark;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: auto;
    padding-top: 4px;
  }

  &__tag {
    font-size: 11px;
    color: #aaa;
    background: $background-dark;
    border-radius: 4px;
    padding: 2px 8px;
    overflow-wrap: anywhere;
  }
}

.service-row {
  display: flex;
  gap: 24px;
  background: $background-color;
  border: 1px solid $border-color;
  border-radius: 12px;
  padding: 18px 22px;
  transition: border-color 0.15s;

  &:hover {
    border-color: $border-color-hover;
  }

  @media (max-width: 760px) {
    flex-direction: column;
    gap: 14px;
  }

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__headline {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__name {
    margin: 0;
    font-size: 17px;
    color: $color-font-white;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__badge {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $color-cp0x;
    border: 1px solid $border-color;
    border-radius: 4px;
    padding: 2px 7px;
    background: $background-dark;
  }

  &__url {
    color: $color-cp0x;
    text-decoration: none;
    font-size: 13px;
    font-family: 'Space Mono', monospace;
    overflow-wrap: anywhere;

    &:hover {
      text-decoration: underline;
    }
  }

  &__desc {
    margin: 0;
    color: #c4c4c4;
    font-size: 14px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__tag {
    font-size: 11px;
    color: #aaa;
    background: $background-dark;
    border-radius: 4px;
    padding: 2px 8px;
    overflow-wrap: anywhere;
  }

  &__aside {
    flex-shrink: 0;
    width: 140px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding-left: 24px;
    border-left: 1px solid $border-color-light;

    @media (max-width: 760px) {
      width: 100%;
      padding-left: 0;
      padding-top: 14px;
      border-left: none;
      border-top: 1px solid $border-color-light;
      justify-content: flex-start;
    }
  }

  &__price {
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: #3ecf6a;
    border: 1px solid $border-color;
    border-radius: 999px;
    padding: 3px 12px;
    background: $background-dark;
    white-space: nowrap;
  }
}
</style>
