/**
 * Opt-in Image Viewer
 *
 * Converts @miletorix/vitepress-image-viewer from opt-out to opt-in.
 * Only images with the .zoomable class will have the viewer enabled.
 *
 * This works by:
 * 1. Intercepting the default plugin's querySelectorAll calls
 * 2. Filtering results to only include .zoomable images
 *
 * Usage:
 * - Markdown: ![Alt text](./image.png){.zoomable}
 * - HTML: <img src="./image.png" alt="Description" class="zoomable" />
 */

if (typeof window !== 'undefined' && !window.__vitepress_opt_in_image_viewer_patched) {
  window.__vitepress_opt_in_image_viewer_patched = true;

  // Store the original querySelectorAll
  const originalQuerySelectorAll = Document.prototype.querySelectorAll;

  // Override querySelectorAll to intercept the image viewer's queries
  Document.prototype.querySelectorAll = function (selector: string): NodeListOf<Element> {
    const results = originalQuerySelectorAll.call(this, selector);

    // If this is the image viewer querying for images, filter to only .zoomable
    if (typeof selector === 'string' && selector.includes('img:not(.no-viewer)')) {
      const filtered = Array.from(results).filter((el) => {
        return el instanceof HTMLImageElement && el.classList.contains('zoomable');
      });

      // Return a NodeList-like object
      return {
        length: filtered.length,
        item: (index: number) => filtered[index] || null,
        forEach: function (callback: (value: Element, key: number, parent: NodeListOf<Element>) => void) {
          filtered.forEach((el, index) => callback(el, index, this as NodeListOf<Element>));
        },
        entries: function* () {
          for (let i = 0; i < filtered.length; i++) {
            yield [i, filtered[i]] as [number, Element];
          }
        },
        keys: function* () {
          for (let i = 0; i < filtered.length; i++) {
            yield i;
          }
        },
        values: function* () {
          for (const el of filtered) {
            yield el;
          }
        },
        [Symbol.iterator]: function* () {
          for (const el of filtered) {
            yield el;
          }
        },
      } as NodeListOf<Element>;
    }

    return results;
  };
}

// Now import and initialize the plugin normally
if (typeof window !== 'undefined') {
  import('@miletorix/vitepress-image-viewer').then(({ default: ImageViewerPlugin }) => {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        ImageViewerPlugin(null as any);
      });
    } else {
      ImageViewerPlugin(null as any);
    }
  });
}

declare global {
  interface Window {
    __vitepress_opt_in_image_viewer_patched?: boolean;
  }
}
