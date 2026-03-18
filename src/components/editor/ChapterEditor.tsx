"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExtension from "@tiptap/extension-underline";
import type { JSONContent } from "@tiptap/react";
import { EditorToolbar } from "./EditorToolbar";

interface ChapterEditorProps {
  /** Initial content as Tiptap JSON */
  content?: JSONContent | null;
  /** Called whenever the document changes */
  onUpdate?: (content: JSONContent) => void;
  /** Placeholder text shown when editor is empty */
  placeholder?: string;
  /** Whether the editor is read-only */
  editable?: boolean;
}

export default function ChapterEditor({
  content,
  onUpdate,
  placeholder = "Start writing your chapter...",
  editable = true,
}: ChapterEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4 cursor-pointer",
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: "rounded-md max-w-full mx-auto",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      UnderlineExtension,
    ],
    content: content ?? undefined,
    editable,
    onUpdate: ({ editor: e }) => {
      onUpdate?.(e.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none min-h-[400px] px-6 py-4 focus:outline-none",
      },
    },
  });

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      {editable && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
