import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in app:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearData = () => {
    if (window.confirm('This will clear stored local data to resolve any corrupted state. Are you sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-2xl font-black mb-2">Something went wrong</h1>
          <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
            The application encountered an unexpected error. You can refresh or reset your local cache to restore standard operation.
          </p>
          
          {this.state.error && (
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs font-mono text-rose-300 max-w-md w-full mb-6 overflow-x-auto text-left">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <RefreshCw size={16} />
              <span>Reload Application</span>
            </button>
            <button
              onClick={this.handleClearData}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 size={16} />
              <span>Reset Local Cache</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
