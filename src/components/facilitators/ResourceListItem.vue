<template>
  <article class="resource-row">
    <div class="resource-row__main">
      <div class="resource-row__headline">
        <h3 class="resource-row__name">{{ serviceName }}</h3>
        <div v-if="badges.length" class="resource-row__badges">
          <span v-for="badge in badges" :key="badge" class="resource-row__badge">{{ badge }}</span>
        </div>
      </div>

      <a
        :href="resource.resource"
        target="_blank"
        rel="noopener"
        class="resource-row__url"
        :title="resource.resource"
      >{{ resource.resource }}</a>

      <!-- Full description, not truncated (unlike the card view). -->
      <p v-if="resource.description" class="resource-row__desc">{{ resource.description }}</p>

      <div v-if="payments.length" class="resource-row__payments">
        <span v-for="(payment, i) in payments" :key="i" class="resource-row__payment">{{ payment }}</span>
      </div>

      <div v-if="metaChips.length" class="resource-row__chips">
        <span v-for="chip in metaChips" :key="chip" class="resource-row__chip">{{ chip }}</span>
      </div>
    </div>

    <div class="resource-row__activity">
      <template v-if="activity.length">
        <div v-for="line in activity" :key="line.label" class="resource-row__activity-item">
          <span class="resource-row__activity-label">{{ line.label }}</span>
          <span class="resource-row__activity-value">{{ line.value }}</span>
        </div>
      </template>
      <span v-else class="resource-row__activity-empty">no activity data</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FacilitatorResource } from '@/facilitators/types';
import { extractPaymentInfo, extractServiceName, networkName } from '@/facilitators/api';
import { buildActivity } from '@/facilitators/format';

const props = defineProps<{
  resource: FacilitatorResource;
}>();

const serviceName = computed(() => extractServiceName(props.resource));

const payments = computed(() =>
  extractPaymentInfo(props.resource).map((p) => [networkName(p.network), p.amount].filter(Boolean).join(' · ')),
);

const activity = computed(() => buildActivity(props.resource, true));

const badges = computed(() => {
  const list: string[] = [];
  if (props.resource.method) list.push(props.resource.method.toUpperCase());
  if (props.resource.type) list.push(props.resource.type);
  if (props.resource.x402Version !== undefined) list.push(`x402 v${props.resource.x402Version}`);
  return list;
});

const metaChips = computed(() => {
  const meta = props.resource.metadata ?? {};
  const chips: string[] = [];
  if (typeof meta.category === 'string' && meta.category) chips.push(meta.category);
  const tags = props.resource.tags ?? (Array.isArray(meta.tags) ? meta.tags.filter((t): t is string => typeof t === 'string') : []);
  chips.push(...tags.slice(0, 8));
  if (typeof meta.qualityScore === 'number') chips.push(`quality ${meta.qualityScore}`);
  if (typeof meta.verificationStatus === 'string' && meta.verificationStatus) chips.push(meta.verificationStatus);
  return chips;
});
</script>

<style scoped lang="scss">
@use '@/scss/vars' as *;

.resource-row {
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

  &__payments {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
  }

  &__payment {
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    color: $color-font-white2;
    overflow-wrap: anywhere;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__chip {
    font-size: 11px;
    color: #aaa;
    background: $background-dark;
    border-radius: 4px;
    padding: 2px 8px;
    overflow-wrap: anywhere;
  }

  &__activity {
    flex-shrink: 0;
    width: 180px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-left: 24px;
    border-left: 1px solid $border-color-light;

    @media (max-width: 760px) {
      width: 100%;
      padding-left: 0;
      padding-top: 14px;
      border-left: none;
      border-top: 1px solid $border-color-light;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 6px 20px;
    }
  }

  &__activity-item {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 12px;
    white-space: nowrap;
  }

  &__activity-label {
    color: #888;
    font-family: 'Space Mono', monospace;
  }

  &__activity-value {
    color: $color-font-white2;
    font-family: 'Space Mono', monospace;
  }

  &__activity-empty {
    font-size: 12px;
    color: #666;
    font-style: italic;
  }
}
</style>
