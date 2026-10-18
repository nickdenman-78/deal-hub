<script setup lang="ts">
/**
 * A panel of options docked to the trailing edge of the blade viewport.
 *
 * For the settings and confirmations a screen has that are not worth a row of
 * controls above the content — view options, display order, "are you sure". A
 * blade is often narrow, and a control bar spends the width the content needs
 * on choices nobody is making right now.
 *
 * It attaches to the *viewport*, not to the blade that opened it, which is
 * why it teleports rather than rendering in place. Anchored to a panel it
 * would slide away whenever the strip scrolled sideways, and it would be as
 * narrow as whichever blade happened to own it — including a 20rem one.
 *
 * Deliberately not a blade of its own. The stack is the route tree, and this
 * is view state: it does not survive a reload, it has no address, and a deep
 * link that reopened somebody's settings drawer would be a strange thing to
 * share.
 */
import { computed, inject, nextTick, onWatcherCleanup, useTemplateRef, watch, watchEffect } from 'vue';
import Button from '../components/Button.vue';
import { useFocusOrigin } from '../composables/useFocusOrigin';
import { trapTab } from '../composables/useFocusTrap';
import { bladeStackKey } from './context';
import type { BladeAsideSize } from './sizes';

const props = withDefaults(
  defineProps<{
    open: boolean;
    /** Names the region for assistive technology as well as heading it. */
    title: string;
    /**
     * Puts a scrim over the stack and keeps Tab inside. For a question that
     * has to be answered before anything else happens.
     */
    modal?: boolean;
    /**
     * Dismiss by clicking the scrim. Only applies when `modal` — there is no
     * scrim otherwise. Off for forms that must end on Cancel or a primary
     * action rather than a miss-click behind the panel.
     */
    closeOnScrimClick?: boolean;
    /**
     * Dismiss with Escape. Off for forms that must end on an explicit footer
     * action. Escape is still swallowed so the blade behind does not close.
     */
    closeOnEscape?: boolean;
    /** Panel width. `md` matches the historical fixed width. */
    size?: BladeAsideSize;
  }>(),
  { modal: false, closeOnScrimClick: true, closeOnEscape: true, size: 'md' },
);

const emit = defineEmits<{ close: [] }>();

defineSlots<{
  default(): unknown;
  /** Command bar, pinned to the foot, exactly as a blade's footer is. */
  footer?(): unknown;
}>();

// Undefined when an aside is used outside a stack, which is a caller error
// rather than a state to support: without a host there is nowhere to dock. It
// renders nothing instead of throwing, so a unit test that mounts a fragment
// of a screen does not fall over on it.
const stack = inject(bladeStackKey, undefined);
const host = computed(() => stack?.asideHost.value ?? null);

const root = useTemplateRef<HTMLElement>('root');

const focusOrigin = useFocusOrigin();

/**
 * The trigger this opened from, so dismissing puts the reader back on the
 * control they pressed rather than at the top of the document. Kept in a
 * plain variable rather than read on close: by then the active element is
 * inside the panel that is about to be removed.
 *
 * Resolved through useFocusOrigin rather than straight from
 * document.activeElement, because a click does not reliably focus what it
 * hits — see that file. Reading activeElement alone left this null whenever
 * the browser declined to focus the trigger, and focus went nowhere on close.
 */
let opener: HTMLElement | null = null;

/**
 * Whether the trigger should get focus back, decided where the intent is
 * known rather than inferred afterwards.
 *
 * Dismissing with Escape or the ✕ leaves focus nowhere, so it has to be put
 * back. Dismissing by clicking something behind has already put it somewhere
 * the reader chose, and dragging it back to the gear would undo the very
 * click that closed this.
 *
 * Reading `document.activeElement` in the watcher is not reliable: focus
 * delivery and Vue's pre-flush queue are both scheduled off the same event,
 * and the answer depends on which lands first.
 */
let restoreFocus = true;

