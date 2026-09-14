"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PenLine, Eye, Copy, Check } from "lucide-react";
import { cn } from "cn";
import { markdownComponents } from "@/components/ui/markdown-components";

export interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  minHeight?: number;
  maxHeight?: number;
  placeholder?: string;
  className?: string;
  showHeader?: boolean;
  autoFocus?: boolean;
  accentColor?: string | null;
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  minHeight: customMinHeight,
  maxHeight = 400,
  placeholder,
  className,
  showHeader = true,
  autoFocus = false,
  accentColor,
}: MarkdownEditorProps) {
  const minHeight = customMinHeight ?? (readOnly ? 80 : 120);

  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");
  const activeTab = readOnly ? "preview" : selectedTab;
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const targetHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${targetHeight}px`;
  }, [minHeight, maxHeight]);

  useEffect(() => {
    if (activeTab === "write") {
      adjustTextareaHeight();
    }
  }, [value, activeTab, adjustTextareaHeight]);

  const handleCopy = async () => {
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        setCopied(true);
        copyTimeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (fallbackErr) {
        console.error("Failed to copy markdown content to clipboard:", fallbackErr);
      }
    }
  };

  const outerStyle: React.CSSProperties = accentColor
    ? {
        borderColor: `color-mix(in srgb, ${accentColor} 45%, transparent)`,
        boxShadow: `0 0 16px -3px color-mix(in srgb, ${accentColor} 12%, transparent)`,
      }
    : {};

  const headerStyle: React.CSSProperties = accentColor
    ? {
        borderBottomColor: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
      }
    : {};

  return (
    <div
      style={outerStyle}
      className={cn(
        "flex flex-col rounded-lg border border-zinc-700/80 bg-[#09090b] overflow-hidden shadow-sm text-left transition-colors",
        className
      )}
    >
      {/* Header */}
      {showHeader && (
        <div
          style={headerStyle}
          className="flex items-center justify-between px-3.5 py-2 bg-[#121215] border-b border-zinc-700/60 select-none shrink-0"
        >
          {/* Left: macOS dots & Tab Switcher */}
          <div className="flex items-center gap-3">
            {/* macOS window dots */}
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <div className="size-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 transition-opacity hover:opacity-80" />
              <div className="size-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 transition-opacity hover:opacity-80" />
              <div className="size-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]/40 transition-opacity hover:opacity-80" />
            </div>

            {/* Tab Switcher */}
            {!readOnly ? (
              <div className="flex items-center gap-0.5 bg-zinc-900/90 p-0.5 rounded-md border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedTab("write")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer",
                    activeTab === "write"
                      ? "bg-zinc-800 text-zinc-100 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                  aria-label="Write tab"
                >
                  <PenLine className="size-3" />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab("preview")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer",
                    activeTab === "preview"
                      ? "bg-zinc-800 text-zinc-100 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                  aria-label="Preview tab"
                >
                  <Eye className="size-3" />
                  <span>Preview</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 bg-zinc-800/80 px-2.5 py-0.5 rounded border border-zinc-700/60">
                <Eye className="size-3 text-zinc-400" />
                <span>Preview</span>
              </div>
            )}
          </div>

          {/* Right Header: Label + Copy Button */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-mono font-medium text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 uppercase tracking-wider">
              Markdown
            </span>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!value}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-0.5 rounded hover:bg-zinc-800/60 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              aria-label="Copy markdown content to clipboard"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium text-[11px]">
                    Copied!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="relative w-full bg-[#09090b] overflow-hidden">
        {activeTab === "write" && !readOnly ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange?.(e.target.value);
              adjustTextareaHeight();
            }}
            placeholder={placeholder}
            autoFocus={autoFocus}
            style={{
              minHeight: `${minHeight}px`,
              maxHeight: `${maxHeight}px`,
            }}
            className="w-full bg-[#09090b] text-zinc-200 font-mono text-xs sm:text-sm p-3.5 focus:outline-none resize-none leading-relaxed overflow-y-auto block placeholder:text-zinc-500/70"
            aria-label="Markdown content input"
          />
        ) : (
          <div
            style={{
              minHeight: `${minHeight}px`,
              maxHeight: `${maxHeight}px`,
            }}
            className="w-full bg-[#09090b] p-4 text-xs sm:text-sm text-zinc-300 leading-relaxed overflow-y-auto markdown-preview"
          >
            {value && value.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-xs text-zinc-500 italic">Nothing to preview</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
