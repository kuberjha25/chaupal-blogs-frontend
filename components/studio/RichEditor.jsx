import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { api, mediaUrl } from '@/lib/api';
import { useToast } from '@/lib/ui';

/* ---- Custom font-size mark (textStyle te style attribute) ---- */
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize || null,
            renderHTML: (attrs) => (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {}),
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

/* ---- Table with class attr — t-gold / t-striped / t-min / t-card ---- */
const StyledTable = Table.extend({
  addAttributes() {
    return {
      ...(this.parent ? this.parent() : {}),
      class: {
        default: null,
        parseHTML: (el) => el.getAttribute('class'),
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
      },
    };
  },
});

const FONTS = [
  { v: '', label: 'Archivo (body)' },
  { v: "'Anton', sans-serif", label: 'Anton (display)' },
  { v: "'Baloo Paaji 2', sans-serif", label: 'Baloo Paaji 2 (ਪੰਜਾਬੀ)' },
  { v: "'Baloo 2', sans-serif", label: 'Baloo 2 (हिन्दी)' },
  { v: 'Georgia, serif', label: 'Georgia (serif)' },
  { v: 'ui-monospace, monospace', label: 'Mono' },
];
const SIZES = ['13px', '15px', '17px', '19px', '22px', '26px', '32px', '42px'];
const TEXT_COLORS = ['#F2B01E', '#8C5E00', '#A14A1E', '#A63563', '#1E7A4C', '#201C13', '#6E685B'];
const HL_COLORS = ['#FFF3C4', '#FFE4D1', '#FBD8E6', '#DDF0E4', '#E9E2F1', '#DFE7F0'];
const TABLE_STYLES = [
  { v: '', label: 'Simple grid' },
  { v: 't-gold', label: 'Gold header' },
  { v: 't-striped', label: 'Striped rows' },
  { v: 't-min', label: 'Minimal lines' },
  { v: 't-card', label: 'Card cells' },
];

