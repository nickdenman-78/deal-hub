import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme-without-fonts';
import 'virtual:group-icons.css';
import '@miletorix/vitepress-image-viewer/style.css';
import './styles.css';
import './optInImageViewer';

export default {
  extends: DefaultTheme,
  enhanceApp() {
    // Image viewer is opt-in via the .zoomable class
    // See ./optInImageViewer.ts for implementation
    // Register site-wide Vue components here with app.component(...)
  },
} satisfies Theme;
