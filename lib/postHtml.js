/* Post HTML clean-up — removes text/background colours so post text always follows the site theme.
   Pasted text (Google Docs, Word, web pages) and the old editor colour picker left inline colours
   like style="color: rgb(0,0,0)" that stay black in dark mode. Fonts, sizes and alignment are kept. */

/* Inline style declarations that set a colour */
const COLOR_DECL = /(^|;)\s*(?:color|background|background-color|-webkit-text-fill-color)\s*:[^;]*/gi;

function cleanStyle(style) {
  return style
    .replace(/&(#?\w+);/g, '\u0000$1\u0001') /* protect entities like &quot; — their ';' is not a separator */
    .replace(COLOR_DECL, '$1')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('; ')
    .replace(/\u0000(#?\w+)\u0001/g, '&$1;');
}

/* True when `offset` sits inside a tag (<...>), not in the text between tags */
function inTag(str, offset) {
  const before = str.slice(0, offset);
  return before.lastIndexOf('<') > before.lastIndexOf('>');
}

export function stripInlineColors(html) {
  if (!html || typeof html !== 'string') return html || '';
  return (
    html
      /* style="..." / style='...' → drop colour declarations; drop the attribute if nothing is left */
      .replace(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, (m, q, dq, sq, offset, str) => {
        if (!inTag(str, offset)) return m;
        const cleaned = cleanStyle(dq !== undefined ? dq : sq);
        return cleaned ? ` style=${q[0]}${cleaned}${q[0]}` : '';
      })
      /* <font color>, bgcolor, tiptap highlight data-color */
      .replace(/\s(?:color|bgcolor|data-color)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (m, v, offset, str) =>
        inTag(str, offset) ? '' : m
      )
  );
}
