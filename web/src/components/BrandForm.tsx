import { AnimatePresence, motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { MAX_COMPETITORS, type ReportInput } from "@mentioned/shared";
import { EASE_OUT } from "../lib/motion";
import { ArrowRightIcon, ChevronDownIcon } from "./Icons";
import { ChipInput } from "./ChipInput";

const COUNTRIES = ["India", "United States", "United Kingdom", "United Arab Emirates", "Singapore", "Australia", "Canada"];
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;

const field =
  "h-6 w-full border border-line-strong bg-surface px-1.5 text-base text-ink placeholder:text-ink-3 " +
  "transition-[border-color,box-shadow] duration-150 hover:border-ink focus:border-ink focus:shadow-[3px_3px_0_0_var(--ink)] focus:outline-none";

/**
 * The one thing the landing page asks for. Brand and category are enough to run
 * a check; website, country and competitors are optional and tucked away.
 */
export function BrandForm({ onSubmit, initial }: { onSubmit: (input: ReportInput) => void; initial?: ReportInput }) {
  const [input, setInput] = useState<ReportInput>(initial ?? { brand: "", website: "", category: "", country: "India", competitors: [] });
  const [more, setMore] = useState(Boolean(initial?.website || initial?.competitors.length));
  const [tried, setTried] = useState(false);

  const set = <K extends keyof ReportInput>(key: K, value: ReportInput[K]) => setInput((p) => ({ ...p, [key]: value }));
  const websiteBad = Boolean(input.website.trim()) && !URL_RE.test(input.website.trim());
  const missing = !input.brand.trim() ? "brand" : !input.category.trim() ? "category" : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (missing || websiteBad) {
      document.getElementById(missing ?? "website")?.focus();
      if (websiteBad) setMore(true);
      return;
    }
    onSubmit({ ...input, brand: input.brand.trim(), website: input.website.trim(), category: input.category.trim() });
  };

  return (
    <form onSubmit={submit} noValidate aria-describedby="form-status">
      <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="grid gap-0.5">
          <span className="text-xs font-medium text-ink-2">Brand</span>
          <input
            id="brand"
            value={input.brand}
            onChange={(e) => set("brand", e.target.value)}
            placeholder="e.g. Lumen & Leaf"
            autoComplete="organization"
            required
            aria-invalid={tried && missing === "brand" ? true : undefined}
            className={field}
          />
        </label>
        <label className="grid gap-0.5">
          <span className="text-xs font-medium text-ink-2">Category</span>
          <input
            id="category"
            value={input.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="e.g. skincare"
            required
            aria-invalid={tried && missing === "category" ? true : undefined}
            className={field}
          />
        </label>
        <button
          type="submit"
          className="lift group mt-1 inline-flex h-6 items-center justify-center gap-1 self-end border border-ink bg-ink px-3 text-base font-medium text-bg [--lift-shadow:var(--accent)] sm:mt-0"
        >
          Check
          <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1">
        <button
          type="button"
          aria-expanded={more}
          aria-controls="more-details"
          onClick={() => setMore((m) => !m)}
          className="inline-flex items-center gap-0.5 text-sm text-ink-2 hover:text-ink"
        >
          <ChevronDownIcon className={`text-[16px] transition-transform duration-200 ${more ? "rotate-180" : ""}`} />
          {more ? "Fewer details" : "Add website, country or competitors"}
        </button>
        <p id="form-status" aria-live="polite" className="text-sm text-danger">
          {tried && missing === "brand" && "Enter your brand name."}
          {tried && missing === "category" && "Add what you sell, e.g. “skincare”."}
          {tried && !missing && websiteBad && "That website doesn't look right."}
        </p>
      </div>

      <AnimatePresence initial={false}>
        {more && (
          <motion.div
            id="more-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="grid gap-1 pt-2 sm:grid-cols-2">
              <label className="grid gap-0.5">
                <span className="text-xs font-medium text-ink-2">Website</span>
                <input
                  id="website"
                  type="url"
                  inputMode="url"
                  value={input.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="lumenandleaf.in"
                  autoComplete="url"
                  aria-invalid={websiteBad ? true : undefined}
                  className={field}
                />
              </label>
              <label className="grid gap-0.5">
                <span className="text-xs font-medium text-ink-2">Country</span>
                <span className="relative">
                  <select
                    id="country"
                    value={input.country}
                    onChange={(e) => set("country", e.target.value)}
                    className={`${field} cursor-pointer appearance-none pr-4`}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[16px] text-ink-3" />
                </span>
              </label>
              <div className="grid gap-0.5 sm:col-span-2">
                <label htmlFor="competitors" className="text-xs font-medium text-ink-2">
                  Competitors <span className="text-ink-3">· up to {MAX_COMPETITORS}</span>
                </label>
                <ChipInput
                  id="competitors"
                  values={input.competitors}
                  onChange={(v) => set("competitors", v)}
                  max={MAX_COMPETITORS}
                  reserved={[input.brand]}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
