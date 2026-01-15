"use client";

/**
 * AssistantInput component
 * Message input field for the chat interface
 */

import { useState, KeyboardEvent } from "react";
import { Button } from "@stride/ui";
import { cn } from "@stride/ui";

export interface AssistantInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * AssistantInput component
 * Handles message input and sending
 */
export function AssistantInput({
  onSend,
  disabled = false,
  placeholder = "Type your message...",
}: AssistantInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await onSend(trimmedMessage);
      setMessage(""); // Clear input on success
    } catch (error) {
      // Error handling is done in parent component
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (but allow Shift+Enter for new line)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2" role="form" aria-label="Message input">
      <label htmlFor="assistant-input" className="sr-only">
        Type your message to the AI assistant
      </label>
      <textarea
        id="assistant-input"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSending}
        placeholder={placeholder}
        rows={1}
        aria-label="Message input"
        aria-describedby="input-help"
        aria-invalid={false}
        className={cn(
          "flex-1 resize-none rounded-md border border-border dark:border-border-dark",
          "bg-surface dark:bg-surface-dark",
          "px-3 py-2 text-sm",
          "text-foreground dark:text-foreground-dark",
          "placeholder:text-foreground-secondary dark:placeholder:text-foreground-dark-secondary",
          "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "min-h-[40px] max-h-[120px]"
        )}
        style={{
          height: "auto",
          minHeight: "40px",
        }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = "auto";
          target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
        }}
      />
      <span id="input-help" className="sr-only">
        Press Enter to send, Shift+Enter for new line
      </span>
      <Button
        onClick={handleSend}
        disabled={disabled || isSending || !message.trim()}
        className="shrink-0"
        aria-label="Send message"
        aria-busy={isSending}
      >
        {isSending ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
            <span aria-live="polite" aria-atomic="true">Sending...</span>
          </>
        ) : (
          "Send"
        )}
      </Button>
    </div>
  );
}
