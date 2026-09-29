import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-shell-session';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-latex';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  code: string;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  html: 'markup',
  xml: 'markup',
  cs: 'csharp',
  'c++': 'cpp',
  tex: 'latex',
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  const normalizedLang =
    (language ? LANGUAGE_ALIASES[language.toLowerCase()] ?? language.toLowerCase() : '') || 'plaintext';

  const prismLang = Prism.languages[normalizedLang];

  useEffect(() => {
    if (codeRef.current && prismLang) {
      codeRef.current.innerHTML = Prism.highlight(code, prismLang, normalizedLang);
    }
  }, [code, normalizedLang, prismLang]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available in insecure contexts
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden my-4 border border-gray-700 shadow-sm"
      style={{ background: '#1e1f2e' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: '#161722', borderBottom: '1px solid #2d2e42' }}
      >
        <span
          className="text-xs font-mono font-semibold uppercase tracking-widest select-none"
          style={{ color: '#8b8fa8' }}
        >
          {normalizedLang !== 'plaintext' ? normalizedLang : 'code'}
        </span>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer select-none"
          style={{
            background: copied ? '#1a3a1a' : '#2a2b3d',
            color: copied ? '#4ade80' : '#8b8fa8',
            border: `1px solid ${copied ? '#16a34a' : '#3d3e54'}`,
          }}
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code area */}
      <div className="overflow-x-auto" style={{ padding: '1rem 1.25rem' }}>
        <pre style={{ margin: 0, background: 'transparent' }}>
          <code
            ref={codeRef}
            className={prismLang ? `language-${normalizedLang}` : undefined}
            style={{
              fontFamily: '"Fira Code", "Fira Mono", Consolas, Menlo, Monaco, monospace',
              fontSize: '0.85rem',
              lineHeight: '1.65',
              color: prismLang ? undefined : '#cdd3de',
            }}
          >
            {/* innerHTML set by useEffect when prismLang exists; fallback plain text below */}
            {prismLang ? undefined : code}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
