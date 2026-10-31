"use client";

import React, { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TiptapEditor({
  content,
  onChange,
  disabled = false,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary text-decoration-underline",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: content || "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // Keep editor content synchronized when incoming content changes externally (e.g. after async fetch)
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHtml = editor.getHTML();
      if (content !== currentHtml && (content !== "" || currentHtml !== "<p></p>")) {
        editor.commands.setContent(content || "", { emitUpdate: false });
      }
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter destination URL:", previousUrl);

    // Cancelled
    if (url === null) return;

    // Empty URL removes link
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Set link
    const validUrl = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")
      ? url.trim()
      : `https://${url.trim()}`;

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: validUrl })
      .run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="border rounded bg-light p-3 text-center text-muted small" style={{ minHeight: "220px" }}>
        <div className="spinner-border spinner-border-sm text-secondary me-2" role="status">
          <span className="visually-hidden">Loading editor...</span>
        </div>
        Loading rich text editor...
      </div>
    );
  }

  return (
    <div className="tiptap-editor-wrapper border rounded shadow-sm bg-white overflow-hidden">
      {/* Formatting Toolbar */}
      <div className="tiptap-toolbar d-flex flex-wrap align-items-center gap-1 p-2 bg-light border-bottom">
        {/* History: Undo / Redo */}
        <div className="btn-group btn-group-sm me-1" role="group" aria-label="History">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run() || disabled}
            title="Undo (Ctrl+Z)"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run() || disabled}
            title="Redo (Ctrl+Y)"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>

        <div className="vr mx-1 my-auto" style={{ height: "18px" }}></div>

        {/* Headings */}
        <div className="btn-group btn-group-sm me-1" role="group" aria-label="Headings">
          <button
            type="button"
            className={`btn btn-outline-secondary fw-bold ${
              editor.isActive("paragraph") ? "active bg-secondary text-white" : ""
            }`}
            onClick={() => editor.chain().focus().setParagraph().run()}
            disabled={disabled}
            title="Normal Paragraph"
          >
            P
          </button>
          <button
            type="button"
            className={`btn btn-outline-secondary fw-bold ${
              editor.isActive("heading", { level: 2 }) ? "active bg-secondary text-white" : ""
            }`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={disabled}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            className={`btn btn-outline-secondary fw-bold ${
              editor.isActive("heading", { level: 3 }) ? "active bg-secondary text-white" : ""
            }`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            disabled={disabled}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        <div className="vr mx-1 my-auto" style={{ height: "18px" }}></div>

        {/* Inline styles: Bold, Italic, Strike */}
        <div className="btn-group btn-group-sm me-1" role="group" aria-label="Inline Styles">
          <button
            type="button"
            className={`btn btn-outline-secondary ${
              editor.isActive("bold") ? "active bg-secondary text-white" : ""
            }`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            title="Bold (Ctrl+B)"
          >
            <i className="bi bi-type-bold"></i>
          </button>
          <button
            type="button"
            className={`btn btn-outline-secondary ${
              editor.isActive("italic") ? "active bg-secondary text-white" : ""
            }`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            title="Italic (Ctrl+I)"
          >
            <i className="bi bi-type-italic"></i>
          </button>
          <button
            type="button"
            className={`btn btn-outline-secondary ${
              editor.isActive("strike") ? "active bg-secondary text-white" : ""
            }`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={disabled}
            title="Strikethrough"
          >
            <i className="bi bi-type-strikethrough"></i>
          </button>
        </div>

        <div className="vr mx-1 my-auto" style={{ height: "18px" }}></div>

        {/* Lists: Bullet & Numbered */}
        <div className="btn-group btn-group-sm me-1" role="group" aria-label="Lists">
          <button
            type="button"
            className={`btn btn-outline-secondary ${
              editor.isActive("bulletList") ? "active bg-secondary text-white" : ""
            }`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            title="Bullet List"
          >
            <i className="bi bi-list-ul"></i>
          </button>
          <button
            type="button"
            className={`btn btn-outline-secondary ${
              editor.isActive("orderedList") ? "active bg-secondary text-white" : ""
            }`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            title="Numbered List"
          >
            <i className="bi bi-list-ol"></i>
          </button>
        </div>

        <div className="vr mx-1 my-auto" style={{ height: "18px" }}></div>

        {/* Blocks: Blockquote, Divider, Code */}
        <div className="btn-group btn-group-sm me-1" role="group" aria-label="Blocks">
          <button
            type="button"
            className={`btn btn-outline-secondary ${
              editor.isActive("blockquote") ? "active bg-secondary text-white" : ""
            }`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={disabled}
            title="Blockquote"
          >
            <i className="bi bi-quote"></i>
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            disabled={disabled}
            title="Horizontal Divider"
          >
            <i className="bi bi-hr"></i>
          </button>
          <button
            type="button"
            className={`btn btn-outline-secondary ${
              editor.isActive("codeBlock") ? "active bg-secondary text-white" : ""
            }`}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            disabled={disabled}
            title="Code Block"
          >
            <i className="bi bi-code-slash"></i>
          </button>
        </div>

        <div className="vr mx-1 my-auto" style={{ height: "18px" }}></div>

        {/* Links */}
        <div className="btn-group btn-group-sm" role="group" aria-label="Links">
          <button
            type="button"
            className={`btn btn-outline-secondary ${
              editor.isActive("link") ? "active bg-primary text-white" : ""
            }`}
            onClick={setLink}
            disabled={disabled}
            title="Insert or Edit Link"
          >
            <i className="bi bi-link-45deg"></i>
          </button>
          {editor.isActive("link") && (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => editor.chain().focus().unsetLink().run()}
              disabled={disabled}
              title="Remove Link"
            >
              <i className="bi bi-x-circle"></i>
            </button>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="p-3" style={{ minHeight: "220px", maxHeight: "500px", overflowY: "auto" }}>
        <EditorContent editor={editor} />
      </div>

      {/* Scoped CSS for ProseMirror content */}
      <style jsx global>{`
        .tiptap-editor-wrapper .ProseMirror {
          outline: none;
          min-height: 180px;
          font-size: 0.92rem;
          color: #212529;
        }
        .tiptap-editor-wrapper .ProseMirror p {
          margin-bottom: 0.6rem;
          line-height: 1.6;
        }
        .tiptap-editor-wrapper .ProseMirror h2 {
          font-size: 1.35rem;
          font-weight: 700;
          margin-top: 1.1rem;
          margin-bottom: 0.5rem;
          color: #1a1e21;
        }
        .tiptap-editor-wrapper .ProseMirror h3 {
          font-size: 1.15rem;
          font-weight: 600;
          margin-top: 0.9rem;
          margin-bottom: 0.4rem;
          color: #2c3034;
        }
        .tiptap-editor-wrapper .ProseMirror ul,
        .tiptap-editor-wrapper .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .tiptap-editor-wrapper .ProseMirror blockquote {
          border-left: 4px solid #0d6efd;
          padding-left: 0.85rem;
          margin: 0.8rem 0;
          color: #6c757d;
          font-style: italic;
        }
        .tiptap-editor-wrapper .ProseMirror hr {
          margin: 1rem 0;
          border: 0;
          border-top: 1px solid #dee2e6;
        }
        .tiptap-editor-wrapper .ProseMirror pre {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 0.375rem;
          padding: 0.75rem;
          font-family: monospace;
          font-size: 0.85rem;
          color: #d63384;
        }
        .tiptap-editor-wrapper .ProseMirror a {
          color: #0d6efd;
          text-decoration: underline;
        }
        .tiptap-editor-wrapper:focus-within {
          border-color: #86b7fe !important;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
      `}</style>
    </div>
  );
}
