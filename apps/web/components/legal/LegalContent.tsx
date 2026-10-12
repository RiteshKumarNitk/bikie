/** ADR-090 — renders a legal document version's plain-text content. The format is deliberately
 * minimal (and identical on mobile): `# ` / `## ` lines are headings, blank lines separate
 * paragraphs, single newlines are kept. Everything is rendered as text, never HTML, so admin-entered
 * content can't inject markup. */
type Block = { kind: "h1" | "h2" | "p"; text: string };

export function parseLegalContent(content: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "p", text: paragraph.join("\n") });
    paragraph = [];
  };
  for (const raw of content.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flush();
      blocks.push({ kind: "h2", text: line.slice(3).trim() });
    } else if (line.startsWith("# ")) {
      flush();
      blocks.push({ kind: "h1", text: line.slice(2).trim() });
    } else if (line.trim() === "") {
      flush();
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

export function LegalContent({ content }: { content: string }) {
  const blocks = parseLegalContent(content);
  if (blocks.length === 0) return <p className="text-sm text-foreground/40">No content.</p>;
  return (
    <div className="space-y-4 text-foreground/70">
      {blocks.map((block, i) =>
        block.kind === "h1" ? (
          <h2 key={i} className="pt-4 text-xl font-semibold text-foreground md:text-2xl">
            {block.text}
          </h2>
        ) : block.kind === "h2" ? (
          <h3 key={i} className="pt-2 text-lg font-semibold text-foreground">
            {block.text}
          </h3>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {block.text}
          </p>
        ),
      )}
    </div>
  );
}
