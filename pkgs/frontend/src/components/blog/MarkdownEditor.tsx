import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

type PaneMode = 'edit' | 'split' | 'preview';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TOOLBAR_ACTIONS = [
  { label: 'B', title: 'Bold', before: '**', after: '**' },
  { label: 'I', title: 'Italic', before: '_', after: '_' },
  { label: 'H2', title: 'H2', before: '## ', after: '' },
  { label: '`', title: 'Code', before: '`', after: '`' },
  { label: '🔗', title: 'Link', before: '[', after: '](url)' },
  { label: '🖼', title: 'Image', before: '![', after: '](url)' },
  { label: '—', title: 'List', before: '- ', after: '' },
] as const;

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [mode, setMode] = useState<PaneMode>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAround = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newValue);
    // Re-focus and restore selection after state update
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const showEdit = mode === 'edit' || mode === 'split';
  const showPreview = mode === 'preview' || mode === 'split';

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '8px 12px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          flexWrap: 'wrap',
        }}
      >
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.title}
            type="button"
            title={action.title}
            onClick={() => insertAround(action.before, action.after)}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              background: '#fff',
              fontSize: 13,
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Pane selector */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
        }}
      >
        {(['edit', 'split', 'preview'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderBottom: mode === m ? '2px solid #3b82f6' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: mode === m ? 600 : 400,
            }}
          >
            {m === 'edit' ? '編集' : m === 'split' ? '分割' : 'プレビュー'}
          </button>
        ))}
      </div>

      {/* Panes */}
      <div style={{ display: 'flex', minHeight: 300, flex: 1 }}>
        {showEdit && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1,
              padding: 16,
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: 14,
              lineHeight: 1.6,
              background: '#fff',
            }}
          />
        )}
        {showPreview && (
          <div
            data-testid="preview-pane"
            style={{
              flex: 1,
              padding: 16,
              borderLeft: mode === 'split' ? '1px solid #e2e8f0' : 'none',
              overflowY: 'auto',
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {value || '*プレビューエリア*'}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '4px 12px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          fontSize: 12,
          color: '#94a3b8',
        }}
      >
        <span>{charCount}文字</span>
        <span>約{wordCount}語</span>
        <span>Markdown</span>
      </div>
    </div>
  );
}