/**
 * Whether a close is already under way.
 *
 * Without this, the FIRST decision does not win — the last one does, and the
 * last one is always wrong. Escape calls close(true), the panel then unmounts,
 * focus leaves it, `focusout` fires on the way out, and onFocusOut calls
 * close(false) — flipping restoreFocus back off before the watcher gets to
 * act on it. The reader is left on <body> having pressed Escape, which is
 * exactly the case restoring exists for.
 *
 * jsdom does not reproduce that teardown sequence, so this is a browser-only
 * failure that unit tests alone will not catch.
 */
let closing = false;

function close(restore: boolean) {
  if (closing) return;
  closing = true;
  restoreFocus = restore;
  emit('close');
}

/**
 * Open AND docked. Both halves matter: the panel only exists once the stack's
 * aside host is assigned, so watching `open` alone misses the case where an
 * aside mounts already-open — the watcher fires before there is anything in
 * the DOM to focus, or does not fire at all because `open` never transitions.
 * That left focus on <body>, which is the same failure mode as the missing
 * focus() below.
 */
const isVisible = computed(() => props.open && host.value !== null);

watch(
  isVisible,
  async (open) => {
    if (!open) {
      // `restore` no-ops on a detached node. A blade closing can take the
      // trigger with it, and focusing a removed element silently sends focus
      // to <body> — the exact outcome this is here to prevent.
      if (restoreFocus) focusOrigin.restore(opener);
      opener = null;
      restoreFocus = true;
      closing = false;
      return;
    }
    closing = false;
    opener = focusOrigin.resolve();
    // The panel has to exist before anything in it can take focus, and focus
    // has to land inside — that is not a nicety, it is what makes Escape and
    // the focus-out dismissal work at all. Both are element handlers on the
    // root, so an event fired while focus is on <body> never passes through
    // them: the keydown goes straight to the Blade's document listener and
    // closes the whole panel instead. Getting this wrong looked exactly like
    // "Escape closes the drawer AND the blade behind it".
    await nextTick();

    // The first control rather than the ✕ when there is a form here: on a
    // confirmation the input is what the reader came to use, and landing on
    // the close button means tabbing past the thing being asked about.
    //
    // NOTE: both selectors hard-code class names from blade.css. Renaming
    // either without changing it here breaks initial focus SILENTLY.
    const field = root.value?.querySelector<HTMLElement>('.r-blade-aside__body :is(input, select, textarea)');
    const closer = root.value?.querySelector<HTMLElement>('.r-blade-aside__header button');

    // Queried from the DOM rather than held as a template ref. @ets/ui's
    // Button is multi-root — v0's Button.Root renders the <button> plus a
    // placeholder for its hidden form input — so a ref on it yields the
    // component instance, which has no focus(). That threw, focus stayed on
    // <body>, and the bug above followed.
    //
    // The root itself is the last resort, and the reason it carries
    // tabindex="-1": an aside whose body is pure prose has nothing focusable
    // in it at all, and it must still catch Escape.
    (field ?? closer ?? root.value)?.focus();
  },
  // `immediate` so an already-open aside is focused on mount; `post` so the
  // teleported panel is in the DOM before anything in it is asked to take
  // focus.
  { immediate: true, flush: 'post' },
);

/**
 * Modal Escape must work even when focus is not inside the panel — clicking
 * the scrim leaves focus on <body>, and an element keydown on the root never
 * sees that press. Capture on document runs before Blade's bubble listener, so
 * preventDefault here is what stops Escape from closing the blade behind.
 *
 * Non-modal asides keep the element handler only: they dismiss on focus-out,
 * so a press that lands outside means they are already gone.
 */
watchEffect(() => {
  if (!isVisible.value || !props.modal) return;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    event.preventDefault();
    if (props.closeOnEscape) close(true);
  };

  document.addEventListener('keydown', onKeyDown, true);
  onWatcherCleanup(() => document.removeEventListener('keydown', onKeyDown, true));
});

