"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { Copy, Check } from "lucide-react";
import { cn } from "cn";
import {
  normalizeMonacoLanguage,
  formatLanguageLabel,
} from "@/lib/monaco-languages";
import type { OnMount, BeforeMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string | null;
  readOnly?: boolean;
  minHeight?: number;
  maxHeight?: number;
  placeholder?: string;
  className?: string;
  showHeader?: boolean;
  lineNumbers?: "on" | "off";
  autoFocus?: boolean;
  accentColor?: string | null;
}

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => null,
  }
);

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  minHeight: customMinHeight,
  maxHeight = 400,
  placeholder,
  className,
  showHeader = true,
  lineNumbers = "on",
  autoFocus = false,
  accentColor,
}: CodeEditorProps) {
  const minHeight = customMinHeight ?? (readOnly ? 80 : 120);

  const [copied, setCopied] = useState(false);
  const isClient = useIsClient();
  const [editorHeight, setEditorHeight] = useState<number>(() => {
    const lines = (value || "").split("\n").length;
    const estimated = lines * 20 + 20;
    return Math.min(Math.max(estimated, minHeight), maxHeight);
  });

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const normalizedLang = normalizeMonacoLanguage(language);
  const formattedLang = formatLanguageLabel(language);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const recalculateHeight = useCallback(() => {
    if (!editorRef.current) return;
    try {
      const contentHeight = editorRef.current.getContentHeight();
      const targetHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);
      setEditorHeight(targetHeight);
      editorRef.current.layout();
    } catch {
      // Ignore layout errors during unmount or transition
    }
  }, [minHeight, maxHeight]);

  useEffect(() => {
    recalculateHeight();
  }, [value, recalculateHeight]);

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("devstash-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "71717a", fontStyle: "italic" },
        { token: "keyword", foreground: "93c5fd" },
        { token: "string", foreground: "86efac" },
        { token: "number", foreground: "fde047" },
        { token: "type", foreground: "c4b5fd" },
        { token: "delimiter", foreground: "a1a1aa" },
      ],
      colors: {
        "editor.background": "#09090b", // zinc-950
        "editor.foreground": "#f4f4f5", // zinc-100
        "editorLineNumber.foreground": "#52525b", // zinc-600
        "editorLineNumber.activeForeground": "#a1a1aa", // zinc-400
        "editorCursor.foreground": "#f4f4f5",
        "editor.selectionBackground": "#27272a90", // zinc-800
        "editor.lineHighlightBackground": "#18181b40",
        "editor.lineHighlightBorder": "#00000000",
        "scrollbarSlider.background": "#3f3f4650",
        "scrollbarSlider.hoverBackground": "#52525b80",
        "scrollbarSlider.activeBackground": "#71717a",
      },
    });
  };

  const handleOnMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.setTheme("devstash-dark");

    const disposable = editor.onDidContentSizeChange(() => {
      recalculateHeight();
    });

    recalculateHeight();

    if (autoFocus && !readOnly) {
      editor.focus();
    }

    return () => {
      disposable.dispose();
    };
  };

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy code to clipboard:", err);
    }
  };

  const lines = (value || "").split("\n");

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
        "[&_.monaco-editor_.scrollbar_.slider]:rounded-full",
        "[&_.monaco-editor_.decorationsOverviewRuler]:hidden",
        className
      )}
    >
      {/* macOS-style Window Header */}
      {showHeader && (
        <div
          style={headerStyle}
          className="flex items-center justify-between px-3.5 py-2 bg-[#121215] border-b border-zinc-700/60 select-none shrink-0"
        >
          {/* macOS window dots */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <div className="size-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 transition-opacity hover:opacity-80" />
            <div className="size-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 transition-opacity hover:opacity-80" />
            <div className="size-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]/40 transition-opacity hover:opacity-80" />
          </div>

          {/* Right Header: Language + Quick Copy */}
          <div className="flex items-center gap-2">
            {formattedLang && (
              <span className="text-[10px] sm:text-[11px] font-mono font-medium text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 uppercase tracking-wider">
                {formattedLang}
              </span>
            )}

            <button
              type="button"
              onClick={handleCopy}
              disabled={!value}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-0.5 rounded hover:bg-zinc-800/60 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              aria-label="Copy code to clipboard"
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

      {/* Editor Body */}
      <div
        className="relative w-full bg-[#09090b] overflow-hidden transition-[height] duration-150 ease-out"
        style={{ height: `${editorHeight}px`, maxHeight: `${maxHeight}px` }}
      >
        {isClient ? (
          <MonacoEditor
            height={`${editorHeight}px`}
            language={normalizedLang}
            value={value}
            theme="devstash-dark"
            onChange={(val) => onChange?.(val ?? "")}
            beforeMount={handleBeforeMount}
            onMount={handleOnMount}
            options={{
              readOnly,
              domReadOnly: readOnly,
              minimap: { enabled: false },
              fontSize: 13,
              lineHeight: 20,
              fontFamily:
                "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              lineNumbers: lineNumbers,
              lineNumbersMinChars: 3,
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 4,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              wrappingStrategy: "advanced",
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 10, bottom: 10 },
              renderLineHighlight: readOnly ? "none" : "line",
              cursorStyle: readOnly ? "line" : "line",
              selectionHighlight: true,
              occurrencesHighlight: "off",
              overviewRulerBorder: false,
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                vertical: "auto",
                horizontal: "auto",
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
                verticalSliderSize: 8,
                horizontalSliderSize: 8,
                arrowSize: 0,
                useShadows: false,
              },
            }}
          />
        ) : (
          /* SSR / Initial Fallback */
          <div className="w-full h-full p-2.5 font-mono text-xs overflow-hidden text-zinc-400 bg-[#09090b]">
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="leading-5">
                    {lineNumbers === "on" && (
                      <td className="w-8 select-none pr-3 text-right text-zinc-600 align-top tabular-nums text-[11px]">
                        {idx + 1}
                      </td>
                    )}
                    <td className="whitespace-pre text-zinc-200 font-mono align-top text-xs">
                      {line || " "}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state placeholder when editable and empty */}
        {!readOnly && !value && placeholder && (
          <div className="absolute top-2.5 left-12 text-xs font-mono text-zinc-500/70 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
