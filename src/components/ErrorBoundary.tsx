import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        const errorId = Date.now().toString(36) + Math.random().toString(36);
        return {
            hasError: true,
            error,
            errorId
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        
        // Log error details for debugging
        // console.error('ErrorBoundary caught an error:', {
        //     error,
        //     errorInfo,
        //     errorId: this.state.errorId,
        //     timestamp: new Date().toISOString(),
        //     userAgent: navigator.userAgent,
        //     url: window.location.href
        // });

        // In production, you might want to send this to an error reporting service
        // Example: Sentry.captureException(error, { contexts: { errorInfo } });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    private copyErrorDetails = () => {
        const errorDetails = {
            errorId: this.state.errorId,
            message: this.state.error?.message,
            stack: this.state.error?.stack,
            componentStack: this.state.errorInfo?.componentStack,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
            .then(() => alert('Error details copied to clipboard'))
            .catch(() => {});
    };

    public render() {
        if (this.state.hasError) {
            const isNetworkError = this.state.error?.message?.toLowerCase().includes('network') ||
                                  this.state.error?.message?.toLowerCase().includes('fetch');
            
            const isChunkError = this.state.error?.message?.toLowerCase().includes('chunk') ||
                               this.state.error?.message?.toLowerCase().includes('loading');

            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
                    <div className="max-w-lg w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">
                                {isNetworkError ? '🌐' : isChunkError ? '📦' : '⚠️'}
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                {isNetworkError ? 'Connection Error' : 
                                 isChunkError ? 'Loading Error' : 
                                 'Something Went Wrong'}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {isNetworkError ? 
                                    'Unable to connect to the server. Please check your internet connection.' :
                                 isChunkError ?
                                    'Failed to load application resources. This usually happens after an update.' :
                                    'An unexpected error occurred while running the application.'
                                }
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Error Details:</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-mono break-all">
                                {this.state.error?.message || 'Unknown error'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Error ID: {this.state.errorId}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={this.handleReload}
                                    className="flex-1 bg-[#1b5e20] text-white px-4 py-3 rounded-lg hover:bg-[#154a19] transition-colors font-medium"
                                >
                                    🔄 Reload Page
                                </button>
                                <button
                                    onClick={this.handleGoHome}
                                    className="flex-1 bg-gray-600 dark:bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors font-medium"
                                >
                                    🏠 Go Home
                                </button>
                            </div>
                            
                            <button
                                onClick={this.copyErrorDetails}
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                            >
                                📋 Copy Error Details
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                If this problem persists, please contact technical support with the error ID above.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
