"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type TiptapEditorWithPreviewProps = {
  label?: string;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
  onChange?: (html: string) => void;
};

export function TiptapEditorWithPreview({
  label = "Rich text",
  placeholder = "Start typing…",
  className,
  defaultValue = "<p>Write something</p>",
  onChange,
}: TiptapEditorWithPreviewProps) {
  const [html, setHtml] = useState<string>(defaultValue);
  const [focused, setFocused] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit.configure({})],
    immediatelyRender: false,
    content: defaultValue,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none min-h-[220px] px-3 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const next = editor.getHTML();
      setHtml(next);
      if (onChange) onChange(next);
    },
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  });

  // Compute current heading level for toolbar state
  const activeHeading = useMemo(() => {
    if (!editor) return "";
    if (editor.isActive("heading", { level: 1 })) return "h1";
    if (editor.isActive("heading", { level: 2 })) return "h2";
    if (editor.isActive("heading", { level: 3 })) return "h3";
    return "";
  }, [editor, html]);

  const can = (cb: () => boolean) => (editor ? cb() : false);
  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor ? editor.isActive(name as any, attrs) : false;

  const showPlaceholder = !!editor && editor.isEmpty && !focused;

  return (
    <div className={"w-full " + (className ?? "")}>
      {label ? <div className="mb-2 text-sm font-medium text-muted-foreground">{label}</div> : null}

      <div
        className={`rounded-md border bg-background transition-shadow ${
          focused ? "ring-2 ring-ring ring-offset-2 ring-offset-background shadow-sm" : ""
        }`}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-2 py-2">
          <ToggleGroup
            type="single"
            value={activeHeading}
            onValueChange={(v) => {
              if (!editor) return;
              const chain = editor.chain().focus();
              if (!v) {
                chain.setParagraph().run();
                return;
              }
              const level = v === "h1" ? 1 : v === "h2" ? 2 : 3;
              chain.toggleHeading({ level }).run();
            }}
            className="gap-1"
          >
            <ToggleGroupItem value="h1" aria-label="Heading 1">
              <Heading1 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="h2" aria-label="Heading 2">
              <Heading2 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="h3" aria-label="Heading 3">
              <Heading3 className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Toggle
            aria-label="Bold"
            pressed={isActive("bold")}
            onPressedChange={() => editor?.chain().focus().toggleBold().run()}
            disabled={!can(() => editor!.can().chain().focus().toggleBold().run())}
            size="sm"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            aria-label="Italic"
            pressed={isActive("italic")}
            onPressedChange={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!can(() => editor!.can().chain().focus().toggleItalic().run())}
            size="sm"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            aria-label="Strikethrough"
            pressed={isActive("strike")}
            onPressedChange={() => editor?.chain().focus().toggleStrike().run()}
            disabled={!can(() => editor!.can().chain().focus().toggleStrike().run())}
            size="sm"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
          <Toggle
            aria-label="Code block"
            pressed={isActive("codeBlock")}
            onPressedChange={() => editor?.chain().focus().toggleCodeBlock().run()}
            size="sm"
          >
            <Code className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Toggle
            aria-label="Bullet list"
            pressed={isActive("bulletList")}
            onPressedChange={() => editor?.chain().focus().toggleBulletList().run()}
            size="sm"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            aria-label="Ordered list"
            pressed={isActive("orderedList")}
            onPressedChange={() => editor?.chain().focus().toggleOrderedList().run()}
            size="sm"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle
            aria-label="Blockquote"
            pressed={isActive("blockquote")}
            onPressedChange={() => editor?.chain().focus().toggleBlockquote().run()}
            size="sm"
          >
            <Quote className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!can(() => editor!.can().chain().focus().undo().run())}
            aria-label="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!can(() => editor!.can().chain().focus().redo().run())}
            aria-label="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
            aria-label="Clear formatting"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        {/* Content with custom placeholder overlay */}
        <div className="relative min-h-[240px]">
          {showPlaceholder ? (
            <div className="pointer-events-none absolute inset-x-0 top-3 px-3 text-sm text-muted-foreground">
              {placeholder}
            </div>
          ) : null}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
