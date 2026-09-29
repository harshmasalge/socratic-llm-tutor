import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  rawContent?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary that wraps individual message renderers.
 * If the Markdown/LaTeX renderer throws (e.g. on severely malformed input),
 * it falls back to displaying the raw content in a monospaced block so the
 * chat remains functional and the user can still read the response.
 */
export class MessageErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[MessageErrorBoundary] render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-700 font-medium">
            <AlertTriangle size={14} />
            <span>Could not render formatted response — showing raw text</span>
          </div>
          <pre
            className="whitespace-pre-wrap break-words font-mono text-xs text-gray-700 leading-relaxed"
            style={{ margin: 0 }}
          >
            {this.props.rawContent ?? '(empty response)'}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MessageErrorBoundary;
