import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';
import { CodeBlock } from './CodeBlock';

interface StructuredMessageProps {
  content: string;
}

/**
 * Renders a raw LLM response string as structured, typeset content:
 *   - Full GitHub-Flavoured Markdown (tables, strikethrough, autolinks, task lists)
 *   - Inline LaTeX  ($...$)  and display LaTeX  ($$...$$)  via KaTeX
 *   - Syntax-highlighted fenced code blocks via Prism  (see CodeBlock)
 *   - Inline code chips, blockquotes, headings, lists, links, HR, bold, italic, del
 *
 * Math inside code blocks is deliberately NOT parsed (remark-math only processes
 * text nodes outside code spans/fences), so $50 in backticks stays literal.
 *
 * throwOnError: false  →  malformed LaTeX renders a red error span rather than
 * throwing, so one bad equation never breaks the whole message.
 */
const markdownComponents: Components = {
  // ── Code: inline vs fenced ────────────────────────────────────────────────
  code({ node: _node, className, children, ...rest }) {
    const match = /language-(\w+)/.exec(className ?? '');

    // "inline" prop is set by react-markdown for backtick spans
    const isInline = !match && !className;

    if (isInline) {
      // Inline code chip — styled via .prose-md :not(pre) > code in index.css
      return (
        <code {...rest} className={className}>
          {children}
        </code>
      );
    }

    // Fenced code block — delegate to syntax-highlighting CodeBlock
    return (
      <CodeBlock
        language={match ? match[1] : undefined}
        code={String(children).replace(/\n$/, '')}
      />
    );
  },

  // ── Tables: wrap in horizontal-scroll container ────────────────────────────
  table({ children }) {
    return (
      <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 shadow-xs">
        <table>{children}</table>
      </div>
    );
  },

  // ── Links: open external links safely in a new tab ─────────────────────────
  a({ href, children }) {
    const isExternal = href?.startsWith('http');
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    );
  },

  // ── Pre: strip default browser styling (CodeBlock owns all <pre> styling) ──
  pre({ children }) {
    return <>{children}</>;
  },
};

const remarkPlugins = [remarkGfm, remarkMath] as const;
const rehypePlugins = [[rehypeKatex, { throwOnError: false, errorColor: '#dc2626' }]] as const;

const StructuredMessage: React.FC<StructuredMessageProps> = ({ content }) => {
  if (!content || content.trim() === '') {
    return null;
  }

  return (
    <div className="prose-md">
      <ReactMarkdown
        remarkPlugins={remarkPlugins as any}
        rehypePlugins={rehypePlugins as any}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default StructuredMessage;
