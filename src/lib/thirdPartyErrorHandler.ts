/**
 * Third-Party Error Handler
 *
 * Industry-standard approach for handling errors from external widgets and SDKs
 * that we don't control (e.g., payment gateways, analytics, chat widgets).
 *
 * Pattern: Defense in Depth
 * - Layer 1: Global error interception
 * - Layer 2: Promise rejection handling
 * - Layer 3: Missing global shims
 * - Layer 4: Console error suppression
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onunhandledrejection
 */

export interface ThirdPartyErrorConfig {
  /** Identifiers for third-party code (file names, URLs, error messages) */
  identifiers: string[];
  /** Whether to log suppressed errors for debugging */
  debug?: boolean;
  /** Custom error handler for specific third-party errors */
  onError?: (error: Error | ErrorEvent | PromiseRejectionEvent) => void;
}

class ThirdPartyErrorHandler {
  private config: ThirdPartyErrorConfig;
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;
  private errorListenerAdded = false;
  private rejectionListenerAdded = false;

  constructor(config: ThirdPartyErrorConfig) {
    this.config = config;
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
  }

  /**
   * Initialize error handling
   */
  public initialize(): () => void {
    this.setupGlobalErrorHandler();
    this.setupPromiseRejectionHandler();
    this.setupMissingGlobalShims();
    this.setupConsoleErrorInterceptor();
    this.setupConsoleWarnInterceptor();

    // Return cleanup function
    return () => this.cleanup();
  }

  /**
   * Layer 1: Intercept global errors
   */
  private setupGlobalErrorHandler() {
    if (this.errorListenerAdded) return;

    const handleError = (event: ErrorEvent) => {
      if (this.isThirdPartyError(event)) {
        this.logDebug("Global error intercepted", {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });

        if (this.config.onError) {
          try {
            this.config.onError(event);
          } catch (err) {
            // Ignore errors in error handler
          }
        }

        // Prevent error from propagating
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
      return false;
    };

    window.addEventListener("error", handleError, true); // Use capture phase
    this.errorListenerAdded = true;
  }

  /**
   * Layer 2: Intercept unhandled promise rejections
   */
  private setupPromiseRejectionHandler() {
    if (this.rejectionListenerAdded) return;

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;

      if (this.isThirdPartyRejection(reason)) {
        this.logDebug("Promise rejection intercepted", {
          type: reason?.constructor?.name,
          message: reason?.message,
          stack: reason?.stack?.substring(0, 200),
        });

        if (this.config.onError) {
          try {
            this.config.onError(event);
          } catch (err) {
            // Ignore errors in error handler
          }
        }

        // Prevent unhandled rejection warning
        event.preventDefault();
        return true;
      }
      return false;
    };

    window.addEventListener("unhandledrejection", handleRejection, true);
    this.rejectionListenerAdded = true;
  }

  /**
   * Layer 3: Provide missing globals that third-party code expects
   * This prevents "ReferenceError: X is not defined" errors
   */
  private setupMissingGlobalShims() {
    const win = window as any;

    // Shim for common missing globals in third-party widgets
    const shims = {
      // Router-related (Monicredit uses Vue Router)
      next: () => {
        this.logDebug("Shim: next() called (noop)");
      },

      // Module loading
      __esModule: true,

      // Common payment gateway globals
      PaymentCallback: () => {
        this.logDebug("Shim: PaymentCallback() called (noop)");
      },
    };

    // Only add shims if they don't exist
    Object.entries(shims).forEach(([key, value]) => {
      if (typeof win[key] === "undefined") {
        try {
          Object.defineProperty(win, key, {
            value,
            writable: true,
            configurable: true,
            enumerable: false, // Don't pollute window
          });
          this.logDebug(`Shim: Added global '${key}'`);
        } catch (err) {
          // Ignore if can't define property
        }
      }
    });
  }

