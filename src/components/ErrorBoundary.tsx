// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ fallback?: ReactNode }, { error?: Error }> {
  state = { error: undefined as Error | undefined }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) return this.props.fallback ?? <div>Something went wrong.</div>
    return this.props.children
  }
}
