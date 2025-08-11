"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })
    
    // Log error to monitoring service in production
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // You can also log the error to an error reporting service here
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <Card className="bg-gray-800 border-gray-700 max-w-lg w-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400">
                We're sorry, but something unexpected happened. Please try refreshing the page or go back to the homepage.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-700 p-4 rounded-lg">
                  <summary className="text-red-400 cursor-pointer mb-2">Error Details (Development)</summary>
                  <pre className="text-xs text-gray-300 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    // You can also send to error reporting service here
  }
}
