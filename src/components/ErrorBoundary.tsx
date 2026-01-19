/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree and displays
 * a fallback UI instead of crashing the entire application.
 *
 * Features:
 * - Catches rendering errors
 * - Logs errors to console
 * - Shows user-friendly error message
 * - Provides retry mechanism
 * - Can report errors to monitoring service
 *
 * @module components/ErrorBoundary
 */

'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to protect */
  children: ReactNode;
  /** Custom fallback UI (optional) */
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Identifier for this boundary (for logging) */
  boundaryName?: string;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
  /** Additional error information */
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Wraps components to catch and handle errors gracefully.
 *
 * @example
 * ```tsx
 * <ErrorBoundary boundaryName="PaymentPage">
 *   <PaymentPage />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, errorInfo, reset) => (
 *     <CustomErrorUI error={error} onReset={reset} />
 *   )}
 *   onError={(error, errorInfo) => {
 *     // Send to error monitoring service
 *     logErrorToService(error, errorInfo);
 *   }}
 * >
 *   <CriticalComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Handle the error when it occurs
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, boundaryName } = this.props;

    // Log error to console
    console.error(
      `[ErrorBoundary${boundaryName ? ` - ${boundaryName}` : ''}] Caught error:`,
      error,
      errorInfo
    );

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // TODO: Send error to monitoring service (e.g., Sentry)
    // logErrorToService(error, errorInfo, boundaryName);
  }

  /**
   * Reset the error boundary state
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Render the component
   */
  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback && errorInfo) {
        return fallback(error, errorInfo, this.handleReset);
      }

      // Default error UI
      return <DefaultErrorUI error={error} onReset={this.handleReset} />;
    }

    return children;
  }
}

/**
 * Props for DefaultErrorUI
 */
interface DefaultErrorUIProps {
  error: Error;
  onReset: () => void;
}

/**
 * Default Error UI Component
 *
 * Displayed when an error occurs and no custom fallback is provided.
 */
function DefaultErrorUI({ error, onReset }: DefaultErrorUIProps): ReactNode {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-lg p-8 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Something Went Wrong
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Don't worry, your data is safe.
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-muted rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-mono text-destructive break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onReset}
            className="vm-btn-primary flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <button
            onClick={() => (window.location.href = '/')}
            className="vm-btn-outline"
          >
            Go to Home
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground mt-6">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}

/**
 * Hook-based error boundary for function components
 *
 * Note: This is a future enhancement. React doesn't support
 * error boundaries in function components yet, but we can prepare
 * the API for when it's available.
 */
export function useErrorBoundary() {
  // This will be implemented when React supports it
  throw new Error('useErrorBoundary is not yet implemented');
}

/**
 * Higher-order component to wrap a component with error boundary
 *
 * @param Component - Component to wrap
 * @param options - Error boundary options
 * @returns Wrapped component
 *
 * @example
 * ```tsx
 * const SafePaymentPage = withErrorBoundary(PaymentPage, {
 *   boundaryName: 'PaymentPage',
 *   onError: logError
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