export default function RichEditor({ value = '', onChange }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const wrapRef = useRef(null);
  const [pop, setPop] = useState(null); // 'color' | 'hl' | 'table' | null
  const [src, setSrc] = useState(false);
  const [html, setHtml] = useState('');
  const [fs, setFs] = useState(false);
  const [tRows, setTRows] = useState(3);
  const [tCols, setTCols] = useState(3);
  const [tStyle, setTStyle] = useState('t-gold');
  const [tHead, setTHead] = useState(true);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Image.configure({ inline: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      StyledTable.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: 'Story likho… headings, tables, images — sab kuchh ithe.' }),
    ],
    content: value,
    onUpdate: ({ editor: ed }) => onChange && onChange(ed.getHTML()),
  });

  /* Parent async load → editor sync (bina cursor tode) */
  useEffect(() => {
    if (editor && value !== undefined && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]); // eslint-disable-line

  /* Popover outside-click close */
  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setPop(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!editor) return <div className="loading">EDITOR LOAD HO RAHA…</div>;

  const c = () => editor.chain().focus();

  const blockValue = editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
    ? 'h3'
    : editor.isActive('blockquote')
    ? 'quote'
    : 'p';

  const setBlock = (v) => {
    if (v === 'p') c().setParagraph().run();
    else if (v === 'h2') c().toggleHeading({ level: 2 }).run();
    else if (v === 'h3') c().toggleHeading({ level: 3 }).run();
    else if (v === 'quote') c().toggleBlockquote().run();
  };

  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL:', prev);
    if (url === null) return;
    if (url === '') c().extendMarkRange('link').unsetLink().run();
    else c().extendMarkRange('link').setLink({ href: url }).run();
  };

  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('alt', file.name.replace(/\.[^.]+$/, ''));
    try {
      const d = await api.upload('/api/admin/media', fd);
      c().setImage({ src: mediaUrl(d.media.url_path), alt: d.media.alt || '' }).run();
      toast('Image WebP bana ke upload ho gayi ✓');
    } catch (e) {
      toast(`Upload fail: ${e.message}`);
    }
  };

  const insertTable = () => {
    c().insertTable({ rows: Number(tRows) || 3, cols: Number(tCols) || 3, withHeaderRow: tHead }).run();
    if (tStyle) editor.chain().focus().updateAttributes('table', { class: tStyle }).run();
    setPop(null);
  };

  const toggleSrc = () => {
    if (!src) {
      setHtml(editor.getHTML());
      setSrc(true);
    } else {
      editor.commands.setContent(html, true);
      setSrc(false);
    }
  };

  const words = editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0;

  const B = ({ act, on, label, title, wide }) => (
    <button
      className={`tbtn${on ? ' on' : ''}`}
      style={wide ? { minWidth: 0, padding: '0 10px', fontSize: 11.5, letterSpacing: 0.5 } : undefined}
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={act}
    >
      {label}
    </button>
  );

  return (
    <div ref={wrapRef} className={`edwrap${src ? ' src' : ''}${fs ? ' fs' : ''}`}>
      <div className="rtetools" role="toolbar" aria-label="Formatting">
        <span className="tgroup">
          <B act={() => c().undo().run()} label="↺" title="Undo" />
          <B act={() => c().redo().run()} label="↻" title="Redo" />
        </span>
        <span className="tdiv" />

        <select className="tsel" value={blockValue} onChange={(e) => setBlock(e.target.value)} title="Block type" aria-label="Block type">
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="quote">Pull quote</option>
        </select>
        <select
          className="tsel"
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={(e) => (e.target.value ? c().setFontFamily(e.target.value).run() : c().unsetFontFamily().run())}
          title="Font family"
          aria-label="Font family"
        >
          {FONTS.map((f) => (
            <option key={f.label} value={f.v}>{f.label}</option>
          ))}
        </select>
        <select
          className="tsel"
          style={{ maxWidth: 74 }}
          value={editor.getAttributes('textStyle').fontSize || ''}
          onChange={(e) => (e.target.value ? c().setFontSize(e.target.value).run() : c().unsetFontSize().run())}
          title="Font size"
          aria-label="Font size"
        >
          <option value="">Size</option>
          {SIZES.map((s) => (
            <option key={s} value={s}>{parseInt(s, 10)}</option>
          ))}
        </select>
        <span className="tdiv" />

        <span className="tgroup">
          <B act={() => c().toggleBold().run()} on={editor.isActive('bold')} label={<b>B</b>} title="Bold" />
          <B act={() => c().toggleItalic().run()} on={editor.isActive('italic')} label={<i>I</i>} title="Italic" />
          <B act={() => c().toggleUnderline().run()} on={editor.isActive('underline')} label={<u>U</u>} title="Underline" />
          <B act={() => c().toggleStrike().run()} on={editor.isActive('strike')} label={<s>S</s>} title="Strikethrough" />
        </span>

        {/* Text color */}
        <span className="tanchor">
          <button className="tbtn" type="button" title="Text color" onMouseDown={(e) => e.preventDefault()} onClick={() => setPop(pop === 'color' ? null : 'color')}>
            A<span className="cbar" style={{ background: editor.getAttributes('textStyle').color || 'var(--acc)' }} />
          </button>
          <div className={`tpop${pop === 'color' ? ' open' : ''}`}>
            <span className="prow">TEXT COLOR</span>
            <div className="swatches">
              {TEXT_COLORS.map((col) => (
                <button key={col} className="sw" style={{ background: col }} type="button" aria-label={col} onClick={() => { c().setColor(col).run(); setPop(null); }} />
              ))}
            </div>
            <span className="prow">
              CUSTOM <input type="color" defaultValue="#F2B01E" onChange={(e) => c().setColor(e.target.value).run()} />
              <button className="act" type="button" onClick={() => { c().unsetColor().run(); setPop(null); }}>Default</button>
            </span>
          </div>
        </span>

        {/* Highlight */}
        <span className="tanchor">
          <button className={`tbtn${editor.isActive('highlight') ? ' on' : ''}`} type="button" title="Highlight" onMouseDown={(e) => e.preventDefault()} onClick={() => setPop(pop === 'hl' ? null : 'hl')}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 13 L11 6 L14 9 L7 16 H4 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M3 18 H17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </button>
          <div className={`tpop${pop === 'hl' ? ' open' : ''}`}>
            <span className="prow">HIGHLIGHT</span>
            <div className="swatches">
              {HL_COLORS.map((col) => (
                <button key={col} className="sw" style={{ background: col }} type="button" aria-label={col} onClick={() => { c().setHighlight({ color: col }).run(); setPop(null); }} />
              ))}
              <button className="sw" style={{ background: 'transparent', fontSize: 12, fontWeight: 800 }} type="button" aria-label="No highlight" onClick={() => { c().unsetHighlight().run(); setPop(null); }}>✕</button>
            </div>
          </div>
        </span>
        <span className="tdiv" />

        <span className="tgroup">
          <B act={() => c().setTextAlign('left').run()} on={editor.isActive({ textAlign: 'left' })} label="⟸" title="Align left" />
          <B act={() => c().setTextAlign('center').run()} on={editor.isActive({ textAlign: 'center' })} label="⟺" title="Align center" />
          <B act={() => c().setTextAlign('right').run()} on={editor.isActive({ textAlign: 'right' })} label="⟹" title="Align right" />
        </span>
        <span className="tdiv" />

        <span className="tgroup">
          <B act={() => c().toggleBulletList().run()} on={editor.isActive('bulletList')} label="•≡" title="Bullet list" />
          <B act={() => c().toggleOrderedList().run()} on={editor.isActive('orderedList')} label="1≡" title="Numbered list" />
        </span>
        <span className="tdiv" />

        <B act={setLink} on={editor.isActive('link')} label="🔗" title="Insert link" />
        <B act={() => c().unsetLink().run()} label="⛓✕" title="Remove link" wide />
        <B act={() => fileRef.current && fileRef.current.click()} label="🖼" title="Upload image (auto-WebP)" />
        <B
          act={() => {
            const u = window.prompt('Image URL:');
            if (u) c().setImage({ src: u }).run();
          }}
          label="IMG↗"
          title="Image from URL"
          wide
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) uploadImage(e.target.files[0]);
            e.target.value = '';
          }}
        />

        {/* Table */}
        <span className="tanchor">
          <button className={`tbtn${editor.isActive('table') ? ' on' : ''}`} type="button" title="Table" onMouseDown={(e) => e.preventDefault()} onClick={() => setPop(pop === 'table' ? null : 'table')}>▦</button>
          <div className={`tpop${pop === 'table' ? ' open' : ''}`}>
            {!editor.isActive('table') ? (
              <>
                <span className="prow">INSERT TABLE</span>
                <span className="prow">
                  ROWS <input type="number" min="1" max="30" value={tRows} onChange={(e) => setTRows(e.target.value)} />
                  COLS <input type="number" min="1" max="8" value={tCols} onChange={(e) => setTCols(e.target.value)} />
                </span>
                <span className="prow">
                  STYLE
                  <select className="tsel" value={tStyle} onChange={(e) => setTStyle(e.target.value)}>
                    {TABLE_STYLES.map((t) => (
                      <option key={t.label} value={t.v}>{t.label}</option>
                    ))}
                  </select>
                </span>
                <label className="prow" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={tHead} onChange={(e) => setTHead(e.target.checked)} /> HEADER ROW
                </label>
                <button className="btn sm" type="button" onClick={insertTable}>Insert table</button>
              </>
            ) : (
              <>
                <span className="prow">TABLE TOOLS</span>
                <span className="prow">
                  STYLE
                  <select className="tsel" value={editor.getAttributes('table').class || ''} onChange={(e) => { editor.chain().focus().updateAttributes('table', { class: e.target.value || null }).run(); }}>
                    {TABLE_STYLES.map((t) => (
                      <option key={t.label} value={t.v}>{t.label}</option>
                    ))}
                  </select>
                </span>
                <span className="prow" style={{ gap: 6 }}>
                  <button className="act" type="button" onClick={() => c().addRowAfter().run()}>+Row</button>
                  <button className="act" type="button" onClick={() => c().addColumnAfter().run()}>+Col</button>
                  <button className="act" type="button" onClick={() => c().deleteRow().run()}>−Row</button>
                  <button className="act" type="button" onClick={() => c().deleteColumn().run()}>−Col</button>
                </span>
                <button className="act warn" type="button" onClick={() => { c().deleteTable().run(); setPop(null); }}>Delete table</button>
              </>
            )}
          </div>
        </span>

        <B act={() => c().setHorizontalRule().run()} label="—" title="Horizontal rule" />
        <B act={() => c().clearNodes().unsetAllMarks().run()} label="CLR" title="Clear formatting" wide />
        <span className="tdiv" />
        <B act={toggleSrc} on={src} label="&lt;/&gt;" title="HTML source" wide />
        <B act={() => setFs(!fs)} on={fs} label={fs ? '⤡' : '⤢'} title="Fullscreen" />
      </div>

      <div className="rte">
        <EditorContent editor={editor} />
      </div>
      <textarea className="rtesrc" value={html} onChange={(e) => setHtml(e.target.value)} spellCheck={false} aria-label="HTML source" />

      <div className="rtestatus">
        <span>{src ? 'HTML SOURCE MODE — &lt;/&gt; dubara dabao to render' : `${words} WORDS · ~${Math.max(1, Math.round(words / 200))} MIN READ`}</span>
        <span>AUTO-WEBP UPLOADS · TABLES · ਗੁਰਮੁਖੀ + देवनागरी READY</span>
      </div>
    </div>
  );
}
