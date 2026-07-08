<template>
  <div class="fsearch">
    <form class="fsearch__form" @submit.prevent="submit">
      <input
        v-model="query"
        type="text"
        class="fsearch__input"
        :placeholder="placeholder"
        :aria-label="placeholder"
      />
      <button class="fsearch__btn" type="submit" :disabled="searching || !query.trim()">
        {{ searching ? 'Searching…' : 'Search' }}
      </button>
    </form>

    <div v-if="searched" class="fsearch__statuses">
      <div
        v-for="status in statuses"
        :key="status.facilitator.id"
        class="fsearch__status"
        :class="`fsearch__status--${status.phase}`"
        :title="status.error"
      >
        <span class="fsearch__status-dot"></span>
        <span class="fsearch__status-name">{{ status.facilitator.name }}</span>
        <span class="fsearch__status-text">
          <template v-if="status.phase === 'searching'">searching…</template>
          <template v-else-if="status.phase === 'done'">
            found {{ status.count }} result{{ status.count === 1 ? '' : 's' }}<template v-if="status.partial"> (partial)</template>
          </template>
          <template v-else>failed / unsupported</template>
        </span>
      </div>
    </div>

    <p v-if="searched && !searching && results.length === 0" class="fsearch__empty">
      No services found for “{{ lastQuery }}”.
    </p>

    <div v-if="results.length" class="fsearch__summary">
      <span class="fsearch__summary-count">
        {{ results.length }} result{{ results.length === 1 ? '' : 's' }}
        across {{ facilitatorsWithResults }} facilitator{{ facilitatorsWithResults === 1 ? '' : 's' }}
      </span>
      <span v-if="anyPartial" class="fsearch__summary-partial">
        Some facilitators returned partial results — search is ranked by relevance and
        not paginated, so refine your query for more specific matches.
      </span>
    </div>

    <div v-if="results.length" class="fsearch__table-wrap">
      <table class="fsearch__table">
        <thead>
          <tr>
            <th class="fsearch__th-resource">Resource</th>
            <th class="fsearch__th-desc">Description</th>
            <th class="fsearch__th-pay">Payment</th>
            <th class="fsearch__th-facilitator">Facilitator</th>
            <th class="fsearch__th-activity">Activity</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.key">
            <td class="fsearch__col-resource">
              <div class="fsearch__service">{{ row.serviceName }}</div>
              <a
                :href="row.hit.resource"
                target="_blank"
                rel="noopener"
                class="fsearch__link"
                :title="row.hit.resource"
              >{{ row.hit.resource }}</a>
              <div v-if="row.tags.length" class="fsearch__tags">
                <span v-for="tag in row.tags" :key="tag" class="fsearch__tag">{{ tag }}</span>
              </div>
            </td>
            <td class="fsearch__col-desc">{{ row.hit.description || '—' }}</td>
            <td class="fsearch__col-pay">
              <template v-if="row.payments.length">
                <div v-for="(payment, i) in row.payments" :key="i" class="fsearch__pay-item">{{ payment }}</div>
              </template>
              <template v-else>—</template>
            </td>
            <td class="fsearch__col-facilitator">{{ row.hit.facilitator.name }}</td>
            <td class="fsearch__col-activity">
              <template v-if="row.activity.length">
                <div v-for="line in row.activity" :key="line.label" class="fsearch__activity-item">
                  <span class="fsearch__activity-label">{{ line.label }}</span>
                  <span class="fsearch__activity-value">{{ line.value }}</span>
                </div>
              </template>
              <template v-else>—</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import type { FacilitatorConfig, SearchHit } from '@/facilitators/types';
import { extractPaymentInfo, extractServiceName, networkName } from '@/facilitators/api';
import { buildActivity, type ActivityLine } from '@/facilitators/format';
import { useFacilitatorSearch } from '@/facilitators/useFacilitatorSearch';

const props = defineProps<{
  facilitators: FacilitatorConfig[];
  placeholder?: string;
}>();

const placeholder = computed(() => props.placeholder ?? 'Search x402 services…');
const query = ref('');

const { searching, searched, lastQuery, results, statuses, run } = useFacilitatorSearch(
  toRef(props, 'facilitators'),
);

function submit() {
  void run(query.value);
}

const facilitatorsWithResults = computed(() => statuses.value.filter((s) => s.phase === 'done' && s.count > 0).length);
const anyPartial = computed(() => statuses.value.some((s) => s.partial));

interface ResultRow {
  key: string;
  hit: SearchHit;
  serviceName: string;
  payments: string[];
  tags: string[];
  activity: ActivityLine[];
}

