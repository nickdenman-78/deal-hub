import { inject } from 'vue';
import { appLayoutKey, type AppLayoutContext } from './context';

/**
 * Collapse / narrow / mobile-nav state from the enclosing AppLayout.
 *
 * Use in slotted brand/footer content when the caller's chrome needs to react
 * to rail mode (e.g. hide a product name when collapsed).
 */
export function useAppLayout(): AppLayoutContext {
  const ctx = inject(appLayoutKey, null);
  if (!ctx) {
    throw new Error('useAppLayout() requires an enclosing <AppLayout>');
  }
  return ctx;
}
