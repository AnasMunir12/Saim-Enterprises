// Client-safe. The tiny markup the owner can type in a page body or title. It is only ever turned into React
// elements (see components/layout/RichText.tsx), never into HTML, so admin text cannot inject markup.
//
//   blank line          starts a new paragraph
//   ## Heading          a heading
//   - Item              a bullet list (consecutive lines)
//   *word*              italic emphasis, in titles only

export type MarkupBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export const MARKUP_HELP = 'Leave a blank line between paragraphs. Start a line with "## " for a heading and with "- " for a bullet point.';

export function parseMarkup(source: string): MarkupBlock[] {
  const blocks: MarkupBlock[] = [];
  let paragraph: string[] = [];
  let items: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    if (items.length) blocks.push({ type: "list", items });
    paragraph = [];
    items = [];
  };

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("## ")) {
      flush();
      const text = line.slice(3).trim();
      if (text) blocks.push({ type: "heading", text });
    } else if (line.startsWith("- ")) {
      if (paragraph.length) flush();
      const text = line.slice(2).trim();
      if (text) items.push(text);
    } else if (line) {
      if (items.length) flush();
      paragraph.push(line);
    } else {
      flush();
    }
  }
  flush();
  return blocks;
}

const EMPHASIS = /\*([^*\n]+)\*/g;

/** Splits a title into plain and `*emphasised*` runs. */
export function splitEmphasis(text: string): Array<{ text: string; emphasis: boolean }> {
  const runs: Array<{ text: string; emphasis: boolean }> = [];
  let last = 0;
  for (const match of text.matchAll(EMPHASIS)) {
    if (match.index > last) runs.push({ text: text.slice(last, match.index), emphasis: false });
    runs.push({ text: match[1], emphasis: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), emphasis: false });
  return runs;
}

/** The title as plain text for browser tabs and search results: asterisks dropped, line breaks become spaces. */
export function plainTitle(text: string) {
  return text.replace(EMPHASIS, "$1").replace(/\s*\n\s*/g, " ").trim();
}
