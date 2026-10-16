import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState, type KeyboardEvent } from "react";
import { EASE_OUT } from "../lib/motion";
import { CloseIcon, PlusIcon } from "./Icons";

type Props = {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  max: number;
  /** Values that can't be added, e.g. the brand itself. Compared case-insensitively. */
  reserved?: string[];
  describedBy?: string;
};

export function ChipInput({ id, values, onChange, max, reserved = [], describedBy }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const full = values.length >= max;
  const errorId = `${id}-error`;

  const add = () => {
    const v = draft.trim().replace(/,$/, "").trim();
    if (!v) return;
    const lower = v.toLowerCase();
    if (values.some((x) => x.toLowerCase() === lower)) return setError(`${v} is already added.`);
    if (reserved.some((x) => x.trim().toLowerCase() === lower)) return setError("That's your own brand.");
    onChange([...values, v]);
    setDraft("");
    setError("");
  };

  const remove = (v: string) => {
    onChange(values.filter((x) => x !== v));
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex min-h-6 cursor-text flex-wrap items-center gap-1 rounded-xs border border-line-strong bg-surface px-1 py-1 transition-[border-color,box-shadow,transform] duration-150 focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 focus-within:border-ink focus-within:shadow-[4px_4px_0_0_var(--ink)] hover:border-ink"
      >
        <AnimatePresence initial={false}>
          {values.map((v) => (
            <motion.span
              key={v}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="inline-flex h-4 items-center gap-0.5 border border-ink pl-1 pr-0.5 text-sm font-medium text-ink"
            >
              {v}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(v);
                }}
                aria-label={`Remove ${v}`}
                className="grid size-3 place-items-center text-ink-2 transition-colors hover:bg-ink hover:text-bg"
              >
                <CloseIcon className="text-[14px]" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          ref={inputRef}
          id={id}
          value={draft}
          disabled={full}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={onKeyDown}
          onBlur={add}
          placeholder={full ? `That's the maximum of ${max}` : values.length ? "Add another" : "A rival brand, then press Enter"}
          aria-describedby={[describedBy, error ? errorId : ""].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          className="h-4 min-w-[140px] flex-1 bg-transparent px-1 text-base text-ink outline-none placeholder:text-ink-3 disabled:cursor-not-allowed"
        />
        {draft.trim() && !full && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={add}
            className="inline-flex h-4 items-center gap-0.5 px-1 text-sm font-medium text-ink underline underline-offset-4"
          >
            <PlusIcon /> Add
          </button>
        )}
      </div>
      <p id={errorId} aria-live="polite" className="mt-0.5 min-h-2.5 text-sm text-danger">
        {error}
      </p>
    </div>
  );
}
