import { QUERY_TYPE_LABEL } from "../lib/format";
import type { QueryType } from "@mentioned/shared";

/** Question type as a plain label. Discovery is set in ink because it's the one that counts most. */
export function TypeBadge({ type }: { type: QueryType }) {
  return (
    <span className={`shrink-0 text-xs font-medium ${type === "discovery" ? "text-ink" : "text-ink-3"}`}>
      {QUERY_TYPE_LABEL[type]}
    </span>
  );
}
