'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export interface MarkdownEditorProps {
  /**
   * Current markdown content
   */
  value: string;
  /**
   * Callback when content changes
   */
  onChange: (value: string) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Minimum height in pixels
   */
  minHeight?: number;
  /**
   * Whether the editor is disabled
   */
  disabled?: boolean;
  /**
   * Error message to display
   */
  error?: string;
}

/**
 * MarkdownEditor component
 * 
 * A simple textarea-based markdown editor with basic formatting hints.
 * For more advanced features, consider integrating a full markdown editor library.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your description in Markdown...',
  className,
  minHeight = 200,
  disabled = false,
  error,
}: MarkdownEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex w-full rounded-md border bg-background dark:bg-background-dark px-3 py-2 text-sm',
            'text-foreground dark:text-foreground-dark',
            'transition-colors placeholder:text-foreground-muted dark:placeholder:text-foreground-dark-muted',
            'focus-ring disabled:cursor-not-allowed disabled:opacity-50',
            'resize-y font-mono',
            error
              ? 'border-error focus-visible:ring-error'
              : 'border-border dark:border-border-dark hover:border-border-hover dark:hover:border-border-dark-hover focus-visible:border-border-focus'
          )}
          style={{ minHeight: `${minHeight}px` }}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'markdown-editor-error' : undefined}
        />
      </div>
      {error && (
        <p
          id="markdown-editor-error"
          className="mt-1 text-sm text-error dark:text-error-dark"
          role="alert"
        >
          {error}
        </p>
      )}
      <div className="mt-2 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
        <p>Supports Markdown formatting. Use **bold**, *italic*, `code`, and more.</p>
      </div>
    </div>
  );
}

