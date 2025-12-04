// src/components/VideoPlayerErrorBoundary.jsx
import React from 'react';

class VideoPlayerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    // Reset error boundary when the video ID changes (new song selected)
    if (nextProps.videoId && nextProps.videoId !== prevState.errorId && prevState.hasError) {
      return {
        hasError: false,
        error: null,
        errorId: null,
      };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    console.error('VideoPlayer Error:', error, errorInfo);
    // Store the current video ID when error occurs
    this.setState({ errorId: this.props.videoId });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="videoke-stage-fallback">
          <p>Video player encountered an error. Please try selecting another song.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null, errorId: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default VideoPlayerErrorBoundary;
