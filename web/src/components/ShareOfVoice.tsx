import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Query, Report } from "@mentioned/shared";
import { Reveal } from "./Section";

type Props = { data: Report["shareOfVoice"]; totalAnswers: number; discovery: Query[] };

/** How many discovery answers from each model named this brand. */
function byModel(name: string, isBrand: boolean, discovery: Query[]) {
  const counts = new Map<string, number>();
  for (const q of discovery)
    for (const r of q.results) {
      const hit = isBrand ? r.mentioned : r.competitors.includes(name);
      counts.set(r.model, (counts.get(r.model) ?? 0) + (hit ? 1 : 0));
    }
  return [...counts];
}

const ROW = 48;

export function shareOfVoiceSummary(data: Report["shareOfVoice"], totalAnswers: number) {
  const sorted = [...data].sort((a, b) => b.mentions - a.mentions);
  const brand = sorted.find((d) => d.isBrand);
  const leader = sorted[0];
  if (!brand || !leader) return "";
  if (brand.mentions === 0)
    return `${leader.name} was named in ${leader.mentions} of ${totalAnswers} answers. You weren't named in any.`;
  if (leader.isBrand) return `You lead: named in ${brand.mentions} of ${totalAnswers} answers.`;
  const rank = sorted.indexOf(brand) + 1;
  return `You were named in ${brand.mentions} of ${totalAnswers} answers, ${rank === 2 ? "second" : `number ${rank}`} behind ${leader.name} (${leader.mentions}).`;
}

/** Brand vs competitors by number of mentions in discovery answers. Brand in accent, rivals in grey. */
export function ShareOfVoice({ data, totalAnswers, discovery }: Props) {
  const sorted = [...data].sort((a, b) => b.mentions - a.mentions || Number(b.isBrand) - Number(a.isBrand));
  const max = Math.max(1, ...sorted.map((d) => d.mentions));
  const ref = useRef<HTMLDivElement>(null);
  // Narrow screens: a slimmer name column and no rank numbers, so the bars get the room.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < 520));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const labelWidth = narrow ? 132 : 176;
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const reduce = useReducedMotion();
  const height = sorted.length * ROW + 8;

  return (
    <Reveal>
      <div ref={ref} style={{ height }} aria-hidden="true" className="cursor-crosshair">
        {inView && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 0 }} barCategoryGap={16} accessibilityLayer={false}>
              <XAxis type="number" hide domain={[0, max]} />
              <YAxis
                type="category"
                dataKey="name"
                width={labelWidth}
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={(props: { x: number | string; y: number | string; payload: { value: string; index: number } }) => {
                  const item = sorted[props.payload.index];
                  return (
                    <g transform={`translate(0,${props.y})`}>
                      {!narrow && (
                        <text x={0} dy={5} className="sov-label">
                          {String(props.payload.index + 1).padStart(2, "0")}
                        </text>
                      )}
                      <text
                        x={narrow ? 0 : 28}
                        dy={5}
                        className={item?.isBrand ? "sov-tick-brand" : "sov-tick"}
                        style={narrow ? { fontSize: 13 } : undefined}
                      >
                        {props.payload.value}
                        {item?.isBrand ? " (you)" : ""}
                      </text>
                    </g>
                  );
                }}
              />
              <Tooltip
                cursor={{ className: "sov-cursor" }}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  const d = active ? (payload?.[0]?.payload as Report["shareOfVoice"][number] | undefined) : undefined;
                  if (!d) return null;
                  return (
                    <div className="panel min-w-[200px] p-1.5 text-sm">
                      <p className="font-semibold text-ink">
                        {d.name}
                        {d.isBrand ? " (you)" : ""}
                      </p>
                      <p className="text-ink-2">
                        Named in {d.mentions} of {totalAnswers} answers
                      </p>
                      <ul className="mt-1 border-t border-line pt-1">
                        {byModel(d.name, d.isBrand, discovery).map(([model, n]) => (
                          <li key={model} className="flex justify-between gap-2 text-ink-2">
                            <span>{model}</span>
                            <span className="tabular font-medium text-ink">{n}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="mentions"
                radius={0}
                minPointSize={2}
                isAnimationActive={!reduce}
                animationDuration={1100}
                animationEasing="ease-out"
              >
                {sorted.map((d) => (
                  <Cell key={d.name} className={d.isBrand ? "sov-bar-brand" : "sov-bar-rival"} />
                ))}
                <LabelList dataKey="mentions" position="right" offset={12} className="sov-label" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <table className="sr-only">
        <caption>Mentions in discovery answers, out of {totalAnswers}</caption>
        <thead>
          <tr>
            <th scope="col">Brand</th>
            <th scope="col">Mentions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <tr key={d.name}>
              <th scope="row">{d.isBrand ? `${d.name} (you)` : d.name}</th>
              <td>{d.mentions}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1">
          <span className="bar-brand h-1 w-2" aria-hidden="true" /> Your brand
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1 w-2 bg-rival" aria-hidden="true" /> Competitors
        </span>
        <span>Counted across {totalAnswers} discovery answers. Hover or tap a bar for the split by model.</span>
      </p>
    </Reveal>
  );
}
