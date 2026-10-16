import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Icon({ title, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      width="1em"
      height="1em"
      {...props}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

/*
 * Status marks. Square, like a ticked box on a printed form. "Mentioned" is the
 * highlighter colour with an ink edge; each mark is always paired with a text label.
 */
export const MentionedIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" fill="var(--accent)" stroke="var(--ink)" strokeWidth={1.5} />
    <path d="M7.5 12.5l3 3 6-6.5" stroke="var(--accent-ink)" strokeWidth={2} />
  </Icon>
);

export const MissingIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" stroke="var(--line-strong)" strokeWidth={1.5} />
  </Icon>
);

export const PartialIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 3.5h8.5v17H3.5z" fill="var(--accent)" stroke="none" />
    <rect x="3.5" y="3.5" width="17" height="17" stroke="var(--ink)" strokeWidth={1.5} />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const LinkIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
  </Icon>
);

export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
  </Icon>
);

export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16m0 4v-4h-4" />
  </Icon>
);

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
  </Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </Icon>
);

export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5h.01" />
  </Icon>
);

export const SearchOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20 20l-4.8-4.8M8 8.5l5 4M13 8.5l-5 4" />
  </Icon>
);

export const SentimentIcon = ({ sentiment, ...p }: IconProps & { sentiment: "positive" | "neutral" | "negative" }) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9.5h.01M15 9.5h.01" strokeWidth={2.5} />
    {sentiment === "positive" && <path d="M8 14c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4" />}
    {sentiment === "neutral" && <path d="M8.5 15h7" />}
    {sentiment === "negative" && <path d="M8 16.4c1-1.6 2.4-2.4 4-2.4s3 .8 4 2.4" />}
  </Icon>
);
