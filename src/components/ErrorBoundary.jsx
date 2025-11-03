// src/components/ErrorBoundary.jsx
import React from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-red-900 p-4">
          <div className="max-w-2xl w-full bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-red-500/30 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="text-5xl text-red-500" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white text-center mb-4">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-300 text-center mb-6">
              We're sorry for the inconvenience. An unexpected error occurred.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 bg-black/50 rounded-lg p-4 max-h-64 overflow-auto">
                <summary className="text-red-400 cursor-pointer font-semibold mb-2">
                  Error Details (Dev Mode)
                </summary>
                <pre className="text-xs text-gray-400 whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <FaRedo />
                Reload Page
              </button>
              
              <a
                href="/"
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
