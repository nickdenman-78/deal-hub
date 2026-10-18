<script setup lang="ts">
/**
 * One panel, as markup and nothing else. It knows no routing, no depth and no
 * registry — Blade owns all of that and hands the result down, and
 * BladeErrorPanel reuses this to render a failure that still looks like a
 * blade.
 *
 * Class names are the package's own, `r-`-prefixed and unscoped, matching the
 * rest of @ets/ui. Scoped styles would force every consumer override
 * through :deep(), which is exactly the friction being left behind with
 * PrimeVue.
 */
import { nextTick, ref, watch } from 'vue';
import Button from '../components/Button.vue';
import { focusablesIn } from '../composables/useFocusTrap';
import type { BladeMinSize, BladeSize } from '../blade/sizes';

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string | undefined;
    size: BladeSize;
    /** Width floor. Only bites on `fill`, whose default floor is `lg`. */
    minSize?: BladeMinSize | undefined;
    /** Whether to render the ✕. Blade decides; this only draws it. */
    closable: boolean;
    /** Tooltip on the ✕ — says "(Esc)" only on the blade Escape would close. */
    closeHint: string;
    /** Mobile: every blade but the focused one is hidden rather than unmounted. */
    hidden?: boolean;
    /**
     * True while this panel is the stack's focus target (deepest blade, or the
     * mobile crumb selection). Becoming true — mount, sibling swap, closing a
     * child, mobile un-hide — moves focus into the panel.
     */
    ownsFocus?: boolean;
    order: number;
    /**
     * Stable address for this panel (usually its route path). Nested panels
     * re-run the slide-in when this changes without unmounting — e.g. picking
     * another group while a group blade is already open.
     */
    identity?: string;
  }>(),
  { minSize: undefined, hidden: false, ownsFocus: true, identity: undefined },
);

defineEmits<{ close: [] }>();

defineSlots<{
  default(): unknown;
  actions?(): unknown;
  footer?(): unknown;
  subtitle?(): unknown;
  /**
   * Compact control on the title row (e.g. copy-reference), after the heading
   * text and before the header `#actions` / ✕ cluster.
   */
  titleEnd?(): unknown;
}>();

const root = ref<HTMLElement | null>(null);

/** Nested blades only — true while the emerge-from-under-parent animation runs. */
const sliding = ref(false);

function onSlideEnd(event: AnimationEvent) {
  if (event.animationName !== 'r-blade-slide-in') return;
  // Drop the class so z-index returns to normal; while sliding the panel sits
  // under its parent, and must not stay there after it has settled.
  sliding.value = false;
}

/**
 * Put focus on the first useful control when this panel owns the stack focus.
 *
 * Same rule as BladeAside: prefer body/footer/actions over the header ✕, so
 * landing on Close is not the default Tab stop after a drill-down. The ✕ is
 * used only when it is the sole focusable control (or the panel itself as a
 * last resort — tabindex="-1" below — so Escape still has somewhere to live).
 *
 * No focus trap: the stack is not modal. Tab may leave into the shell or a
 * parent blade on purpose.
 */
function focusInitial() {
  const el = root.value;
  if (!el || props.hidden || !props.ownsFocus) return;

  // An open BladeAside holds focus on purpose — it teleports outside the
  // panel, so it never shows up in focusablesIn. Pulling focus back here fires
  // the aside's focus-out dismissal and closes it on the spot (or, modal,
  // strands Escape on the wrong element). Its double-nextTick timing lands
  // this call AFTER the aside's own focus move, so without this check the
  // panel always won.
  if (document.activeElement?.closest('.r-blade-aside')) return;

  const items = focusablesIn(el);
  const closeBtn = el.querySelector<HTMLElement>('.r-blade__close');
  const preferred = items.find((item) => item !== closeBtn);
  // preventScroll is load-bearing, not a nicety. A plain focus() scrolls the
  // element's ancestors to reveal it, and the strip is one of them — that
  // cancels the smooth scroll BladeStack started for this very panel, leaving
  // the strip wherever the animation had got to (usually: not moved at all,
  // with the new panel's trailing edge cut off). Positioning the strip is the
  // stack's job; this call only moves the caret.
  (preferred ?? items[0] ?? el).focus({ preventScroll: true });
}

