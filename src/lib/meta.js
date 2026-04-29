/**
 * Utility for tracking Meta Pixel events
 */
export const trackEvent = (eventName, data = {}) => {
  if (window.fbq) {
    window.fbq('track', eventName, data);
  } else {
    console.warn('Meta Pixel not initialized.', eventName, data);
  }
};

export const trackCustomEvent = (eventName, data = {}) => {
  if (window.fbq) {
    window.fbq('trackCustom', eventName, data);
  } else {
    console.warn('Meta Pixel not initialized.', eventName, data);
  }
};
