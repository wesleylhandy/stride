"use client";

import { useState, useRef, useEffect } from "react";

interface CodeBlockProps {
  /**
   * Code content to display (can be string or React node with syntax highlighting)
   */
  children?: React.ReactNode;
  /**
   * Plain text version for copy functionality (required if children is React node)
   */
  code?: string;
  /**
   * Language for syntax highlighting
   */
  language?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * CodeBlock Component
 * 
 * Displays code with syntax highlighting and copy-to-clipboard functionality.
 * Matches web CodeBlock structure and styling for consistency.
 */
export function CodeBlock({ children, code, language, className = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const codeRef = useRef<HTMLPreElement>(null);

  // Apply syntax highlighting
  useEffect(() => {
    const codeText = code || "";
    if (!codeText || !language) {
      setHighlightedCode("");
      return;
    }

    // Dynamic import to avoid SSR/Turbopack issues with highlight.js
    import("highlight.js")
      .then((hljsModule) => {
        const hljs = hljsModule.default || hljsModule;
        const result = hljs.highlight(codeText, { language });
        setHighlightedCode(result.value);
      })
      .catch((err) => {
        // If highlighting fails, fall back to plain text
        console.warn(`Failed to highlight code for language ${language}:`, err);
        setHighlightedCode("");
      });
  }, [code, language]);

  const handleCopy = async () => {
    if (!codeRef.current) return;

    // Use provided code text or extract from DOM
    const textToCopy = code || codeRef.current.textContent || "";

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className={`relative group my-4 ${className}`}>
      <pre
        ref={codeRef}
        className="code-block relative overflow-x-auto rounded-lg text-sm font-mono flex items-center min-h-[3.5rem] pt-4 pb-4 pl-4 pr-32 bg-gray-200 dark:bg-[#21262d] border border-gray-300 dark:border-[#30363d]"
      >
        <code
          className={`block whitespace-pre w-full m-0 hljs ${language ? `language-${language}` : ""} [&.hljs]:bg-transparent`}
          dangerouslySetInnerHTML={
            language && highlightedCode ? { __html: highlightedCode } : undefined
          }
        >
          {!language || !highlightedCode ? code || children : null}
        </code>

        {/* Buttons positioned absolutely at top-right */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {language && (
            <span className="text-xs text-gray-300 dark:text-gray-400 uppercase font-medium px-2 py-1 bg-gray-800/80 dark:bg-gray-900/50 backdrop-blur-sm rounded border border-gray-700/50 dark:border-gray-600/30">
              {language}
            </span>
          )}
          <button
            onClick={handleCopy}
            type="button"
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-gray-950 shadow-sm hover:shadow ${
              copied
                ? "bg-green-600/90 dark:bg-green-700/90 text-white hover:bg-green-600 dark:hover:bg-green-700"
                : "bg-gray-800/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-200 dark:text-gray-300 hover:bg-gray-700 dark:hover:bg-gray-800 border border-gray-700/50 dark:border-gray-600/50"
            }`}
            aria-label={copied ? "Copied!" : "Copy code"}
          >
            {copied ? (
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </span>
            )}
          </button>
        </div>
      </pre>
    </div>
  );
}