  /**
   * Layer 4: Intercept console.error to suppress third-party noise
   */
  private setupConsoleErrorInterceptor() {
    console.error = (...args: any[]) => {
      const message = args.join(" ");

      // Check if error is from third-party code
      const isThirdParty = this.config.identifiers.some((id) =>
        message.toLowerCase().includes(id.toLowerCase())
      );

      if (isThirdParty) {
        this.logDebug("Console error suppressed", { message });
        return;
      }

      // Pass through legitimate errors
      this.originalConsoleError.apply(console, args);
    };
  }

  /**
   * Layer 5: Intercept console.warn to suppress third-party warnings
   */
  private setupConsoleWarnInterceptor() {
    console.warn = (...args: any[]) => {
      const message = args.join(" ");

      // Check if warning is from third-party code
      const isThirdParty = this.config.identifiers.some((id) =>
        message.toLowerCase().includes(id.toLowerCase())
      );

      if (isThirdParty) {
        this.logDebug("Console warning suppressed", { message });
        return;
      }

      // Pass through legitimate warnings
      this.originalConsoleWarn.apply(console, args);
    };
  }

  /**
   * Check if an ErrorEvent is from third-party code
   */
  private isThirdPartyError(event: ErrorEvent): boolean {
    const { message = "", filename = "" } = event;

    return this.config.identifiers.some(
      (id) =>
        message.includes(id) ||
        filename.includes(id) ||
        // Check for common third-party error patterns
        (message.includes("Cannot read propert") && filename.includes(".js")) ||
        message.includes("is not defined")
    );
  }

  /**
   * Check if a promise rejection is from third-party code
   */
  private isThirdPartyRejection(reason: any): boolean {
    if (!reason) return false;

    const message = reason.message || "";
    const stack = reason.stack || "";
    const url = reason.config?.url || "";

    return this.config.identifiers.some(
      (id) =>
        message.includes(id) ||
        stack.includes(id) ||
        url.includes(id) ||
        // Check for common third-party error patterns
        (reason instanceof TypeError && stack.includes(".js")) ||
        (reason instanceof ReferenceError && stack.includes(".js"))
    );
  }

  /**
   * Log debug information if enabled
   */
  private logDebug(message: string, data?: any) {
    if (this.config.debug) {
      console.debug(`[ThirdPartyErrorHandler] ${message}`, data || "");
    }
  }

  /**
   * Cleanup handlers
   */
  private cleanup() {
    // Restore original console methods
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;

    // Note: We don't remove event listeners as they may still be needed
    // for other third-party widgets loaded later
  }
}

/**
 * Pre-configured handler for payment gateway widgets and third-party SDKs
 */
export const createPaymentGatewayErrorHandler = () => {
  return new ThirdPartyErrorHandler({
    identifiers: [
      // Monicredit & Fraud Detection
      "monicredit",
      "4aa5b64a",
      "a03afd9",
      "cancel-transaction",
      "fingerprint",
      "MerchantId",
      "0b2f1160-7e90-4206-82b3-202cabd3cddf",
      "/v2.22/fingerprint",

      // Common payment gateway identifiers
      "paystack",
      "flutterwave",

      // Datadog Browser SDK
      "Datadog Browser SDK",
      "No storage available for session",
      "datadoghq",
      "datadog-browser-agent",
      "we will not send any data",

      // CSP-related third-party warnings
      "Content Security Policy directive",
      "script-src-elem",
      "The query component",
      "will be ignored",
      "contains a source with an invalid path",

      // Common error patterns in payment widgets
      "next is not defined",
      "__esModule",
      "play() failed",
      "user didn't interact",
    ],
    debug: import.meta.env.DEV, // Only log in development
  });
};

/**
 * Initialize global third-party error handling
 * Should be called as early as possible in app lifecycle
 */
export const initializeThirdPartyErrorHandling = () => {
  const handler = createPaymentGatewayErrorHandler();
  return handler.initialize();
};

