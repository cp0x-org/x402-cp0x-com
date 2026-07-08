<template>
  <article class="resource-card">
    <div v-if="badges.length" class="resource-card__badges">
      <span v-for="badge in badges" :key="badge" class="resource-card__badge">{{ badge }}</span>
    </div>
    <h3 class="resource-card__name">{{ serviceName }}</h3>
    <a
      :href="resource.resource"
      target="_blank"
      rel="noopener"
      class="resource-card__url"
      :title="resource.resource"
      @click.stop
    >{{ resource.resource }}</a>
    <p v-if="resource.description" class="resource-card__desc">{{ resource.description }}</p>
    <div v-if="payments.length" class="resource-card__payments">
      <span v-for="(payment, i) in payments.slice(0, 3)" :key="i" class="resource-card__payment">
        {{ paymentLabel(payment) }}
      </span>
    </div>
    <div v-if="metaChips.length" class="resource-card__meta">
      <span v-for="chip in metaChips" :key="chip" class="resource-card__chip">{{ chip }}</span>
    </div>
    <div class="resource-card__footer">
      <span class="resource-card__facilitator">{{ facilitatorName }}</span>
      <span v-if="updatedLabel" class="resource-card__updated">{{ updatedLabel }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FacilitatorResource, PaymentInfo } from '@/facilitators/types';
import { extractPaymentInfo, extractServiceName } from '@/facilitators/api';

const props = defineProps<{
  resource: FacilitatorResource;
  facilitatorName: string;
}>();

const serviceName = computed(() => extractServiceName(props.resource));
const payments = computed(() => extractPaymentInfo(props.resource));

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
  chips.push(...tags.slice(0, 5));
  if (typeof meta.qualityScore === 'number') chips.push(`quality ${meta.qualityScore}`);
  if (typeof meta.verificationStatus === 'string' && meta.verificationStatus) chips.push(meta.verificationStatus);
  return chips;
});

const updatedLabel = computed(() => {
  const raw = props.resource.lastUpdated;
  if (!raw) return '';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
});

function paymentLabel(payment: PaymentInfo): string {
  return [payment.network, payment.scheme, payment.amount].filter(Boolean).join(' · ');
}
</script>

<style scoped lang="scss">
@use '@/scss/vars' as *;

.resource-card {
  background: $background-color;
  border: 1px solid $border-color;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  transition: border-color 0.15s;

  &:hover {
    border-color: $border-color-hover;
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

  &__name {
    margin: 0;
    font-size: 16px;
    color: $color-font-white;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  &__url {
    display: block;
    color: $color-cp0x;
    text-decoration: none;
    font-size: 13px;
    font-family: 'Space Mono', monospace;
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
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__payments {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__payment {
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    color: $color-font-white2;
    overflow-wrap: anywhere;
  }

  &__meta {
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

  &__footer {
    margin-top: auto;
    padding-top: 10px;
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: #888;
    border-top: 1px solid $border-color-light;
  }

  &__facilitator {
    font-family: 'Space Mono', monospace;
  }
}
</style>
