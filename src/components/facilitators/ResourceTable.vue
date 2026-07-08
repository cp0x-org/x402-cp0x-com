<template>
  <div class="rtable__wrap">
    <table class="rtable">
      <thead>
        <tr>
          <th class="rtable__th-resource">Resource</th>
          <th class="rtable__th-desc">Description</th>
          <th class="rtable__th-pay">Payment</th>
          <th class="rtable__th-activity">Activity</th>
          <th class="rtable__th-date">Updated</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <td class="rtable__col-resource">
            <div v-if="row.badges.length" class="rtable__badges">
              <span v-for="badge in row.badges" :key="badge" class="rtable__badge">{{ badge }}</span>
            </div>
            <div class="rtable__service">{{ row.serviceName }}</div>
            <a
              :href="row.item.resource"
              target="_blank"
              rel="noopener"
              class="rtable__link"
              :title="row.item.resource"
            >{{ row.item.resource }}</a>
            <div v-if="row.tags.length" class="rtable__tags">
              <span v-for="tag in row.tags" :key="tag" class="rtable__tag">{{ tag }}</span>
            </div>
          </td>
          <td class="rtable__col-desc">{{ row.item.description || '—' }}</td>
          <td class="rtable__col-pay">
            <template v-if="row.payments.length">
              <div v-for="(payment, i) in row.payments" :key="i" class="rtable__pay-item">{{ payment }}</div>
            </template>
            <template v-else>—</template>
          </td>
          <td class="rtable__col-activity">
            <template v-if="row.activity.length">
              <div v-for="line in row.activity" :key="line.label" class="rtable__activity-item">
                <span class="rtable__activity-label">{{ line.label }}</span>
                <span class="rtable__activity-value">{{ line.value }}</span>
              </div>
            </template>
            <template v-else>—</template>
          </td>
          <td class="rtable__col-date">{{ row.updated || '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FacilitatorResource } from '@/facilitators/types';
import { extractPaymentInfo, extractServiceName, networkName } from '@/facilitators/api';

const props = defineProps<{
  items: FacilitatorResource[];
}>();

interface ActivityLine {
  label: string;
  value: string;
}

interface ResourceRow {
  key: string;
  item: FacilitatorResource;
  serviceName: string;
  badges: string[];
  payments: string[];
  tags: string[];
  updated: string;
  activity: ActivityLine[];
}

const rows = computed<ResourceRow[]>(() =>
  props.items.map((item, index) => ({
    key: `${item.resource}-${index}`,
    item,
    serviceName: extractServiceName(item),
    badges: buildBadges(item),
    payments: extractPaymentInfo(item)
      .slice(0, 3)
      .map((p) => [networkName(p.network), p.amount].filter(Boolean).join(' · ')),
    tags: (item.tags ?? []).slice(0, 4),
    updated: formatDate(item.lastUpdated),
    activity: buildActivity(item),
  })),
);

function buildBadges(item: FacilitatorResource): string[] {
  const list: string[] = [];
  if (item.method) list.push(item.method.toUpperCase());
  if (item.type) list.push(item.type);
  if (item.x402Version !== undefined) list.push(`x402 v${item.x402Version}`);
  return list;
}

// `quality` is only present on some facilitators' items; skip missing fields
// so the cell collapses to a dash instead of showing empty rows.
function buildActivity(item: FacilitatorResource): ActivityLine[] {
  const q = item.quality;
  if (!q) return [];
  const lines: ActivityLine[] = [];
  if (typeof q.l30DaysTotalCalls === 'number') {
    lines.push({ label: 'calls 30d', value: q.l30DaysTotalCalls.toLocaleString() });
  }
  if (typeof q.l30DaysUniquePayers === 'number') {
    lines.push({ label: 'payers 30d', value: q.l30DaysUniquePayers.toLocaleString() });
  }
  const lastCalled = formatDate(q.lastCalledAt);
  if (lastCalled) {
    lines.push({ label: 'last call', value: lastCalled });
  }
  return lines;
}

function formatDate(raw?: string): string {
  if (!raw) return '';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}
</script>

<style scoped lang="scss">
@use '@/scss/vars' as *;

.rtable__wrap {
  overflow-x: auto;
  border: 1px solid $border-color;
  border-radius: 12px;
  background: $background-color;
}

.rtable {
  width: 100%;
  min-width: 820px;
  border-collapse: collapse;
  font-size: 13px;

  // Column widths: Resource is trimmed, Description is greedy — in the list
  // view it is shown in full, never clamped.
  &__th-resource { width: 220px; }
  &__th-desc { width: auto; }
  &__th-pay { width: 118px; }
  &__th-activity { width: 130px; }
  &__th-date { width: 92px; }

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

  &__col-resource {
    max-width: 220px;
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 6px;
  }

  &__badge {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $color-cp0x;
    border: 1px solid $border-color;
    border-radius: 4px;
    padding: 1px 6px;
    background: $background-dark;
  }

  &__service {
    color: $color-font-white;
    font-weight: 600;
    margin-bottom: 2px;
    overflow-wrap: anywhere;
  }

  &__link {
    display: block;
    max-width: 204px;
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

  &__col-date {
    white-space: nowrap;
  }
}
</style>
