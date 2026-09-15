export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<hr\s*\/?\s*>/gi, '\n❦ ❦ ❦\n')
    .replace(/<div[^>]*class=["'][^"']*poetry-divider[^"']*["'][^>]*>.*?<\/div>/gis, '\n❦ ❦ ❦\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/blockquote>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function plainTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const blocks = escaped.split(/\n\s*❦\s*❦\s*❦\s*\n/g);
  return `<div dir="rtl" class="poetry-container text-center">${blocks
    .map((block, i) => `${i ? '<div class="poetry-divider">❦ ❦ ❦</div>' : ''}<p>${block.replace(/\n/g, '<br />')}</p>`)
    .join('')}</div>`;
}

export function normalizeForSearch(value: string): string {
  return htmlToPlainText(value)
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .toLowerCase()
    .trim();
}

export function wrapSelection(source: string, start: number, end: number, open: string, close: string) {
  const selected = source.slice(start, end);
  return {
    text: `${source.slice(0, start)}${open}${selected}${close}${source.slice(end)}`,
    selection: { start: start + open.length, end: end + open.length }
  };
}
