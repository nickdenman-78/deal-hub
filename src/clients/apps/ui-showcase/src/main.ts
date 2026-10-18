import {
  bootstrapTheme,
  createNotificationsPlugin,
  createEtsEditorPlugin,
  installBladeRouter,
  registerEtsIcons,
} from '@ets/ui';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './styles.css';

/*
 * Bootstrap order mirrors what a real app must do, because getting it wrong
 * here is the cheapest place to find out:
 *
 *   1. registerEtsIcons() before anything renders — otherwise <Icon> tries
 *      the Iconify CDN, which is exactly what the offline subset exists to
 *      avoid.
 *   2. bootstrapTheme() before mount() — mounting first paints light, then
 *      flips, which is a visible flash on every load for dark-mode users.
 *   3. createEtsEditorPlugin() after theme + icons — skins `@ets/editor`
 *      for Monaco appearance and toolbar/dialog chrome.
 */
registerEtsIcons();
bootstrapTheme({ storageKey: 'ets-ui-showcase.theme' });

const app = createApp(App);
app.use(router);

// ToastHost reads this. v0 ships a null-object fallback when the plugin is
// missing, so forgetting it makes toasts silently do nothing rather than throw.
app.use(createNotificationsPlugin());
app.use(createEtsEditorPlugin());

// After app.use(router), before mount. Registers beforeEach FIRST, so the
// pending-navigation state observes navigations that the stack's dirty guard
// later aborts — registered the other way round, a blocked navigation would
// never read as pending.
installBladeRouter(app, router);

app.mount('#app');
