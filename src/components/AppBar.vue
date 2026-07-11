<template>
  <header class="main-toolbar">
    <div class="container p-relative flex-1">
      <div class="flex align-center">
        <router-link to="/" class="logo-wrapper flex align-center">
          <Logo />
        </router-link>
        <div class="product-links flex align-center">
          <router-link to="/" rel="noopener" class="product-link">Home</router-link>
          <router-link to="/reports" rel="noopener" class="product-link">Reports</router-link>
          <a href="https://xpaywall.io" target="_blank" rel="noopener" class="product-link">xPaywall</a>
        </div>
        <div class="desktop-menu flex-1 flex align-center justify-between">
          <div class="flex"></div>
          <div class="product-links flex align-center">
            <a href="https://cp0x.com/" target="_blank" rel="noopener" class="product-link">cp0x</a>
            <a href="https://pi.cp0x.com/" target="_blank" rel="noopener" class="product-link">Permissionless Interfaces</a>
          </div>
        </div>
        <div class="mobile-menu">
          <div
            class="burger-menu"
            :class="{ 'is-active': menuOpen }"
            @click="menuOpen = !menuOpen"
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="mobile-nav" :class="{ 'is-active': menuOpen }" v-if="menuOpen">
      <div class="mobile-nav__content">
        <div class="mobile-nav__items">
          <router-link to="/" class="mobile-nav-link" @click="menuOpen = false">Home</router-link>
          <router-link to="/reports" class="mobile-nav-link" @click="menuOpen = false">Reports</router-link>
          <a href="https://xpaywall.io" target="_blank" rel="noopener" class="mobile-nav-link" @click="menuOpen = false">xPaywall</a>
          <a href="https://cp0x.com/" target="_blank" rel="noopener" class="mobile-nav-link" @click="menuOpen = false">cp0x</a>
          <a href="https://pi.cp0x.com/" target="_blank" rel="noopener" class="mobile-nav-link" @click="menuOpen = false">Permissionless Interfaces</a>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import Logo from '@/components/Logo.vue';

const menuOpen = ref(false);

watch(menuOpen, (val) => {
  document.body.classList.toggle('menu-open', val);
});

onUnmounted(() => {
  document.body.classList.remove('menu-open');
});
</script>

<style scoped lang="scss">
@use '@/scss/vars' as *;

.main-toolbar {
  flex: 1;
  background: $background-main-top;
  position: fixed;
  width: 100%;
  height: 90px;
  display: flex;
  align-items: center;
  z-index: 1000;
  top: 0;
  left: 0;

  @media screen and (max-width: 960px) {
    height: 70px;
  }

  .desktop-menu {
    @media screen and (max-width: 960px) {
      display: none;
    }
  }

  .mobile-menu {
    flex: 1;
    display: none;
    justify-content: flex-end;
    align-items: center;

    @media screen and (max-width: 960px) {
      display: flex;
    }
  }
}

.container {
  max-width: 1440px;
  margin: 0 auto;
  padding-left: 32px;
  padding-right: 32px;

  @media screen and (max-width: 960px) {
    padding-left: 16px;
    padding-right: 16px;
  }
}

.p-relative {
  position: relative;
}

.flex { display: flex; }
.flex-1 { flex: 1; }
.align-center { align-items: center; }
.justify-between { justify-content: space-between; }

.logo-wrapper {
  margin-right: 24px;
  text-decoration: none;
}

.product-links {
  gap: 4px;
  margin-right: 8px;

  @media screen and (max-width: 960px) {
    display: none;
  }
}

.product-link {
  font-size: 15px;
  line-height: 24px;
  font-weight: 400;
  color: #eee;
  font-family: 'Space Mono', sans-serif;
  opacity: 0.8;
  transition: all 0.3s ease;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  padding: 0 10px;

  &:hover {
    opacity: 1;
  }
}

.burger-menu {
  width: 30px;
  height: 25px;
  position: relative;
  cursor: pointer;

  span {
    display: block;
    position: absolute;
    height: 2px;
    width: 100%;
    background: $color-font-white;
    border-radius: 1px;
    transition: 0.25s ease-in-out;

    &:nth-child(1) { top: 1px; }
    &:nth-child(2) { top: 50%; transform: translateY(-50%); }
    &:nth-child(3) { bottom: 0; }
  }

  &.is-active span {
    &:nth-child(1) { top: 50%; transform: translateY(-50%) rotate(45deg); }
    &:nth-child(2) { opacity: 0; }
    &:nth-child(3) { bottom: 50%; transform: translateY(50%) rotate(-45deg); }
  }
}

.mobile-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: $background-main-top;
  z-index: 999;
  display: none;

  @media screen and (max-width: 960px) {
    display: block;
  }

  &.is-active {
    display: block;
  }

  &__content {
    padding-top: 70px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  &__items {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.mobile-nav-link {
  font-size: 15px;
  line-height: 24px;
  font-weight: 400;
  color: $color-font-white;
  font-family: 'Space Mono', sans-serif;
  opacity: 0.8;
  text-decoration: none;
  padding: 12px 0;
  border-bottom: 1px solid $border-color-light;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
}
</style>
