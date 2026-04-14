import { useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNetworkVariable } from './networkConfig';
import katex from 'katex';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (e) {
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre class="notion-code"><code>${code}</code></pre><p style="color:red;font-size:12px">Mermaid error: ${e instanceof Error ? e.message : 'Invalid diagram syntax'}</p>`;
        }
      }
    };
    renderDiagram();
  }, [code]);

  return <div ref={containerRef} className="notion-mermaid" />;
}

interface NoteData {
  id: string;
  owner: string;
  title: string;
  content: string;
  icon?: string;
  cover?: string;
}

interface SlashCommand {
  id: string;
  name: string;
  icon: string;
  description: string;
  prefix: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'heading1',
    name: 'Heading 1',
    icon: 'H1',
    description: 'Large heading',
    prefix: '# ',
  },
  {
    id: 'heading2',
    name: 'Heading 2',
    icon: 'H2',
    description: 'Medium heading',
    prefix: '## ',
  },
  {
    id: 'heading3',
    name: 'Heading 3',
    icon: 'H3',
    description: 'Small heading',
    prefix: '### ',
  },
  {
    id: 'todo',
    name: 'To-do List',
    icon: '📋',
    description: 'Task list',
    prefix: '- [ ] ',
  },
  {
    id: 'bullet',
    name: 'Bullet List',
    icon: '•',
    description: 'Bulleted list',
    prefix: '- ',
  },
  {
    id: 'table',
    name: 'Table',
    icon: '📊',
    description: 'Insert table',
    prefix: '| Header1 | Header2 | Header3 |\n| :--- | :---: | ---: |\n| Cell1 | Cell2 | Cell3 |\n',
  },
  {
    id: 'image',
    name: 'Image',
    icon: '🖼️',
    description: 'Insert image',
    prefix: '![alt](image-url)',
  },
  {
    id: 'code',
    name: 'Code',
    icon: '```',
    description: 'Code block',
    prefix: '```\n\n```',
  },
  {
    id: 'quote',
    name: 'Quote',
    icon: '"',
    description: 'Blockquote',
    prefix: '> ',
  },
  {
    id: 'divider',
    name: 'Divider',
    icon: '—',
    description: 'Horizontal rule',
    prefix: '---\n',
  },
  {
    id: 'link',
    name: 'Link',
    icon: '🔗',
    description: 'Hyperlink',
    prefix: '[text](url)',
  },
  {
    id: 'highlight',
    name: 'Highlight',
    icon: '🖍️',
    description: 'Highlighted text',
    prefix: '==text==',
  },
  {
    id: 'bold',
    name: 'Bold',
    icon: 'B',
    description: 'Bold text',
    prefix: '**bold**',
  },
  {
    id: 'italic',
    name: 'Italic',
    icon: 'I',
    description: 'Italic text',
    prefix: '_italic_',
  },
];