const rows = computed<ResultRow[]>(() =>
  results.value.map((hit, index) => ({
    key: `${hit.facilitator.id}-${index}-${hit.resource}`,
    hit,
    serviceName: extractServiceName(hit),
    payments: extractPaymentInfo(hit)
      .slice(0, 3)
      .map((p) => [networkName(p.network), p.amount].filter(Boolean).join(' · ')),
    tags: (hit.tags ?? []).slice(0, 4),
    activity: buildActivity(hit),
  })),
);

</script>

<style scoped lang="scss">
@use '@/scss/vars' as *;

.fsearch {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__form {
    display: flex;
    gap: 10px;

    @media (max-width: 600px) {
      flex-direction: column;
    }
  }

  &__input {
    flex: 1;
    background: $background-color;
    border: 1px solid $border-color;
    border-radius: 8px;
    color: $color-font-white;
    font-size: 14px;
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder {
      color: #777;
    }

    &:focus {
      border-color: $color-cp0x;
    }
  }

  &__btn {
    background: $color-cp0x;
    color: $color-font-dark;
    border: none;
    border-radius: 8px;
    padding: 10px 28px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;

    &:hover:not(:disabled) {
      background: $color-cp0x-hover;
    }

    &:disabled {
      opacity: 0.55;
      cursor: default;
    }
  }

  &__statuses {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: $background-color;
    border: 1px solid $border-color;
    border-radius: 999px;
    padding: 5px 14px;
    font-size: 12px;
    color: #b8b8b8;

    &-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #888;
      flex-shrink: 0;
    }

    &-name {
      color: $color-font-white2;
      font-family: 'Space Mono', monospace;
    }

    &--searching &-dot {
      background: $color-cp0x;
      animation: fsearch-pulse 1s ease-in-out infinite;
    }

    &--done &-dot {
      background: #3ecf6a;
    }

    &--failed &-dot {
      background: #e05555;
    }
  }

  &__empty {
    margin: 0;
    padding: 24px;
    text-align: center;
    color: #888;
    font-size: 14px;
    background: $background-color;
    border: 1px dashed $border-color;
    border-radius: 12px;
  }

  &__summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__summary-count {
    font-size: 13px;
    color: $color-font-white2;
    font-family: 'Space Mono', monospace;
  }

  &__summary-partial {
    font-size: 12px;
    line-height: 1.5;
    color: #d8b26a;
    background: rgba(216, 178, 106, 0.08);
    border: 1px solid rgba(216, 178, 106, 0.3);
    border-radius: 8px;
    padding: 8px 12px;
  }

  &__table-wrap {
    overflow-x: auto;
    border: 1px solid $border-color;
    border-radius: 12px;
    background: $background-color;
  }

  &__table {
    width: 100%;
    min-width: 880px;
    border-collapse: collapse;
    font-size: 13px;
  }

  // Column widths: Resource is trimmed, Description is greedy (it holds the
  // richest content), Payment/Activity are compact fixed columns.
  &__th-resource { width: 200px; }
  &__th-desc { width: auto; }
  &__th-pay { width: 108px; }
  &__th-facilitator { width: 120px; }
  &__th-activity { width: 130px; }

  &__table {

    th {
      text-align: left;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: $table-font-header-color;
      padding: 12px 16px;
      border-bottom: 1px solid $border-color;
      white-space: nowrap;
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid $border-color-light;
      color: #b8b8b8;
      vertical-align: top;
    }

    tr:last-child td {
      border-bottom: none;
    }
  }

  &__col-resource {
    max-width: 200px;
  }

  &__service {
    color: $color-font-white;
    font-weight: 600;
    margin-bottom: 2px;
    overflow-wrap: anywhere;
  }

  &__link {
    display: block;
    max-width: 184px;
    color: $color-cp0x;
    text-decoration: none;
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      text-decoration: underline;
    }
  }

  &__tags {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  &__tag {
    font-size: 10px;
    color: #aaa;
    background: $background-dark;
    border-radius: 4px;
    padding: 1px 6px;
  }

  &__col-desc {
    color: #c4c4c4;
    line-height: 1.5;
    min-width: 280px;
  }

  &__col-pay {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
  }

  &__pay-item {
    white-space: nowrap;

    & + & {
      margin-top: 4px;
    }
  }

  &__col-facilitator {
    white-space: nowrap;
    font-family: 'Space Mono', monospace;
  }

  &__col-activity {
    font-size: 11px;
  }

  &__activity-item {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    white-space: nowrap;

    & + & {
      margin-top: 3px;
    }
  }

  &__activity-label {
    color: #888;
    font-family: 'Space Mono', monospace;
  }

  &__activity-value {
    color: $color-font-white2;
    font-family: 'Space Mono', monospace;
  }
}

@keyframes fsearch-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
