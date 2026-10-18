import { bootstrapTheme, createNotificationsPlugin, installBladeRouter, registerEtsIcons } from '@ets/ui';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { createEtsRouter } from './router';
import './styles.css';

const app = createApp(App);
app.use(createPinia());

const router = createEtsRouter();
app.use(router);

// After use(router), before mount: registers the navigation-state guard the
// blade skeleton panel reads.
installBladeRouter(app, router);

// Backs useToast(); ToastHost renders the queue. Without it toasts silently
// do nothing rather than throw.
app.use(createNotificationsPlugin());

// Icons resolve from the offline Lucide subset in @ets/ui. Must run before the
// first <Icon> renders, or Iconify would fetch from its CDN.
registerEtsIcons();

// Before mount, so there is no flash of the light theme.
bootstrapTheme({ storageKey: 'ets.theme' });

app.mount('#app');
