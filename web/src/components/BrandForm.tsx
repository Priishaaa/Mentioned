import { AnimatePresence, motion } from "framer-motion";
import { useState, type FormEvent, type ReactNode } from "react";
import { EASE_OUT } from "../lib/motion";
import type { ReportInput } from "@mentioned/shared";
import { Button } from "./Button";
import { AlertIcon, ArrowRightIcon, ChevronDownIcon } from "./Icons";
import { ChipInput } from "./ChipInput";

const COUNTRIES = ["India", "United States", "United Kingdom", "United Arab Emirates", "Singapore", "Australia", "Canada"];
const MAX_COMPETITORS = 3;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;

type Field = "brand" | "website" | "category";

function validate(input: ReportInput): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (!input.brand.trim()) errors.brand = "Enter your brand name.";
  if (!input.category.trim()) errors.category = "Add a category, like “skincare” or “running shoes”.";
  if (input.website.trim() && !URL_RE.test(input.website.trim())) errors.website = "That doesn't look like a web address.";
  return errors;
}

const inputClass =
  "h-6 w-full rounded-xs border bg-surface px-1.5 text-base text-ink transition-colors placeholder:text-ink-3 " +
  "transition-[border-color,box-shadow,transform] duration-150 hover:border-ink focus:-translate-x-0.5 focus:-translate-y-0.5 focus:border-ink " +
  "focus:shadow-[4px_4px_0_0_var(--ink)] focus:outline-none";

function FieldShell({
  id,
  label,
  optional,
  hint,
  error,
  children,
  className = "",
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-0.5 flex items-baseline justify-between gap-1">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {optional && <span className="text-xs text-ink-3">Optional</span>}
      </div>
      {children}
      <div className="min-h-3 pt-0.5 text-sm">
        <AnimatePresence mode="wait" initial={false}>
          {error ? (
            <motion.p
              key="error"
              id={`${id}-error`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="flex items-center gap-0.5 text-danger"
            >
              <AlertIcon className="shrink-0" /> {error}
            </motion.p>
          ) : hint ? (
            <motion.p key="hint" id={`${id}-hint`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-ink-3">
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function BrandForm({ onSubmit, initial }: { onSubmit: (input: ReportInput) => void; initial?: ReportInput }) {
  const [input, setInput] = useState<ReportInput>(
    initial ?? { brand: "", website: "", category: "", country: "India", competitors: [] },
  );
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const errors = validate(input);
  const canSubmit = Object.keys(errors).length === 0;

  const set = <K extends keyof ReportInput>(key: K, value: ReportInput[K]) => setInput((p) => ({ ...p, [key]: value }));
  const blur = (f: Field) => () => setTouched((t) => ({ ...t, [f]: true }));
  const shown = (f: Field) => (touched[f] ? errors[f] : undefined);
  const describe = (f: Field, hasHint = false) => (shown(f) ? `${f}-error` : hasHint ? `${f}-hint` : undefined);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setTouched({ brand: true, website: true, category: true });
      return;
    }
    onSubmit({
      ...input,
      brand: input.brand.trim(),
      website: input.website.trim(),
      category: input.category.trim(),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="border-t-2 border-rule pt-2">
      <div className="grid gap-x-2 gap-y-1.5 sm:grid-cols-2">
        <FieldShell id="brand" label="Brand name" error={shown("brand")}>
          <input
            id="brand"
            value={input.brand}
            onChange={(e) => set("brand", e.target.value)}
            onBlur={blur("brand")}
            placeholder="e.g. Lumen & Leaf"
            autoComplete="organization"
            required
            aria-invalid={shown("brand") ? true : undefined}
            aria-describedby={describe("brand")}
            className={`${inputClass} ${shown("brand") ? "border-danger" : "border-line-strong"}`}
          />
        </FieldShell>

        <FieldShell id="website" label="Website" optional hint="Helps us tell you apart from brands with similar names." error={shown("website")}>
          <input
            id="website"
            type="url"
            inputMode="url"
            value={input.website}
            onChange={(e) => set("website", e.target.value)}
            onBlur={blur("website")}
            placeholder="e.g. lumenandleaf.in"
            autoComplete="url"
            aria-invalid={shown("website") ? true : undefined}
            aria-describedby={describe("website", true)}
            className={`${inputClass} ${shown("website") ? "border-danger" : "border-line-strong"}`}
          />
        </FieldShell>

        <FieldShell id="category" label="Category" hint="What a shopper would search for." error={shown("category")}>
          <input
            id="category"
            value={input.category}
            onChange={(e) => set("category", e.target.value)}
            onBlur={blur("category")}
            placeholder="e.g. skincare, running shoes"
            required
            aria-invalid={shown("category") ? true : undefined}
            aria-describedby={describe("category", true)}
            className={`${inputClass} ${shown("category") ? "border-danger" : "border-line-strong"}`}
          />
        </FieldShell>

        <FieldShell id="country" label="Country" hint="Where your shoppers are.">
          <div className="relative">
            <select
              id="country"
              value={input.country}
              onChange={(e) => set("country", e.target.value)}
              aria-describedby="country-hint"
              className={`${inputClass} cursor-pointer appearance-none border-line-strong pr-5`}
            >
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[18px] text-ink-3" />
          </div>
        </FieldShell>

        <div className="sm:col-span-2">
          <div className="mb-0.5 flex items-baseline justify-between gap-1">
            <label htmlFor="competitors" className="text-sm font-semibold text-ink">
              Competitors
            </label>
            <span className="text-xs text-ink-3">
              Optional · <span className="tabular">{input.competitors.length}</span>/{MAX_COMPETITORS}
            </span>
          </div>
          <ChipInput
            id="competitors"
            values={input.competitors}
            onChange={(v) => set("competitors", v)}
            max={MAX_COMPETITORS}
            reserved={[input.brand]}
            describedBy="competitors-hint"
          />
          <p id="competitors-hint" className="sr-only">
            Press Enter or comma to add a competitor. Up to {MAX_COMPETITORS}.
          </p>
        </div>
      </div>

      <div className="mt-1 flex flex-col-reverse gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <p id="submit-hint" className="text-sm text-ink-3">
          {canSubmit ? "Takes about a minute." : "Add your brand name and category to continue."}
        </p>
        <Button type="submit" disabled={!canSubmit} aria-describedby="submit-hint" className="group h-6 px-3 text-base">
          Check my brand
          <ArrowRightIcon className="transition-transform duration-300 group-enabled:group-hover:translate-x-0.5" />
        </Button>
      </div>
    </form>
  );
}
