import { Fragment } from "react";
import { parseMarkup, splitEmphasis } from "@/lib/text-markup";

// Renders owner-written page text (see lib/text-markup.ts) as React elements. The text is never treated as HTML.
export function RichText({ source }: { source: string }) {
  return (
    <div className="policy__body">
      {parseMarkup(source).map((block, index) => {
        if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
        if (block.type === "list") return <ul key={index}>{block.items.map((item, position) => <li key={position}>{item}</li>)}</ul>;
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}

/** A title where a new line starts a new line and `*words*` are shown in italics. */
export function RichTitle({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {splitEmphasis(line).map((run, runIndex) => (run.emphasis ? <em key={runIndex}>{run.text}</em> : <Fragment key={runIndex}>{run.text}</Fragment>))}
        </Fragment>
      ))}
    </>
  );
}
