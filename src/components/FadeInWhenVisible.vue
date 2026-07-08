<template>
  <div ref="el" class="fade-in" :class="{ visible }">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const el = ref<HTMLElement | null>(null);
const visible = ref(false);

onMounted(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        visible.value = true;
        observer.disconnect();
      }
    },
    { threshold: 0.1 }
  );
  if (el.value) observer.observe(el.value);
});
</script>

<style scoped>
.fade-in {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 1.2s ease, transform 1.2s ease;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