/**
 * Escape closes this and nothing else — when allowed.
 *
 * Kept on the panel for non-modal asides (and as a belt for modal ones while
 * focus is inside). The blade underneath listens on `document` and skips
 * anything already handled, so marking the event is the whole of the
 * arrangement — without it one press would dismiss the drawer *and* close the
 * blade behind it.
 */
function onEscape(event: KeyboardEvent) {
  event.stopPropagation();
  event.preventDefault();
  if (props.closeOnEscape) close(true);
}

/**
 * Closes when focus leaves for any reason — clicking the content behind it,
 * or tabbing past the last control. A transient panel that stays open once
 * the reader has plainly moved on is one they have to dismiss by hand for no
 * reason.
 *
 * Not for a modal one, where leaving is the thing being prevented; Tab is
 * wrapped back round instead.
 */
function onFocusOut(event: FocusEvent) {
  if (props.modal) return;
  const next = event.relatedTarget as Node | null;
  if (next && root.value?.contains(next)) return;
  close(false);
}

function onScrimClick() {
  if (props.closeOnScrimClick) {
    close(true);
    return;
  }
  // A non-dismissing scrim click otherwise leaves focus on <body>. Put it
  // back so Tab stays trapped and the element Escape path still works.
  root.value?.focus();
}

/**
 * Tab, kept inside a modal pane.
 *
 * Hand-rolled rather than borrowed from <dialog>.showModal(), and the trade
 * is deliberate: a modal <dialog> goes into the top layer, which is the
 * browser viewport, and this has to sit against the *stack's* edge so that a
 * modal and an ordinary pane are the same object in the same place. What
 * showModal would have given for free is the scrim (drawn below), the focus
 * trap (here) and `inert` on everything else — which `aria-modal` announces
 * and the scrim enforces for the mouse, but which does not stop a screen
 * reader's own virtual cursor from wandering out. That is the known limit of
 * doing it this way.
 */
function onTab(event: KeyboardEvent) {
  if (!props.modal) return;
  trapTab(event, root.value);
}
</script>

<template>
  <!-- Teleport stays mounted while the stack has a host so leave transitions
       can finish; only the inner layer is v-if'd on `open`. -->
  <Teleport v-if="host" :to="host">
    <Transition name="r-blade-aside">
      <div v-if="open" class="r-blade-aside__layer">
        <!-- Below the panel and above the blades. Clicking it dismisses when
             allowed — that is the cancel path for light questions. Forms that
             require an explicit Cancel/primary keep `closeOnScrimClick` off. -->
        <div v-if="modal" class="r-blade-aside__scrim" @click="onScrimClick"></div>

        <!-- role="dialog" only when it is one. An ordinary pane is a cluster of
             controls belonging to the screen behind it, and calling that a dialog
             would promise a focus trap and an inert background it does not have. -->
        <!-- tabindex="-1" makes the panel programmatically focusable without
             putting it in the tab order. Two jobs: it is the last-resort focus
             target when the body holds nothing focusable, and it catches focus when
             someone clicks a non-focusable area inside — which would otherwise send
             focus to <body> and take Escape with it. -->
        <div
          ref="root"
          class="r-blade-aside"
          :class="`r-blade-aside--${size}`"
          tabindex="-1"
          :role="modal ? 'dialog' : 'group'"
          :aria-modal="modal ? 'true' : undefined"
          :aria-label="title"
          @keydown.esc="onEscape"
          @keydown="onTab"
          @focusout="onFocusOut"
        >
          <div class="r-blade-aside__header">
            <h3 class="r-blade-aside__title">{{ title }}</h3>
            <Button
              variant="text"
              size="sm"
              icon="x"
              :aria-label="`Close ${title.toLowerCase()}`"
              :title="closeOnEscape ? 'Close (Esc)' : 'Close'"
              @click="close(true)"
            />
          </div>

          <div class="r-blade-aside__body">
            <slot />
          </div>

          <!-- A sibling of the body, not the last thing inside it, so the commands
               stay reachable however long the question gets. The blade's own footer
               makes the same bargain. -->
          <div v-if="$slots.footer" class="r-blade-aside__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
