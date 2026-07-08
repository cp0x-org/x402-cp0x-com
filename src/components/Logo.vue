<template>
  <div class="logo">
    <img :src="logoSvg" alt="x402 logo" width="63" height="26" />
    <span class="logo-text">
      <span class="logo-x">x</span><span class="logo-paywall">402</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import logoSvg from '@/assets/logo.svg';
</script>

<style scoped lang="scss">
.logo {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  text-decoration: none;

  img {
    display: block;
  }
}

.logo-text {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 1px;
  margin-top: -1px;
  font-family: Inter, system-ui, sans-serif;
}

.logo-x {
  color: #eeeeee;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
}

.logo-paywall {
  color: #26cccb;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
}
</style>
