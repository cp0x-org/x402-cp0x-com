import { createRouter, createWebHistory, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import FacilitatorsView from '@/views/FacilitatorsView.vue';
import FacilitatorDetailView from '@/views/FacilitatorDetailView.vue';
import ResourcesView from '@/views/ResourcesView.vue';
import ReportsView from '@/views/ReportsView.vue';
import ReportDetailView from '@/views/ReportDetailView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'facilitators', component: FacilitatorsView },
  { path: '/facilitators', redirect: '/' },
  { path: '/facilitators/:id', name: 'facilitator-detail', component: FacilitatorDetailView },
  { path: '/resources', name: 'resources', component: ResourcesView },
  { path: '/services', redirect: '/resources' },
  { path: '/reports', name: 'reports', component: ReportsView },
  { path: '/reports/:id/:lang?', name: 'report-detail', component: ReportDetailView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

// Hash routing for static hosting (IPFS) where the server can't rewrite paths;
// clean history routing everywhere else. Toggled at build time by vite.config.js.
const router = createRouter({
  history: __HASH_ROUTER__ ? createWebHashHistory() : createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 100 };
    if (to.path !== from.path) return { top: 0 };
    return undefined;
  },
});

export default router;
