import { useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import katex from 'katex';
import {
  Clock,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import mermaid from 'mermaid';
import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useNetworkVariable } from './networkConfig';

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
          const errorMsg =
            e instanceof Error ? e.message : 'Invalid diagram syntax';
          containerRef.current.innerHTML = `<pre class="notion-code"><code>${code}</code></pre><p style="color:red;font-size:12px">Mermaid error: ${errorMsg}</p>`;
        }
      }
    };
    renderDiagram();
  }, [code]);

  return <div ref={containerRef} className="notion-mermaid" />;
}

function KatexExpr({
  content,
  displayMode,
}: {
  content: string;
  displayMode: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      katex.render(content, ref.current, { displayMode, throwOnError: false });
    }
  }, [content, displayMode]);

  return displayMode ? (
    <span
      className="notion-formula block w-full overflow-x-auto"
      ref={ref}
      style={{ display: 'block', margin: '1em 0' }}
    />
  ) : (
    <span ref={ref} />
  );
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
    icon: '☑️',
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
    prefix:
      '| Header1 | Header2 | Header3 |\n| :--- | :---: | ---: |\n| Cell1 | Cell2 | Cell3 |\n',
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
    icon: '</>',
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
  const [hasChanges, setHasChanges] = useState(false);

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

  const parseInlineContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    const patterns = [
      {
        regex: /^\$\$(.+)\$\$/,
        render: (content: string) => (
          <KatexExpr key={keyIndex++} content={content} displayMode={true} />
        ),
      },
      {
        regex: /^\$(.+)\$/,
        render: (content: string) => (
          <KatexExpr key={keyIndex++} content={content} displayMode={false} />
        ),
      },
      {
        regex: /^\*\*\*\*(.+?)\*\*\*\*/,
        render: (content: string) => (
          <strong key={keyIndex++}>
            <em>{content}</em>
          </strong>
        ),
      },
      {
        regex: /^\*\*(.+?)\*\*/,
        render: (content: string) => (
          <strong key={keyIndex++} style={{ fontWeight: 600 }}>
            {content}
          </strong>
        ),
      },
      {
        regex: /^__(.+?)__/,
        render: (content: string) => (
          <strong key={keyIndex++}>{content}</strong>
        ),
      },
      {
        regex: /^\*(.+?)\*/,
        render: (content: string) => <em key={keyIndex++}>{content}</em>,
      },
      {
        regex: /^_(.+?)_/,
        render: (content: string) => <em key={keyIndex++}>{content}</em>,
      },
      {
        regex: /^\+\+(.+?)\+\+/,
        render: (content: string) => (
          <mark
            key={keyIndex++}
            style={{
              backgroundColor: '#fef3c7',
              padding: '0 2px',
              borderRadius: '2px',
            }}
          >
            {content}
          </mark>
        ),
      },
      {
        regex: /^==(.+?)==/,
        render: (content: string) => (
          <mark
            key={keyIndex++}
            style={{
              backgroundColor: '#fef3c7',
              padding: '0 2px',
              borderRadius: '2px',
            }}
          >
            {content}
          </mark>
        ),
      },
      {
        regex: /^~~(.+?)~~/,
        render: (content: string) => <del key={keyIndex++}>{content}</del>,
      },
      {
        regex: /^`([^`]+)`/,
        render: (content: string) => (
          <code
            key={keyIndex++}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '13px',
            }}
          >
            {content}
          </code>
        ),
      },
      {
        regex: /^!\[([^\]]*)\]\(([^)]+)\)/,
        render: (alt: string, url: string) => (
          <img
            key={keyIndex++}
            src={url}
            alt={alt}
            style={{ maxWidth: '100%', borderRadius: '4px', margin: '8px 0' }}
          />
        ),
      },
      {
        regex: /^\[([^\]]+)\]\(([^)]+)\)/,
        render: (text: string, url: string) => (
          <a
            key={keyIndex++}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#2eaadc',
              textDecoration: 'none',
              borderBottom: '1px solid #2eaadc',
            }}
          >
            {text}
          </a>
        ),
      },
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
        const nextSpecial = remaining.search(/[*_`=[+$]/);
        if (nextSpecial === -1) {
          parts.push(remaining);
          break;
        } else if (nextSpecial === 0) {
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

  const renderContent = (
    content: string,
    onToggleTodo?: (index: number) => void
  ) => {
    if (!content) return null;

    const blocks: React.ReactNode[] = [];
    const lines = content.split('\n');
    let i = 0;
    let todoIndex = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      if (trimmed.startsWith('# ') && !trimmed.startsWith('##')) {
        blocks.push(
          <h1 key={`h1-${trimmed.slice(2, 22)}`} className="notion-h1">
            {trimmed.slice(2)}
          </h1>
        );
        i++;
        continue;
      }

      if (trimmed.startsWith('## ') && !trimmed.startsWith('###')) {
        blocks.push(
          <h2 key={`h2-${trimmed.slice(3, 23)}`} className="notion-h2">
            {trimmed.slice(3)}
          </h2>
        );
        i++;
        continue;
      }

      if (trimmed.startsWith('### ')) {
        blocks.push(
          <h3 key={`h3-${trimmed.slice(4, 24)}`} className="notion-h3">
            {trimmed.slice(4)}
          </h3>
        );
        i++;
        continue;
      }

      if (trimmed === '---') {
        blocks.push(<hr key={`hr-${i}`} className="notion-divider" />);
        i++;
        continue;
      }

      if (/^-\s*\[\s*[xX ]\s*\]\s*/.test(trimmed)) {
        const todoMatch = trimmed.match(/^-\s*\[\s*([xX ])\s*\]\s*(.+)$/);
        if (todoMatch) {
          const done = todoMatch[1].toLowerCase() === 'x';
          blocks.push(
            <button
              key={`todo-${todoMatch[2].slice(0, 16)}`}
              type="button"
              className="notion-todo w-full text-left"
              onClick={() => onToggleTodo?.(todoIndex)}
            >
              <span className={`notion-todo-checkbox ${done ? 'checked' : ''}`}>
                {done ? '✓' : '○'}
              </span>
              <span className={`notion-todo-text ${done ? 'done' : ''}`}>
                {todoMatch[2]}
              </span>
            </button>
          );
          todoIndex++;
          i++;
          continue;
        }
      }

      if (trimmed.startsWith('- ') && !/^-\s*\[/.test(trimmed)) {
        const items: string[] = [];
        while (
          i < lines.length &&
          lines[i].trim().startsWith('- ') &&
          !/^-\s*\[/.test(lines[i].trim())
        ) {
          items.push(lines[i].trim().slice(2));
          i++;
        }
        blocks.push(
          <ul key={`ul-${items.join('').slice(0, 20)}`} className="notion-ul">
            {(() => {
              const counts = new Map<string, number>();
              return items.map((text) => {
                const count = counts.get(text) || 0;
                counts.set(text, count + 1);
                return (
                  <li key={`li-${text}-${count}`} className="notion-li">
                    {parseInlineContent(text)}
                  </li>
                );
              });
            })()}
          </ul>
        );
        continue;
      }

      if (/^\d+\.\s/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
          i++;
        }
        blocks.push(
          <ol key={`ol-${items.join('').slice(0, 20)}`} className="notion-ol">
            {(() => {
              const counts = new Map<string, number>();
              return items.map((text) => {
                const count = counts.get(text) || 0;
                counts.set(text, count + 1);
                return (
                  <li key={`li-${text}-${count}`} className="notion-li">
                    {parseInlineContent(text)}
                  </li>
                );
              });
            })()}
          </ol>
        );
        continue;
      }

      if (trimmed.startsWith('> ')) {
        const quotes: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('> ')) {
          quotes.push(lines[i].trim().slice(2));
          i++;
        }
        blocks.push(
          <blockquote key={`quote-${i}`} className="notion-quote">
            {quotes.map((q) => (
              <p key={q} className="notion-p">
                {parseInlineContent(q)}
              </p>
            ))}
          </blockquote>
        );
        continue;
      }

      if (trimmed.startsWith('```mermaid')) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().endsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        const code = codeLines.join('\n');
        blocks.push(
          <div key={`mermaid-${i}`} className="notion-mermaid-container">
            <MermaidDiagram code={code} />
          </div>
        );
        i++;
        continue;
      }

      if (trimmed.startsWith('```')) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().endsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        blocks.push(
          <pre key={`code-${i}`} className="notion-code">
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        i++;
        continue;
      }

      if (trimmed.startsWith('|')) {
        const tableRows: string[][] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          const row = lines[i]
            .trim()
            .split('|')
            .map((c) => c.trim())
            .filter((cell) => cell !== '');
          tableRows.push(row);
          i++;
        }

        let alignments: ('left' | 'center' | 'right')[] = [];
        if (
          tableRows.length > 1 &&
          tableRows[1].every((cell) => /^:?[-]+:?$/.test(cell))
        ) {
          alignments = tableRows[1].map((cell) => {
            const hasLeft = cell.startsWith(':');
            const hasRight = cell.endsWith(':');
            if (hasLeft && hasRight) return 'center';
            if (hasRight) return 'right';
            return 'left';
          });
          tableRows.splice(1, 1);
        }

        if (tableRows.length > 0) {
          const headers = tableRows[0];
          const dataRows = tableRows.slice(1);
          blocks.push(
            <table key={`table-${headers.join('')}`} className="notion-table">
              <thead>
                <tr>
                  {(() => {
                    const counts = new Map<string, number>();
                    let colIdx = 0;
                    return headers.map((header) => {
                      const count = counts.get(header) || 0;
                      counts.set(header, count + 1);
                      const align = alignments[colIdx++] || 'left';
                      return (
                        <th
                          key={`th-${header}-${count}`}
                          className="notion-th"
                          style={{ textAlign: align }}
                        >
                          {header}
                        </th>
                      );
                    });
                  })()}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row) => {
                  const cellCounts = new Map<string, number>();
                  let colIdx = 0;
                  return (
                    <tr key={`row-${row.join('|')}`}>
                      {row.map((cell) => {
                        const count = cellCounts.get(cell) || 0;
                        cellCounts.set(cell, count + 1);
                        const align = alignments[colIdx++] || 'left';
                        return (
                          <td
                            key={`cell-${cell}-${count}`}
                            className="notion-td"
                            style={{ textAlign: align }}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        }
        continue;
      }

      if (
        trimmed.startsWith('$$') &&
        trimmed.endsWith('$$') &&
        trimmed.length > 4
      ) {
        const formula = trimmed.slice(2, -2);
        if (formula) {
          blocks.push(
            <KatexExpr
              key={`formula-${formula.slice(0, 20)}`}
              content={formula}
              displayMode={true}
            />
          );
        }
        i++;
        continue;
      }

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
          blocks.push(
            <KatexExpr
              key={`formula-block-${i}`}
              content={formula}
              displayMode={true}
            />
          );
        }
        continue;
      }

      const paraLines: string[] = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        if (!l) break;
        if (l.startsWith('$$') && l.endsWith('$$')) {
          const inner = l.slice(2, -2);
          if (inner.length > 0 && !l.includes('\n')) {
            break;
          }
        }
        if (l === '$$') break;
        if (
          l.startsWith('# ') ||
          l.startsWith('## ') ||
          l.startsWith('### ') ||
          l === '---' ||
          l.startsWith('- ') ||
          /^\d+\.\s/.test(l) ||
          l.startsWith('> ') ||
          l.startsWith('```') ||
          l.startsWith('|')
        ) {
          break;
        }
        paraLines.push(l);
        i++;
      }
      if (paraLines.length > 0) {
        const joinedText = paraLines.join('\n');
        const inlineParts = parseInlineContent(joinedText);
        blocks.push(
          <p key={`p-${joinedText.slice(0, 20)}`} className="notion-p">
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
  }, [freshTitle, freshContent, note.icon]);

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

    let lastSlash = -1;
    for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
      const char = textBeforeCursor[i];
      if (char === '/' && (i === 0 || textBeforeCursor[i - 1] !== '\\')) {
        const afterSlash = textBeforeCursor.slice(i);
        if (
          !afterSlash.match(/^\/[^[(]*\[/) &&
          !afterSlash.match(/^\/[^(]*\(/)
        ) {
          lastSlash = i;
          break;
        }
      }
    }

    if (lastSlash >= 0) {
      const query = textBeforeCursor.slice(lastSlash + 1, cursorPos);
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
    setHasChanges(true);
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

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = pos + cmd.prefix.length;
        textareaRef.current.selectionStart = newPos;
        textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
      }
    }, 0);
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
    const content = isEditing ? editContent : freshContent;
    const lines = content.split('\n');
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

    if (isEditing) {
      setEditContent(newContent);
    }

    setHasChanges(true);
  };

  const saveAllChanges = () => {
    if (!hasChanges) return;
    setWaiting(true);

    const contentToSave = isEditing ? editContent : freshContent;

    const tx = new Transaction();
    tx.moveCall({
      target: `${notePackageId}::greeting::update_content`,
      arguments: [
        tx.object(note.id),
        tx.pure.string(freshTitle),
        tx.pure.string(contentToSave),
      ],
    });

    signAndExecute(tx, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getOwnedNotes'] });
        queryClient.invalidateQueries({ queryKey: ['getNote', note.id] });
        setWaiting(false);
        setHasChanges(false);
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
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto px-12 pb-20 pt-12">
        {isEditing ? (
          <div className="animate-in fade-in duration-300">
            <div className="relative group/title">
              <div className="flex justify-center mb-8">
                <Popover>
                  <PopoverTrigger className="w-24 h-24 text-6xl rounded-[2rem] bg-muted/50 hover:bg-muted flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 shadow-inner group-hover/title:shadow-primary/5">
                    {selectedIcon}
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-3 rounded-2xl shadow-2xl border-border/50 backdrop-blur-xl bg-background/95"
                    align="center"
                  >
                    <div className="grid grid-cols-5 gap-2">
                      {icons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-200',
                            selectedIcon === icon
                              ? 'bg-primary/10 text-primary scale-110 shadow-sm'
                              : 'hover:bg-muted'
                          )}
                          onClick={() => {
                            setSelectedIcon(icon);
                            setHasChanges(true);
                          }}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <input
                className="w-full text-5xl font-black bg-transparent border-none outline-none mb-8 text-center placeholder:opacity-20 tracking-tight"
                value={editTitle}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setEditTitle(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="Untitled"
              />
            </div>

            <div className="relative">
              <Textarea
                ref={textareaRef}
                className="min-h-[500px] text-lg leading-relaxed resize-none border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:opacity-30"
                value={editContent}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder="Type '/' for magic..."
              />

              {slashMenu.show && filteredCommands.length > 0 && (
                <div className="absolute left-0 top-12 w-72 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground border-b border-border/50 uppercase tracking-widest bg-muted/30">
                    Basic blocks
                  </div>
                  <div className="p-1">
                    {filteredCommands.map((cmd, index) => (
                      <button
                        key={cmd.id}
                        type="button"
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 text-left cursor-pointer transition-all rounded-xl',
                          index === selectedCommandIndex
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => insertCommand(cmd)}
                      >
                        <span
                          className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm',
                            index === selectedCommandIndex
                              ? 'bg-white/20'
                              : 'bg-muted'
                          )}
                        >
                          {cmd.icon}
                        </span>
                        <div>
                          <div className="text-sm font-bold leading-none mb-1">
                            {cmd.name}
                          </div>
                          <div
                            className={cn(
                              'text-[10px] leading-none',
                              index === selectedCommandIndex
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            )}
                          >
                            {cmd.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="fixed bottom-8 right-8 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-500">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={waiting}
                className="rounded-full px-6 shadow-sm bg-background/80 backdrop-blur-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={saveAllChanges}
                disabled={
                  waiting || !editTitle.trim() || (!hasChanges && !isEditing)
                }
                className="rounded-full px-8 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all gap-2"
              >
                {waiting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {waiting ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-center mb-8">
              <button
                type="button"
                className="w-24 h-24 text-6xl rounded-[2.5rem] cursor-pointer hover:bg-muted/50 flex items-center justify-center transition-all duration-500 hover:scale-110 shadow-sm"
                onClick={handleStartEdit}
              >
                {note.icon || '📄'}
              </button>
            </div>

            <h1 className="text-center mb-10">
              <button
                type="button"
                className="text-5xl font-black cursor-pointer hover:opacity-80 transition-all bg-transparent border-none p-0 tracking-tight"
                onClick={handleStartEdit}
              >
                {freshTitle}
              </button>
            </h1>

            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mb-12 pb-8 border-b border-border/50">
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full">
                <FileText className="w-3.5 h-3.5" />
                <span className="font-mono tracking-tighter">
                  {note.id.slice(0, 12)}...
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">Edited 2m ago</span>
              </div>
            </div>

            <div className="prose prose-neutral max-w-none prose-headings:font-black prose-p:text-lg prose-p:leading-relaxed prose-pre:bg-muted prose-pre:rounded-2xl prose-pre:border-none">
              {freshContent ? (
                <div className="animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
                  {renderContent(freshContent, toggleTodo)}
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full text-center py-24 cursor-pointer hover:bg-muted/30 border-2 border-dashed border-border/50 rounded-[2rem] transition-all group"
                  onClick={handleStartEdit}
                >
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium text-lg">
                    Click to start your masterpiece...
                  </p>
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 mt-20 pt-10 border-t border-border/50">
              <Button
                variant="outline"
                onClick={handleStartEdit}
                className="rounded-full px-8 gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all h-11"
              >
                <Pencil className="w-4 h-4" />
                Edit Page
              </Button>
              <Button
                variant="ghost"
                onClick={deleteNote}
                disabled={waiting}
                className="rounded-full px-8 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all h-11"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
