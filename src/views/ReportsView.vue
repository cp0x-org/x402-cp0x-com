<template>
  <div class="reports-page">
    <div class="reports-page__container">
      <header class="reports-page__hero">
        <h1 class="reports-page__title">Reports</h1>
        <p class="reports-page__lead">
          Research and analysis on the x402 machine-payments economy.
        </p>
      </header>

      <section class="reports-page__section">
        <p v-if="!reports.length" class="reports-page__empty">No reports published yet.</p>

        <ul v-else class="report-list">
          <li v-for="report in reports" :key="report.id" class="report-list__item">
            <div class="report-entry">
              <time class="report-entry__date" :datetime="report.date">{{ formatDate(report.date) }}</time>
              <router-link :to="reportPath(report)" class="report-entry__body">
                <span class="report-entry__title">{{ primary(report).title }}</span>
                <span class="report-entry__blurb">{{ primary(report).blurb }}</span>
              </router-link>
              <nav class="report-entry__langs" aria-label="Report language">
                <router-link
                  v-for="lang in reportLangs(report)"
                  :key="lang"
                  :to="reportPath(report, lang)"
                  class="report-entry__lang"
                >{{ LANG_LABEL[lang] }}</router-link>
              </nav>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <section class="reports-page__footer">
      <FooterSection />
    </section>
  </div>
</template>

<script setup lang="ts">
import FooterSection from '@/sections/FooterSection.vue';
import { reports, reportLangs, reportVariant, LANG_LABEL, type Lang, type Report } from '@/reports/reports';

function primary(report: Report) {
  return reportVariant(report).variant;
}

// Default-language link omits the lang segment; other languages append it.
function reportPath(report: Report, lang?: Lang): string {
  const base = `/reports/${report.id}`;
  return !lang || lang === report.defaultLang ? base : `${base}/${lang}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>

<style scoped lang="scss">
@use '@/scss/vars' as *;

.reports-page {
  min-height: 100vh;
  background: $background-dark;
  padding-top: 90px;

  @media screen and (max-width: 960px) {
    padding-top: 70px;
  }

  &__container {
    max-width: 820px;
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
    margin-bottom: 32px;
    padding-bottom: 28px;
    border-bottom: 1px solid $border-color-light;
  }

  &__empty {
    margin: 0;
    padding: 28px 0;
    color: #888;
    font-size: 14px;
  }

  &__footer {
    background: $background-dark;
  }
}

.report-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid $border-color-light;

  &__item {
    border-bottom: 1px solid $border-color-light;
  }
}

.report-entry {
  display: flex;
  align-items: baseline;
  gap: 24px;
  padding: 18px 4px;

  &__date {
    flex-shrink: 0;
    width: 108px;
    font-family: 'Space Mono', monospace;
    font-size: 12.5px;
    color: #888;
    letter-spacing: 0.02em;
    padding-top: 2px;
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
    text-decoration: none;
    transition: padding-left 0.15s ease;

    &:hover {
      padding-left: 8px;
    }
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
    color: $color-font-white;
    line-height: 1.4;
    transition: color 0.15s;

    .report-entry__body:hover & {
      color: $color-cp0x;
    }
  }

  &__blurb {
    font-size: 13.5px;
    color: #8f8f8f;
    line-height: 1.5;
  }

  &__langs {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 2px;
  }

  &__lang {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: #888;
    text-decoration: none;
    border: 1px solid $border-color;
    border-radius: 4px;
    padding: 2px 7px;
    transition: color 0.15s, border-color 0.15s;

    &:hover {
      color: $color-cp0x;
      border-color: $border-color-hover;
    }
  }

  @media (max-width: 560px) {
    flex-wrap: wrap;
    gap: 8px 16px;

    &__date {
      width: auto;
      order: -1;
    }

    &__body {
      flex-basis: 100%;
      order: 1;
    }

    &__langs {
      order: 2;
    }
  }
}
</style>
