/**
 * Error Boundary Component
 *
 * React Error Boundary that catches errors in the component tree
 * and prevents the entire app from crashing.
 *
 * This is particularly useful for isolating third-party widgets
 * and components that might throw unexpected errors.
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Component name for logging purposes */
  componentName?: string;
  /** Fallback UI to show when error occurs */
  fallback?: ReactNode;
  /** Whether to show error details (only in development) */
  showDetails?: boolean;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName = "Unknown", onError } = this.props;

    // Log error details
    console.error(`[ErrorBoundary:${componentName}] Caught error:`, {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (err) {
        console.error("[ErrorBoundary] Error in onError callback:", err);
      }
    }
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = false, componentName } = this.props;

    if (hasError) {
      // If custom fallback provided, use it
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Something went wrong
                </h3>
                {componentName && (
                  <p className="text-sm text-gray-500">
                    Error in: {componentName}
                  </p>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>

            {(showDetails || isDevelopment) && error && (
              <details className="mt-4">
                <summary className="text-xs font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 text-xs">
                  <div className="mb-2">
                    <span className="font-semibold text-gray-700">Error:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-red-600">
                      {error.toString()}
                    </pre>
                  </div>
                  {errorInfo?.componentStack && (
                    <div>
                      <span className="font-semibold text-gray-700">
                        Component Stack:
                      </span>
                      <pre className="mt-1 whitespace-pre-wrap text-gray-600 max-h-40 overflow-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component that wraps a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
}

