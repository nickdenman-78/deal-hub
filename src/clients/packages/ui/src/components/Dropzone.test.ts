import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Dropzone from './Dropzone.vue';

function makeFile(name: string): File {
  return new File(['x'], name, { type: 'application/octet-stream' });
}

describe('Dropzone', () => {
  it('is a single keyboard-reachable button with an accessible name', () => {
    const wrapper = mount(Dropzone);

    const zone = wrapper.find('[role="button"]');
    expect(zone.attributes('tabindex')).toBe('0');
    expect(zone.attributes('aria-label')).toBeTruthy();
  });

  it('emits the dropped file', async () => {
    const wrapper = mount(Dropzone);
    const file = makeFile('backup.csbak');

    await wrapper.find('.r-dropzone').trigger('drop', { dataTransfer: { files: [file] } });

    expect(wrapper.emitted('select')?.at(-1)).toEqual([[file]]);
  });

  it('takes only the first file unless multiple', async () => {
    const single = mount(Dropzone);
    const multi = mount(Dropzone, { props: { multiple: true } });
    const files = [makeFile('a.csv'), makeFile('b.csv')];

    await single.find('.r-dropzone').trigger('drop', { dataTransfer: { files } });
    await multi.find('.r-dropzone').trigger('drop', { dataTransfer: { files } });

    expect((single.emitted('select')!.at(-1)![0] as File[]).length).toBe(1);
    expect((multi.emitted('select')!.at(-1)![0] as File[]).length).toBe(2);
  });

  it('shows the drag-over state only while a drag is above it', async () => {
    const wrapper = mount(Dropzone);
    const zone = wrapper.find('.r-dropzone');

    await zone.trigger('dragover');
    expect(zone.classes()).toContain('r-dropzone--over');

    await zone.trigger('dragleave');
    expect(zone.classes()).not.toContain('r-dropzone--over');
  });

  it('ignores drops and clicks when disabled', async () => {
    const wrapper = mount(Dropzone, { props: { disabled: true } });
    const zone = wrapper.find('.r-dropzone');

    await zone.trigger('drop', { dataTransfer: { files: [makeFile('a')] } });
    await zone.trigger('dragover');

    expect(wrapper.emitted('select')).toBeUndefined();
    expect(zone.classes()).not.toContain('r-dropzone--over');
    expect(zone.attributes('tabindex')).toBeUndefined();
  });

  it('forwards accept and multiple to the hidden input', () => {
    const wrapper = mount(Dropzone, { props: { accept: '.csbak', multiple: true } });

    const input = wrapper.find('input[type="file"]');
    expect(input.attributes('accept')).toBe('.csbak');
    expect(input.attributes('multiple')).toBeDefined();
  });
});
