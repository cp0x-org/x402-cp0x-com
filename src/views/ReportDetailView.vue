<template>
  <div class="report-page">
    <div class="report-page__container">
      <router-link to="/reports" class="report-page__back">← All reports</router-link>

      <template v-if="!report">
        <p class="report-page__empty">Report not found. It may have been moved or removed.</p>
      </template>

      <template v-else>
        <header class="report-page__hero">
          <div class="report-page__meta">
            <span class="report-page__date">{{ formatDate(report.date) }}</span>
            <nav v-if="langs.length > 1" class="report-page__langs" aria-label="Report language">
              <router-link
                v-for="l in langs"
                :key="l"
                :to="reportPath(report, l)"
                class="report-page__lang"
                :class="{ 'is-active': l === lang }"
              >{{ LANG_LABEL[l] }}</router-link>
            </nav>
          </div>
          <h1 class="report-page__title">{{ variant.title }}</h1>
        </header>

        <div class="report-page__layout">
          <aside v-if="toc.length" class="report-page__toc">
            <p class="report-page__toc-title">Contents</p>
            <nav>
              <a
                v-for="entry in toc"
                :key="entry.slug"
                :href="`#${entry.slug}`"
                class="report-page__toc-link"
                :class="`report-page__toc-link--h${entry.level}`"
              >{{ entry.text }}</a>
            </nav>
          </aside>

          <!-- Trusted, build-time authored markdown (see src/reports). -->
          <article class="report-page__body markdown-body" v-html="html"></article>
        </div>
      </template>
    </div>

    <section class="report-page__footer">
      <FooterSection />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import FooterSection from '@/sections/FooterSection.vue';
import {
  findReport,
  reportVariant,
  reportLangs,
  LANG_LABEL,
  type Lang,
  type Report,
} from '@/reports/reports';
import { renderMarkdown, extractToc } from '@/reports/markdown';

const route = useRoute();

const report = computed(() => findReport(String(route.params.id)));
const resolved = computed(() =>
  report.value ? reportVariant(report.value, route.params.lang ? String(route.params.lang) : undefined) : undefined,
);
const lang = computed(() => resolved.value?.lang);
const variant = computed(() => resolved.value?.variant ?? { title: '', blurb: '', content: '' });
const langs = computed(() => (report.value ? reportLangs(report.value) : []));

const html = computed(() => renderMarkdown(variant.value.content));
const toc = computed(() => extractToc(variant.value.content));

// Default-language link omits the lang segment; other languages append it.
function reportPath(r: Report, l: Lang): string {
  const base = `/reports/${r.id}`;
  return l === r.defaultLang ? base : `${base}/${l}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}
</script>

<style scoped lang="scss">
@use '@/scss/vars' as *;

.report-page {
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

  &__hero {
    margin-bottom: 36px;
    padding-bottom: 28px;
    border-bottom: 1px solid $border-color-light;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  &__date {
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #888;
  }

  &__langs {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__lang {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: #888;
    text-decoration: none;
    border: 1px solid $border-color;
    border-radius: 4px;
    padding: 2px 8px;
    transition: color 0.15s, border-color 0.15s, background 0.15s;

    &:hover {
      color: $color-font-white;
      border-color: $border-color-hover;
    }

    &.is-active {
      background: $color-cp0x;
      color: $color-font-dark;
      border-color: $color-cp0x;
    }
  }

  &__title {
    margin: 0;
    font-size: 38px;
    font-weight: 700;
    color: $color-font-white;
    line-height: 1.2;
    overflow-wrap: anywhere;

    @media (max-width: 600px) {
      font-size: 28px;
    }
  }

  &__layout {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 48px;
    align-items: start;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      gap: 28px;
    }
  }

  &__toc {
    position: sticky;
    top: 110px;

    @media (max-width: 900px) {
      position: static;
      top: auto;
      padding-bottom: 20px;
      border-bottom: 1px solid $border-color-light;
    }
  }

  &__toc-title {
    margin: 0 0 12px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #888;
  }

  &__toc-link {
    display: block;
    padding: 4px 0;
    color: #b8b8b8;
    text-decoration: none;
    font-size: 13px;
    line-height: 1.45;
    transition: color 0.15s;

    &:hover {
      color: $color-cp0x;
    }

    &--h3 {
      padding-left: 14px;
      font-size: 12.5px;
      color: #999;
    }
  }

  &__footer {
    background: $background-dark;
  }
}

// Prose styling for the rendered markdown. The content is trusted (authored by
// us and bundled at build time), so v-html is safe here.
.markdown-body {
  color: #c4c4c4;
  font-size: 15.5px;
  line-height: 1.7;
  overflow-wrap: anywhere;

  :deep(h1) {
    display: none; // report title is rendered in the hero above
  }

  :deep(h2) {
    margin: 40px 0 16px;
    padding-top: 12px;
    font-size: 24px;
    color: $color-font-white;
    line-height: 1.3;
    scroll-margin-top: 110px;
  }

  :deep(h3) {
    margin: 28px 0 12px;
    font-size: 18px;
    color: $color-font-white;
    scroll-margin-top: 110px;
  }

  :deep(h2 a),
  :deep(h3 a) {
    color: inherit;
    text-decoration: none;
  }

  :deep(p) {
    margin: 0 0 16px;
  }

  :deep(strong) {
    color: $color-font-white2;
  }

  :deep(a) {
    color: $color-cp0x;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 16px;
    padding-left: 22px;
  }

  :deep(li) {
    margin-bottom: 8px;

    &::marker {
      color: #777;
    }
  }

  :deep(code) {
    background: $background-color;
    border: 1px solid $border-color;
    padding: 1.5px 6px;
    border-radius: 4px;
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: $color-cp0x;
    overflow-wrap: anywhere;
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid $border-color-light;
    margin: 36px 0;
  }

  :deep(em) {
    color: #aaa;
  }

  :deep(blockquote) {
    margin: 0 0 16px;
    padding: 4px 18px;
    border-left: 3px solid $border-color-hover;
    color: #aaa;
    font-style: italic;
  }

  :deep(.table-wrap),
  :deep(table) {
    display: block;
    max-width: 100%;
    overflow-x: auto;
  }

  :deep(table) {
    border-collapse: collapse;
    margin: 0 0 20px;
    font-size: 14px;
    white-space: nowrap;
  }

  :deep(th),
  :deep(td) {
    border: 1px solid $border-color;
    padding: 9px 14px;
    text-align: left;
    vertical-align: top;
  }

  :deep(th) {
    background: $background-color;
    color: $color-font-white;
    font-weight: 600;
  }

  :deep(tbody tr:nth-child(even)) {
    background: rgba(255, 255, 255, 0.015);
  }
}
</style>
