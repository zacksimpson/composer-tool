export function stripMarkdown(text: string): string {
  return (
    text
      // Remove headings
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold+italic (***text***)
      .replace(/\*{3}(.*?)\*{3}/g, "$1")
      // Remove bold (**text** or __text__)
      .replace(/(\*{2}|_{2})(.*?)\1/g, "$2")
      // Remove italic (*text* or _text_)
      .replace(/([*_])(.*?)\1/g, "$2")
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Remove blockquotes
      .replace(/^>\s+/gm, "")
      // Remove unordered list markers
      .replace(/^[-*+]\s+/gm, "")
      // Remove ordered list markers
      .replace(/^\d+\.\s+/gm, "")
      .trim()
  );
}

const LEADING_HEADING_RE = /^#{1,6}\s*/;
const INLINE_MARKER_RE = /\*{1,3}|_{1,3}/g;

export function getDisplayTitle(title: string | null, body: string): string {
  if (title) {
    return title;
  }
  for (const line of body.split("\n")) {
    const cleaned = line
      .replace(/<[^>]+>/g, "") // strip HTML tags like <br />
      .replace(LEADING_HEADING_RE, "")
      .replace(INLINE_MARKER_RE, "")
      .trim();
    if (cleaned) {
      return cleaned;
    }
  }
  return "Untitled";
}
