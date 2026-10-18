import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { editorAppearanceKey, useEditorAppearance } from './appearance';

describe('useEditorAppearance', () => {
  it('follows document data-theme when prop is unset (null)', async () => {
    document.documentElement.dataset.theme = 'dark';
    let seen!: { value: boolean };

    const Probe = defineComponent({
      setup() {
        // Simulate Vue Boolean coercion risk: callers must pass null = unset.
        seen = useEditorAppearance(() => null);
        return () => h('div');
      },
    });

    mount(Probe);
    expect(seen.value).toBe(true);

    document.documentElement.dataset.theme = 'light';
    await nextTick();
    expect(seen.value).toBe(false);
  });

  it('does NOT treat boolean false from omitted prop as force-light', () => {
    // Regression: Vue coerces omitted `isDark?: boolean` to false. Using
    // `fromProp !== undefined` then forever forced light. Explicit false must
    // still force light; omitted must be passed as null.
    document.documentElement.dataset.theme = 'dark';
    let forcedLight!: { value: boolean };
    let unset!: { value: boolean };

    mount(
      defineComponent({
        setup() {
          forcedLight = useEditorAppearance(() => false);
          return () => h('div');
        },
      }),
    );
    mount(
      defineComponent({
        setup() {
          unset = useEditorAppearance(() => null);
          return () => h('div');
        },
      }),
    );

    expect(forcedLight.value).toBe(false);
    expect(unset.value).toBe(true);
  });

  it('ignores stale inject when data-theme is painted', () => {
    document.documentElement.dataset.theme = 'dark';
    let seen!: { value: boolean };

    mount(
      defineComponent({
        setup() {
          seen = useEditorAppearance(() => null);
          return () => h('div');
        },
      }),
      {
        global: {
          provide: {
            [editorAppearanceKey as symbol]: { isDark: false },
          },
        },
      },
    );

    expect(seen.value).toBe(true);
  });

  it('uses Symbol.for so plugin and editor share one inject key', () => {
    expect(editorAppearanceKey).toBe(Symbol.for('ets.editor.appearance'));
  });
});