export function NoteCard({
  note,
  onBack: _onBack,
  onDeleted,
  refreshKey,
  icons = ['📄', '📝', '💡', '🎯', '🚀', '📚', '💼'],
}: {
  note: NoteData;
  onBack: () => void;
  onDeleted: () => void;
  refreshKey: number;
  icons?: string[];
}) {
  const notePackageId = useNetworkVariable('notePackageId');
  const client = useCurrentClient();
  const dAppKit = useDAppKit();
  const queryClient = useQueryClient();

  const { mutate: signAndExecute } = useMutation({
    mutationFn: (tx: Transaction) =>
      dAppKit.signAndExecuteTransaction({ transaction: tx }),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📄');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [slashMenu, setSlashMenu] = useState<{
    show: boolean;
    query: string;
    position: number;
  }>({
    show: false,
    query: '',
    position: 0,
  });
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, isPending } = useQuery({
    queryKey: ['getNote', note.id, refreshKey],
    queryFn: () =>
      client.getObject({
        id: note.id,
        options: { showContent: true },
      }),
    staleTime: 0,
  });

  const content = data?.data?.content;
  const noteData = (
    content?.dataType === 'moveObject' ? content.fields : null
  ) as {
    title: string;
    content: string;
  } | null;
const freshTitle = noteData?.title ?? note.title ?? '';
  const freshContent = noteData?.content ?? note.content ?? '';

  // Parse inline formatting (bold, italic, highlight, link, inline code)
  const parseInlineContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    const patterns = [
      { regex: /^\$\$(.+)\$\$/, render: (content: string) => {
        try {
          return <div key={keyIndex++} dangerouslySetInnerHTML={{ __html: katex.renderToString(content, { displayMode: true, throwOnError: false }) }} />;
        } catch { return <code key={keyIndex++}>${content}$</code>; }
      } }, // Block formula (greedy)
      { regex: /^\$(.+)\$/, render: (content: string) => {
        try {
          return <span key={keyIndex++} dangerouslySetInnerHTML={{ __html: katex.renderToString(content, { displayMode: false, throwOnError: false }) }} />;
        } catch { return <code key={keyIndex++}>${content}$</code>; }
      } }, // Inline formula (greedy)
      { regex: /^\*\*\*\*(.+?)\*\*\*\*/, render: (content: string) => <strong key={keyIndex++}><em>{content}</em></strong> }, // Bold + Italic
      { regex: /^\*\*(.+?)\*\*/, render: (content: string) => <strong key={keyIndex++} style={{ fontWeight: 600 }}>{content}</strong> }, // Bold
      { regex: /^__(.+?)__/, render: (content: string) => <strong key={keyIndex++}>{content}</strong> }, // Bold alt
      { regex: /^\*(.+?)\*/, render: (content: string) => <em key={keyIndex++}>{content}</em> }, // Italic
      { regex: /^_(.+?)_/, render: (content: string) => <em key={keyIndex++}>{content}</em> }, // Italic alt
      { regex: /^\+\+(.+?)\+\+/, render: (content: string) => <mark key={keyIndex++} style={{ backgroundColor: '#fef3c7', padding: '0 2px', borderRadius: '2px' }}>{content}</mark> }, // Highlight
      { regex: /^\=\=(.+?)\=\=/, render: (content: string) => <mark key={keyIndex++} style={{ backgroundColor: '#fef3c7', padding: '0 2px', borderRadius: '2px' }}>{content}</mark> }, // Highlight alt
      { regex: /^~~(.+?)~~/, render: (content: string) => <del key={keyIndex++}>{content}</del> }, // Strikethrough
      { regex: /^`([^`]+)`/, render: (content: string) => <code key={keyIndex++} style={{ backgroundColor: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '13px' }}>{content}</code> }, // Inline code
      { regex: /^\!\[([^\]]*)\]\(([^)]+)\)/, render: (alt: string, url: string) => <img key={keyIndex++} src={url} alt={alt} style={{ maxWidth: '100%', borderRadius: '4px', margin: '8px 0' }} /> }, // Image
      { regex: /^\[([^\]]+)\]\(([^)]+)\)/, render: (text: string, url: string) => <a key={keyIndex++} href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', borderBottom: '1px solid var(--accent-blue)' }}>{text}</a> }, // Link
    ];

    while (remaining.length > 0) {
      let matched = false;

      for (const pattern of patterns) {
        const match = remaining.match(pattern.regex);
        if (match) {
          const content = pattern.render(match[1], match[2]);
          parts.push(content);
          remaining = remaining.slice(match[0].length);
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Find the next special character or add the whole remaining text
        const nextSpecial = remaining.search(/[*_`=\[+\$]/);
        if (nextSpecial === -1) {
          parts.push(remaining);
          break;
        } else if (nextSpecial === 0) {
          // Special char but no pattern matched, add it as regular text
          parts.push(remaining.charAt(0));
          remaining = remaining.slice(1);
        } else {
          parts.push(remaining.slice(0, nextSpecial));
          remaining = remaining.slice(nextSpecial);
        }
      }
    }

    return parts;
  };

  // Content renderer with proper block detection
  const renderContent = (content: string, onToggleTodo?: (index: number) => void) => {
    if (!content) return null;

    const blocks: React.ReactNode[] = [];
    const lines = content.split('\n');
    let i = 0;
    let todoIndex = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        i++;
        continue;
      }

      // Heading 1
      if (trimmed.startsWith('# ') && !trimmed.startsWith('##')) {
        blocks.push(
          <h1 key={blocks.length} className="notion-h1">
            {trimmed.slice(2)}
          </h1>
        );
        i++;
        continue;
      }

      // Heading 2
      if (trimmed.startsWith('## ') && !trimmed.startsWith('###')) {
        blocks.push(
          <h2 key={blocks.length} className="notion-h2">
            {trimmed.slice(3)}
          </h2>
        );
        i++;
        continue;
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        blocks.push(
          <h3 key={blocks.length} className="notion-h3">
            {trimmed.slice(4)}
          </h3>
        );
        i++;
        continue;
      }

      // Divider
      if (trimmed === '---') {
        blocks.push(<hr key={blocks.length} className="notion-divider" />);
        i++;
        continue;
      }

      // Todo item
      if (/^-\s*\[\s*[xX ]\s*\]\s*/.test(trimmed)) {
        const todoMatch = trimmed.match(/^-\s*\[\s*([xX ])\s*\]\s*(.+)$/);
        if (todoMatch) {
          const done = todoMatch[1].toLowerCase() === 'x';
          blocks.push(
            <div
              key={blocks.length}
              className="notion-todo"
              onClick={() => onToggleTodo?.(todoIndex)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onToggleTodo?.(todoIndex);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <span className={`notion-todo-checkbox ${done ? 'checked' : ''}`}>
                {done ? '✓' : '○'}
              </span>
              <span className={`notion-todo-text ${done ? 'done' : ''}`}>
                {todoMatch[2]}
              </span>
            </div>
          );
          todoIndex++;
          i++;
          continue;
        }
      }

      // Bullet list - collect consecutive items (must check AFTER todo, since todo also starts with "-")
      if (trimmed.startsWith('- ') && !/^-\s*\[/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('- ') && !/^-\s*\[/.test(lines[i].trim())) {
          items.push(lines[i].trim().slice(2));
          i++;
        }
        blocks.push(
          <ul key={blocks.length} className="notion-ul">
            {items.map((text, idx) => (
              <li key={idx} className="notion-li">
                {parseInlineContent(text)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Numbered list
      if (/^\d+\.\s/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
          i++;
        }
        blocks.push(
          <ol key={blocks.length} className="notion-ol">
            {items.map((text, idx) => (
              <li key={idx} className="notion-li">
                {parseInlineContent(text)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Quote
      if (trimmed.startsWith('> ')) {
        const quotes: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('> ')) {
          quotes.push(lines[i].trim().slice(2));
          i++;
        }
        blocks.push(
          <blockquote key={blocks.length} className="notion-quote">
            {quotes.map((q, idx) => (
              <p key={idx} className="notion-p">
                {parseInlineContent(q)}
              </p>
            ))}
          </blockquote>
        );
        continue;
      }

      // Code block
      if (trimmed.startsWith('```mermaid')) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().endsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        const code = codeLines.join('\n');
        blocks.push(
          <div key={blocks.length} className="notion-mermaid-container">
            <MermaidDiagram code={code} />
          </div>
        );
        i++;
        continue;
      }

      // Regular code block
      if (trimmed.startsWith('```')) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().endsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        blocks.push(
          <pre key={blocks.length} className="notion-code">
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        i++;
        continue;
      }

      // Table (| col1 | col2 | ...)
      if (trimmed.startsWith('|')) {
        const tableRows: string[][] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          const row = lines[i].trim()
            .split('|')
            .filter(cell => cell !== '');
          tableRows.push(row);
          i++;
        }
        // Skip the separator row (|---|)
        if (tableRows.length > 1 && tableRows[1].every(cell => /^[-:]+$/.test(cell))) {
          tableRows.splice(1, 1);
        }
        if (tableRows.length > 0) {
          const headers = tableRows[0];
          const dataRows = tableRows.slice(1);
          blocks.push(
            <table key={blocks.length} className="notion-table">
              <thead>
                <tr>
                  {headers.map((header, idx) => (
                    <th key={idx} className="notion-th">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="notion-td">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        continue;
      }

      // Block formula ($$formula$$) - single line
      if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
        const formula = trimmed.slice(2, -2);
        if (formula) {
          try {
            blocks.push(
              <div key={blocks.length} className="notion-formula" dangerouslySetInnerHTML={{ __html: katex.renderToString(formula, { displayMode: true, throwOnError: false }) }} />
            );
          } catch {
            blocks.push(
              <pre key={blocks.length} className="notion-code">$${formula}$$</pre>
            );
          }
        }
        i++;
        continue;
      }

      // Multi-line block formula ($$ on its own line)
      if (trimmed === '$$') {
        const formulaLines: string[] = [];
        i++;
        while (i < lines.length) {
          const line = lines[i].trim();
          if (line === '$$') {
            i++;
            break;
          }
          formulaLines.push(line);
          i++;
        }
        if (formulaLines.length > 0) {
          const formula = formulaLines.join('\n');
          try {
            blocks.push(
              <div key={blocks.length} className="notion-formula" dangerouslySetInnerHTML={{ __html: katex.renderToString(formula, { displayMode: true, throwOnError: false }) }} />
            );
          } catch {
            blocks.push(
              <pre key={blocks.length} className="notion-code">$${formula}$$</pre>
            );
          }
        }
        continue;
      }

      // Regular paragraph - collect until empty line or new block
      const paraLines: string[] = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        if (!l) break;
        // Block formula starts with $$ and is the only content on line
        if (l.startsWith('$$') && l.endsWith('$$')) {
          // Check if it's a single-line formula like $$x^2$$
          const inner = l.slice(2, -2);
          if (inner.length > 0 && !l.includes('\n')) {
            break;
          }
        }
        if (l === '$$') break;
        if (l.startsWith('# ') || l.startsWith('## ') || l.startsWith('### ') || l === '---' || l.startsWith('- ') || /^\d+\.\s/.test(l) || l.startsWith('> ') || l.startsWith('```') || l.startsWith('|')) {
          break;
        }
        paraLines.push(l);
        i++;
      }
      if (paraLines.length > 0) {
        const joinedText = paraLines.join('\n');
        const inlineParts = parseInlineContent(joinedText);
        blocks.push(
          <p key={blocks.length} className="notion-p">
            {inlineParts}
          </p>
        );
      }
    }

    return blocks.length > 0 ? blocks : null;
  };

  useEffect(() => {
    setEditTitle(freshTitle);
    setEditContent(freshContent);
    setSelectedIcon(note.icon || '📄');
    setIsEditing(false);
  }, [note.id, freshTitle, freshContent, note.icon]);

  const handleStartEdit = () => {
    setEditTitle(freshTitle);
    setEditContent(freshContent);
    setIsEditing(true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!slashMenu.show) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedCommandIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedCommandIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === 'Enter' && filteredCommands.length > 0) {
      e.preventDefault();
      insertCommand(filteredCommands[selectedCommandIndex]);
    } else if (e.key === 'Escape') {
      setSlashMenu({ show: false, query: '', position: 0 });
    }
  };

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);

    // Find the last "/" before cursor that's not escaped or inside a URL
    let lastSlash = -1;
    for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
      const char = textBeforeCursor[i];
      if (char === '/' && (i === 0 || textBeforeCursor[i - 1] !== '\\')) {
        // Check if it's part of a URL pattern - if there's a closing ] before it, it's a link
        const afterSlash = textBeforeCursor.slice(i);
        if (!afterSlash.match(/^\/[^[(]*\[/) && !afterSlash.match(/^\/[^(]*\(/)) {
          lastSlash = i;
          break;
        }
      }
    }

    if (lastSlash >= 0) {
      const query = textBeforeCursor.slice(lastSlash + 1, cursorPos);
      // Only show menu if query doesn't contain spaces or line breaks (still typing command)
      if (!query.includes(' ') && !query.includes('\n') && query.length > 0) {
        setSlashMenu({
          show: true,
          query,
          position: lastSlash,
        });
        setSelectedCommandIndex(0);
      } else {
        setSlashMenu({ show: false, query: '', position: 0 });
      }
    } else {
      setSlashMenu({ show: false, query: '', position: 0 });
    }

    setEditContent(value);
  };

  const filteredCommands = slashMenu.query
    ? SLASH_COMMANDS.filter(
        (cmd) =>
          cmd.name.toLowerCase().includes(slashMenu.query.toLowerCase()) ||
          cmd.id.includes(slashMenu.query.toLowerCase())
      )
    : SLASH_COMMANDS;

  const insertCommand = (cmd: SlashCommand) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const pos = slashMenu.position;
    const textBeforeSlash = editContent.slice(0, pos);
    const textAfterCursor = editContent.slice(cursorPos);

    const newContent = textBeforeSlash + cmd.prefix + textAfterCursor;

    setEditContent(newContent);
    setSlashMenu({ show: false, query: '', position: 0 });

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = pos + cmd.prefix.length;
        textareaRef.current.selectionStart = newPos;
        textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const updateNote = () => {
    if (!editTitle.trim()) return;
    setWaiting(true);

    const tx = new Transaction();
    tx.moveCall({
      target: `${notePackageId}::greeting::update_content`,
      arguments: [
        tx.object(note.id),
        tx.pure.string(editTitle),
        tx.pure.string(editContent),
      ],
    });

    signAndExecute(tx, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getOwnedNotes'] });
        queryClient.invalidateQueries({ queryKey: ['getNote', note.id] });
        setWaiting(false);
        setIsEditing(false);
      },
      onError: () => setWaiting(false),
    });
  };

  const deleteNote = () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    setWaiting(true);

    const tx = new Transaction();
    tx.moveCall({
      target: `${notePackageId}::greeting::delete`,
      arguments: [tx.object(note.id)],
    });

    signAndExecute(tx, {
      onSuccess: () => {
        setWaiting(false);
        onDeleted();
      },
      onError: () => setWaiting(false),
    });
  };

  const toggleTodo = (index: number) => {
    setWaiting(true);

    // Parse current content and toggle the todo state
    const lines = freshContent.split('\n');
    let todoIndex = 0;
    const newLines = lines.map((line) => {
      const match = line.match(/^-\s*\[([ xX])\]\s*(.+)$/);
      if (match) {
        if (todoIndex === index) {
          const newState = match[1].toLowerCase() === 'x' ? ' ' : 'x';
          return `- [${newState}] ${match[2]}`;
        }
        todoIndex++;
      }
      return line;
    });

    const newContent = newLines.join('\n');

    // Save to blockchain
    const tx = new Transaction();
    tx.moveCall({
      target: `${notePackageId}::greeting::update_content`,
      arguments: [
        tx.object(note.id),
        tx.pure.string(freshTitle),
        tx.pure.string(newContent),
      ],
    });

    signAndExecute(tx, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getOwnedNotes'] });
        queryClient.invalidateQueries({ queryKey: ['getNote', note.id] });
        setWaiting(false);
      },
      onError: () => setWaiting(false),
    });
  };

  const handleCancelEdit = () => {
    setEditTitle(freshTitle);
    setEditContent(freshContent);
    setIsEditing(false);
    setSlashMenu({ show: false, query: '', position: 0 });
  };

  if (isPending) {
    return (
      <div className="page-content">
        <div className="page-inner">
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-inner">
        {note.cover && (
          <div
            className="page-cover"
            style={{ backgroundImage: `url(${note.cover})` }}
          />
        )}

        {isEditing ? (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <div
                className="page-icon"
                style={{
                  width: '64px',
                  height: '64px',
                  fontSize: '40px',
                  cursor: 'pointer',
                }}
                onClick={() => setShowIconPicker(!showIconPicker)}
              >
                {selectedIcon}
              </div>
            </div>

            {showIconPicker && (
              <div className="icon-picker" style={{ marginBottom: '24px' }}>
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedIcon(icon);
                      setShowIconPicker(false);
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}

            <input
              className="page-title"
              style={{ fontSize: '32px' }}
              value={editTitle}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEditTitle(e.target.value)
              }
            />

            <div style={{ position: 'relative' }}>
              <textarea
                ref={textareaRef}
                className="textarea"
                style={{ minHeight: '400px', marginTop: '16px' }}
                value={editContent}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder="Type / for commands..."
              />

              {slashMenu.show && filteredCommands.length > 0 && (
                <div className="slash-menu">
                  <div className="slash-menu-header">Basic blocks</div>
                  {filteredCommands.map((cmd, index) => (
                    <button
                      key={cmd.id}
                      type="button"
                      className={`slash-menu-item ${index === selectedCommandIndex ? 'selected' : ''}`}
                      onClick={() => insertCommand(cmd)}
                    >
                      <span className="slash-menu-icon">{cmd.icon}</span>
                      <div className="slash-menu-info">
                        <span className="slash-menu-name">{cmd.name}</span>
                        <span className="slash-menu-desc">
                          {cmd.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelEdit}
                disabled={waiting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={updateNote}
                disabled={waiting || !editTitle.trim()}
              >
                {waiting ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="page-icon-wrapper">
              <div
                className="page-icon"
                onClick={handleStartEdit}
                title="Click to edit"
              >
                {note.icon || '📄'}
              </div>
            </div>

            <h1
              className="page-title"
              style={{ cursor: 'pointer' }}
              onClick={handleStartEdit}
            >
              {freshTitle}
            </h1>

            <div className="page-properties">
              <div className="property-row">
                <span className="property-label">ID</span>
                <span
                  className="property-value"
                  style={{ fontFamily: 'monospace', fontSize: '11px' }}
                >
                  {note.id.slice(0, 10)}...{note.id.slice(-6)}
                </span>
              </div>
            </div>

            <div className="divider" />

            <div className="page-blocks">
              <div className="block">
                <div className="block-content">
                  <div className="block-content-inner">
                    {freshContent ? (
                      renderContent(freshContent, toggleTodo)
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        Click to add content...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleStartEdit}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={deleteNote}
                disabled={waiting}
                style={{ color: '#f87171' }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
