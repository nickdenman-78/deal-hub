<script setup lang="ts">
/**
 * One-button theme cycle: System → Light → Dark → System.
 *
 * This is the control that packages `useThemeCycle` — which glyph means "follow
 * the OS", what the tooltip says, and how the cycle orders are all design
 * decisions owned here. Apps should render this rather than wiring Button +
 * useThemeCycle themselves; diverging icons or cycle order is how two surfaces
 * of the same product stop agreeing.
 *
 * Default is icon-only (toolbar). Pass `labeled` for a text label beside the
 * icon; `showResolved` appends the live OS appearance when preference is
 * `system` (e.g. "System (dark)") — useful on showcase / debug surfaces.
 */
import { computed } from 'vue';
import Button, { type ButtonSeverity, type ButtonSize, type ButtonVariant } from './Button.vue';
import { useTheme } from '../composables/useTheme';
import { useThemeCycle } from '../composables/useThemeCycle';

const props = withDefaults(
  defineProps<{
    /** Show the preference label next to the icon. Default is icon-only. */
    labeled?: boolean;
    /**
     * When labeled and preference is `system`, append the resolved appearance
     * — e.g. "System (dark)". Product toolbars usually leave this off.
     */
    showResolved?: boolean;
    severity?: ButtonSeverity;
    variant?: ButtonVariant;
    size?: ButtonSize;
  }>(),
  {
    labeled: false,
    showResolved: false,
    severity: 'secondary',
    variant: 'text',
    size: 'md',
  },
);

const { isDark } = useTheme();
const { current, tooltip, cycle } = useThemeCycle();

const labelText = computed(() => {
  if (!props.labeled) return '';
  if (props.showResolved && current.value.value === 'system') {
    return `${current.value.label} (${isDark.value ? 'dark' : 'light'})`;
  }
  return current.value.label;
});
</script>

<template>
  <!-- Two roots rather than a conditional slot: Button infers icon-only from
       `!slots.default`, and a `<template v-if="false">` still registers a
       default slot — which would leave the icon-only size/padding never
       applied. -->
  <Button
    v-if="labeled"
    :severity="severity"
    :variant="variant"
    :size="size"
    :icon="current.icon"
    :title="tooltip"
    :aria-label="tooltip"
    @click="cycle"
  >
    {{ labelText }}
  </Button>
  <Button
    v-else
    :severity="severity"
    :variant="variant"
    :size="size"
    :icon="current.icon"
    :title="tooltip"
    :aria-label="tooltip"
    @click="cycle"
  />
</template>
