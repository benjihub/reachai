/**
 * Safe DOM query helpers for content scripts
 */

export const querySafe = (selector, root = document) => {
  try {
    return root.querySelector(selector);
  } catch (error) {
    console.error(`Safe query failed for selector: ${selector}`, error);
    return null;
  }
};

export const querySafeAll = (selector, root = document) => {
  try {
    return Array.from(root.querySelectorAll(selector));
  } catch (error) {
    console.error(`Safe queryAll failed for selector: ${selector}`, error);
    return [];
  }
};

export const injectButton = (container, buttonElement) => {
  if (!container || !buttonElement) {
    console.error('Invalid container or button element');
    return false;
  }

  try {
    container.appendChild(buttonElement);
    return true;
  } catch (error) {
    console.error('Failed to inject button:', error);
    return false;
  }
};
