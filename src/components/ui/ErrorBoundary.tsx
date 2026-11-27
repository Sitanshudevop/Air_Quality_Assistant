// Top-level React Error Boundary providing a branded Bento recovery UI without leaking stack traces.
import { Component, type ReactElement, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { logError } from '../../utils/logger.js';

/** Props for ErrorBoundary component. */
export interface ErrorBoundaryProps {
  readonly children: ReactNode;
  readonly onReset?: () => void;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
}

/**
 * Catches unhandled rendering errors in child subtrees and renders a safe recovery card.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { hasError: false };

  /** Derives fallback state when a descendant throws during render. */
  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  /** Logs sanitized error metadata without exposing stack traces to the DOM. */
  public override componentDidCatch(error: Error): void {
    logError('Unhandled UI rendering error', {
      action: 'ErrorBoundary',
      error: error.name,
    });
  }

  /** Handles recovery click by resetting error state or reloading the window. */
  private readonly handleReload = (): void => {
    this.setState({ hasError: false });
    if (this.props.onReset) {
      this.props.onReset();
      return;
    }
    if (typeof window !== 'undefined' && typeof window.location?.reload === 'function') {
      window.location.reload();
    }
  };

  /** Renders children normally or the Bento recovery card on error. */
  public override render(): ReactElement {
    if (!this.state.hasError) {
      return <>{this.props.children}</>;
    }

    return (
      <div className="min-h-dvh bg-[#F3F5FA] dark:bg-neutral-950 flex items-center justify-center p-4">
        <section
          role="alert"
          aria-labelledby="error-boundary-title"
          className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-neutral-800 text-center space-y-5"
        >
          <div className="mx-auto w-12 h-12 rounded-2xl bg-bento-blush text-bento-ink flex items-center justify-center">
            <AlertTriangle size={22} aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 id="error-boundary-title" className="text-xl font-extrabold text-bento-ink dark:text-white">
              Something went wrong
            </h1>
            <p className="text-sm text-bento-muted dark:text-neutral-300 leading-relaxed">
              Saans encountered an unexpected display issue. Your saved profile and preferences remain safe in your browser.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-neutral-200 text-white px-5 py-2.5 text-sm font-semibold shadow-xs transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-bento-ink/40"
          >
            <RotateCcw size={15} aria-hidden="true" />
            Reload Saans
          </button>
        </section>
      </div>
    );
  }
}
