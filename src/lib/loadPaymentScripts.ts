/**
 * Payment Script Lazy Loader
 *
 * Industry-standard approach: Load payment gateway scripts only when needed,
 * not globally on every page. This prevents:
 * 1. Unnecessary network requests on landing pages
 * 2. Third-party script warnings in console
 * 3. Fingerprinting/tracking on pages without payments
 * 4. Performance impact from unused scripts
 *
 * @see https://developers.paystack.co/docs/paystack-inline
 */

interface LoadScriptOptions {
  src: string;
  id?: string;
  async?: boolean;
  defer?: boolean;
}

/**
 * Generic script loader with promise-based loading
 */
function loadScript(options: LoadScriptOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if (options.id && document.getElementById(options.id)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = options.src;
    if (options.id) script.id = options.id;
    if (options.async) script.async = true;
    if (options.defer) script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${options.src}`));

    document.head.appendChild(script);
  });
}

/**
 * Load Paystack Inline JS
 * Call this before initializing Paystack payments
 *
 * @example
 * ```typescript
 * await loadPaystackScript();
 * const handler = PaystackPop.setup({ ... });
 * ```
 */
export async function loadPaystackScript(): Promise<void> {
  try {
    await loadScript({
      src: 'https://js.paystack.co/v1/inline.js',
      id: 'paystack-inline-js',
      async: true,
    });
    console.log('[PaymentScripts] ✓ Paystack loaded');
  } catch (error) {
    console.error('[PaymentScripts] Failed to load Paystack:', error);
    throw error;
  }
}

/**
 * Load Monnify SDK
 * Call this before initializing Monnify payments
 */
export async function loadMonnifyScript(): Promise<void> {
  try {
    await loadScript({
      src: 'https://sdk.monnify.com/plugin/monnify.js',
      id: 'monnify-sdk-js',
      async: true,
    });
    console.log('[PaymentScripts] ✓ Monnify loaded');
  } catch (error) {
    console.error('[PaymentScripts] Failed to load Monnify:', error);
    throw error;
  }
}

/**
 * Preload payment scripts in background (optional)
 * Use this on pages where payment is likely but not immediate
 *
 * @example
 * ```typescript
 * // On dashboard or pricing page
 * preloadPaymentScripts();
 * ```
 */
export function preloadPaymentScripts(): void {
  // Use link rel="preload" for better performance
  const paystackPreload = document.createElement('link');
  paystackPreload.rel = 'preload';
  paystackPreload.as = 'script';
  paystackPreload.href = 'https://js.paystack.co/v1/inline.js';
  document.head.appendChild(paystackPreload);
}

/**
 * Check if Paystack is already loaded
 */
export function isPaystackLoaded(): boolean {
  return typeof (window as any).PaystackPop !== 'undefined';
}

/**
 * Ensure Paystack is loaded before use
 * Combines check + load in one call
 *
 * @example
 * ```typescript
 * await ensurePaystackLoaded();
 * // Now safe to use PaystackPop
 * ```
 */
export async function ensurePaystackLoaded(): Promise<void> {
  if (!isPaystackLoaded()) {
    await loadPaystackScript();
  }
}

