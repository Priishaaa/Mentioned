import type { ReactNode } from "react";
import { Mark } from "../components/Mark";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Marks the brand and competitor names in an excerpt.
 * The brand gets a highlighter stroke that draws itself in; competitors get a grey underline.
 */
export function highlightNames(text: string, brand: string, competitors: string[]): ReactNode[] {
  const names = [brand, ...competitors].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!names.length) return [text];
  const re = new RegExp(`(?<![\\w])(${names.map(escape).join("|")})(?![\\w])`, "gi");
  const brandLower = brand.toLowerCase();

  return text.split(re).map((part, i) => {
    // split() with one capture group puts matches at odd indexes.
    if (i % 2 === 0) return part;
    return part.toLowerCase() === brandLower ? (
      <Mark key={i}>{part}</Mark>
    ) : (
      <mark key={i} className="hl-rival">
        {part}
      </mark>
    );
  });
}