/**
 * flush post: the teleported DOM and slotted body must exist before we walk
 * focusables. A second nextTick beats the common case where the BladeLink that
 * opened this panel re-asserts focus at the end of the click that navigated
 * here — without it, sibling swaps (metadata ↔ workbench) leave focus on the
 * parent link.
 */
watch(
  () => props.ownsFocus && !props.hidden,
  (active) => {
    if (!active) return;
    void nextTick(() => {
      void nextTick(focusInitial);
    });
  },
  { flush: 'post', immediate: true },
);

/**
 * Replay the slide when this panel's address changes in place. Vue Router
 * reuses the same component for `/groups/a` → `/groups/b`, so without this
 * the panel would sit still and the operator would get no motion feedback.
 */
watch(
  () => props.identity,
  async (next, prev) => {
    if (props.order <= 0) return;
    if (prev === undefined || next === undefined || next === prev) return;
    await startSlide();
  },
);

async function startSlide() {
  if (props.order <= 0) return;
  // Reduced motion: skip the under-parent pass entirely (animationend never
  // fires when animation is none, which would leave z-index stuck at 0).
  // matchMedia is missing in jsdom (same guard as useIsMobile); no animation
  // runs there either, so it takes the same skip.
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    sliding.value = false;
    return;
  }
  sliding.value = false;
  await nextTick();
  void root.value?.offsetWidth;
  sliding.value = true;
}

// First paint for a nested panel — same path as an identity change, minus the
// false→true restart (there is nothing to tear down yet).
if (props.order > 0) {
  void startSlide();
}
</script>

<template>
  <!-- :style rather than a style attribute: Vue writes it through the CSSOM,
       which a `style-src-attr 'none'` CSP does not govern. Visual order is
       CSS `order` because teleported DOM order is arbitrary. -->
  <!-- tabindex="-1": programmatically focusable when the body has nothing
       tabbable (spinner, empty state), without inventing a Tab stop. -->
  <section
    ref="root"
    class="r-blade"
    :class="[
      `r-blade--${size}`,
      minSize ? `r-blade--min-${minSize}` : null,
      {
        'r-blade--hidden': hidden,
        /* Nested panels slide out from under their parent (left → right). */
        'r-blade--slide': sliding,
      },
    ]"
    :style="{ order }"
    :aria-label="title"
    tabindex="-1"
    @animationend="onSlideEnd"
  >
    <header class="r-blade__header">
      <!-- The subtitle line is always rendered, empty or not. Every header in
           the strip has to come out the same height — they sit shoulder to
           shoulder, so one that is a line shorter than its neighbour reads as a
           misalignment rather than as an absent subtitle. Reserving the space in
           the markup keeps the height derived from the type metrics instead of
           from a magic number in the CSS. -->
      <div class="r-blade__heading">
        <!-- title-row wraps title + titleEnd + subtitle together when an end
             control is present, so the header stays one formatting context.
             Without titleEnd, title and subtitle stay bare siblings (same as
             the list-blade path) so a lone flex/grid wrapper never shifts type. -->
        <div v-if="$slots.titleEnd" class="r-blade__title-row">
          <h2 class="r-blade__title">{{ title }}</h2>
          <div class="r-blade__title-end">
            <slot name="titleEnd" />
          </div>
          <div class="r-blade__subtitle">
            <slot name="subtitle">{{ subtitle }}</slot>
          </div>
        </div>
        <template v-else>
          <h2 class="r-blade__title">{{ title }}</h2>
          <div class="r-blade__subtitle">
            <slot name="subtitle">{{ subtitle }}</slot>
          </div>
        </template>
      </div>

      <slot name="actions" />

      <Button
        v-if="closable"
        class="r-blade__close"
        variant="text"
        size="sm"
        icon="x"
        :title="closeHint"
        :aria-label="`Close ${title}`"
        @click="$emit('close')"
      />
    </header>

    <div class="r-blade__body">
      <slot />
    </div>

    <!-- A sibling of the scrolling body, not the last thing inside it, so a
         command bar stays reachable however long the content gets. -->
    <div v-if="$slots.footer" class="r-blade__footer">
      <slot name="footer" />
    </div>
  </section>
</template>
