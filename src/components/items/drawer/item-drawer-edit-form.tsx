"use client";

import React from "react";
import { Tag, Folder, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CodeEditor } from "@/components/ui/code-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { isMarkdownItemType, isCodeItemType } from "@/lib/markdown";
import type { ItemDetail } from "@/lib/db/items";

export interface ItemDrawerEditFormProps {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  content: string;
  setContent: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  url: string;
  setUrl: (val: string) => void;
  tagsInput: string;
  setTagsInput: (val: string) => void;
  isSaving: boolean;
  showContentField: boolean;
  showLanguageField: boolean;
  showUrlField: boolean;
  lowerType: string;
  item: ItemDetail | null;
  onSave: (e?: React.FormEvent) => void;
}

export function ItemDrawerEditForm({
  title,
  setTitle,
  description,
  setDescription,
  content,
  setContent,
  language,
  setLanguage,
  url,
  setUrl,
  tagsInput,
  setTagsInput,
  isSaving,
  showContentField,
  showLanguageField,
  showUrlField,
  lowerType,
  item,
  onSave,
}: ItemDrawerEditFormProps) {
  return (
    <form onSubmit={onSave} className="space-y-5">
      {/* Title (Required) */}
      <div className="space-y-1.5">
        <label
          htmlFor="edit-item-title"
          className="text-xs font-semibold text-foreground flex items-center justify-between"
        >
          <span>
            Title <span className="text-destructive">*</span>
          </span>
          <span className="text-[11px] text-muted-foreground font-normal">
            Required
          </span>
        </label>
        <Input
          id="edit-item-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter item title..."
          disabled={isSaving}
          required
          className="h-9 text-xs sm:text-sm bg-background/60 border-border/70 rounded-lg"
          autoFocus
        />
        {!title.trim() && (
          <p className="text-[11px] text-destructive">
            Title cannot be empty.
          </p>
        )}
      </div>

      {/* Description (Optional) */}
      <div className="space-y-1.5">
        <label
          htmlFor="edit-item-description"
          className="text-xs font-semibold text-foreground flex items-center justify-between"
        >
          <span>Description</span>
          <span className="text-[11px] text-muted-foreground font-normal">
            Optional
          </span>
        </label>
        <textarea
          id="edit-item-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a brief description..."
          disabled={isSaving}
          rows={3}
          className="w-full min-h-[76px] rounded-lg border border-border/70 bg-background/60 dark:bg-input/30 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 outline-none resize-y transition-colors disabled:opacity-50"
        />
      </div>

      {/* Language (for Snippet & Command) */}
      {showLanguageField && (
        <div className="space-y-1.5">
          <label
            htmlFor="edit-item-language"
            className="text-xs font-semibold text-foreground flex items-center justify-between"
          >
            <span>Language</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              e.g. typescript, bash, python
            </span>
          </label>
          <Input
            id="edit-item-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g. typescript, python, bash..."
            disabled={isSaving}
            className="h-9 text-xs sm:text-sm font-mono bg-background/60 border-border/70 rounded-lg"
          />
        </div>
      )}

      {/* Content (for Snippet, Prompt, Command, Note) */}
      {showContentField && (
        <div className="space-y-1.5">
          <label
            htmlFor="edit-item-content"
            className="text-xs font-semibold text-foreground flex items-center justify-between"
          >
            <span>Content</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              {isCodeItemType(lowerType)
                ? "Code / Script"
                : isMarkdownItemType(lowerType)
                ? "Markdown"
                : "Text"}
            </span>
          </label>
          {isCodeItemType(lowerType) ? (
            <CodeEditor
              value={content}
              onChange={setContent}
              language={language}
              readOnly={false}
              minHeight={140}
              maxHeight={400}
              placeholder={
                lowerType === "snippet"
                  ? "Paste code snippet here..."
                  : "Enter terminal command..."
              }
            />
          ) : isMarkdownItemType(lowerType) ? (
            <MarkdownEditor
              value={content}
              onChange={setContent}
              readOnly={false}
              minHeight={140}
              maxHeight={400}
              placeholder={
                lowerType === "note"
                  ? "Write note in Markdown..."
                  : "Write prompt in Markdown..."
              }
            />
          ) : (
            <textarea
              id="edit-item-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter content here..."
              disabled={isSaving}
              rows={7}
              className="w-full min-h-[140px] rounded-lg border border-border/70 bg-background/60 dark:bg-input/30 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 outline-none resize-y transition-colors disabled:opacity-50"
            />
          )}
        </div>
      )}

      {/* URL (for Link) */}
      {showUrlField && (
        <div className="space-y-1.5">
          <label
            htmlFor="edit-item-url"
            className="text-xs font-semibold text-foreground flex items-center justify-between"
          >
            <span>URL</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Link destination
            </span>
          </label>
          <Input
            id="edit-item-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={isSaving}
            className="h-9 text-xs sm:text-sm font-mono bg-background/60 border-border/70 rounded-lg"
          />
        </div>
      )}

      {/* Tags (Comma-separated text input) */}
      <div className="space-y-1.5">
        <label
          htmlFor="edit-item-tags"
          className="text-xs font-semibold text-foreground flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            <Tag className="size-3.5 text-muted-foreground" />
            <span>Tags</span>
          </span>
          <span className="text-[11px] text-muted-foreground font-normal">
            Comma-separated
          </span>
        </label>
        <Input
          id="edit-item-tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="react, typescript, ui"
          disabled={isSaving}
          className="h-9 text-xs sm:text-sm font-mono bg-background/60 border-border/70 rounded-lg"
        />
        <p className="text-[11px] text-muted-foreground">
          Separate tags with commas. Tags will be updated on save.
        </p>
      </div>

      {/* Non-Editable Collections */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Folder className="size-3.5" />
            <span>Collections</span>
          </span>
          <span className="text-[11px] text-muted-foreground italic">
            Read-only
          </span>
        </div>
        {item?.collections && item.collections.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 opacity-80">
            {item.collections.map((col) => (
              <span
                key={col.id}
                className="px-2.5 py-1 rounded-md text-xs bg-muted/40 border border-border/60 text-foreground flex items-center gap-1.5"
              >
                {col.color && (
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: col.color }}
                  />
                )}
                <span>{col.name}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Not in any collections
          </p>
        )}
      </div>

      {/* Non-Editable Details */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>Details</span>
          </span>
          <span className="text-[11px] text-muted-foreground italic">
            Read-only
          </span>
        </div>
        <div className="space-y-2 text-xs sm:text-sm opacity-80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Created</span>
            <span className="text-foreground font-medium">
              {item?.formattedCreatedAt || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Updated</span>
            <span className="text-foreground font-medium">
              {item?.formattedUpdatedAt || "—"}
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
