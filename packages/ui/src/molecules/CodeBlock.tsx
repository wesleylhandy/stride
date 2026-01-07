'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export interface CodeBlockProps {
  /**
   * Code content to display (can be string or React node with syntax highlighting)
   */
  children: React.ReactNode;
  /**
   * Language for syntax highlighting
   */
  language?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Plain text version for copy functionality (if different from children)
   */
  codeText?: string;
}

/**
 * CodeBlock component with copy-to-clipboard functionality
 */
export function CodeBlock({ children, language, className, codeText }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);
  const codeRef = React.useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    if (!codeRef.current) return;

    // Use provided codeText or extract from DOM
    const textToCopy = codeText || codeRef.current.textContent || '';
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group my-4">
      <pre
        ref={codeRef}
        className={cn(
          'relative overflow-x-auto rounded-lg text-sm font-mono',
          // Flex container to center content vertically when short
          'flex items-center',
          // Minimum height for single-line blocks (ensures buttons have space)
          'min-h-[3.5rem]',
          // Increased padding to prevent button overflow
          'pt-4 pb-4 pl-4 pr-32', // pr-32 = 8rem for buttons (language badge + copy button + gap)
          // Background matches hljs - set on pre so it fills entire container including padding
          // Light mode default, dark mode override using Tailwind's dark: variant
          'bg-gray-200 dark:bg-gray-950',
          // Border matches theme
          'border border-gray-300 dark:border-gray-800',
          className
        )}
      >
        <code
          className={cn(
            'block whitespace-pre hljs w-full',
            // Remove default margins that might interfere
            'm-0',
            // Make hljs background transparent so pre background shows through
            '[&.hljs]:bg-transparent',
            language && `language-${language}`
          )}
        >
          {children}
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
            className={cn(
              'px-3 py-1.5 text-xs rounded-md font-medium',
              'bg-gray-800/90 dark:bg-gray-900/90 backdrop-blur-sm',
              'text-gray-200 dark:text-gray-300',
              'hover:bg-gray-700 dark:hover:bg-gray-800',
              'border border-gray-700/50 dark:border-gray-600/50',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'shadow-sm hover:shadow',
              copied && 'bg-green-600/90 dark:bg-green-700/90 hover:bg-green-600 dark:hover:bg-green-700'
            )}
            aria-label={copied ? 'Copied!' : 'Copy code'}
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

