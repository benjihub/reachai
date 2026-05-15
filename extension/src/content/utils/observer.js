/**
 * MutationObserver wrapper for content scripts
 * Useful for tracking DOM changes in SPAs like LinkedIn
 */

export class DOMObserver {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.observer = null;
    this.options = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'data-*'],
      ...options
    };
  }

  start(element = document.body) {
    if (!element) {
      console.error('No element provided to observe');
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      this.callback(mutations);
    });

    this.observer.observe(element, this.options);
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

export default DOMObserver;
