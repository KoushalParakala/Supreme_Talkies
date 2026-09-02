type IconProps = { size?: number };

function Svg({ size = 16, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function IconArrowUpRight({ size = 14 }: IconProps) {
  return <Svg size={size}><path d="M7 17L17 7" /><path d="M7 7h10v10" /></Svg>;
}
export function IconArrowDown({ size = 15 }: IconProps) {
  return <Svg size={size}><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></Svg>;
}
export function IconMoveRight({ size = 15 }: IconProps) {
  return <Svg size={size}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></Svg>;
}
export function IconChevronLeft({ size = 18 }: IconProps) {
  return <Svg size={size}><path d="M15 18l-6-6 6-6" /></Svg>;
}
export function IconChevronRight({ size = 18 }: IconProps) {
  return <Svg size={size}><path d="M9 18l6-6-6-6" /></Svg>;
}
export function IconCheck({ size = 13 }: IconProps) {
  return <Svg size={size}><path d="M20 6L9 17l-5-5" /></Svg>;
}
export function IconPlus({ size = 18 }: IconProps) {
  return <Svg size={size}><path d="M12 5v14" /><path d="M5 12h14" /></Svg>;
}
export function IconX({ size = 18 }: IconProps) {
  return <Svg size={size}><path d="M18 6L6 18" /><path d="M6 6l12 12" /></Svg>;
}
export function IconMoon({ size = 16 }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 21 14.3z" />
    </Svg>
  );
}
export function IconSun({ size = 16 }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.6M12 19.4V21M4.9 4.9l1.1 1.1M18 18l1.1 1.1M3 12h1.6M19.4 12H21M4.9 19.1l1.1-1.1M18 6l1.1-1.1" />
    </Svg>
  );
}
export function IconBell({ size = 16 }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </Svg>
  );
}
export function IconPlay({ size = 16 }: IconProps) {
  return <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M10 8l6 4-6 4z" /></Svg>;
}
export function IconCamera({ size = 24 }: IconProps) {
  return <Svg size={size}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Svg>;
}
export function IconClapper({ size = 24 }: IconProps) {
  return <Svg size={size}><path d="M4 8h16v12H4z" /><path d="M4 8l4-4 4 4 4-4 4 4" /></Svg>;
}
export function IconLight({ size = 24 }: IconProps) {
  return <Svg size={size}><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 1 4 10c0 2-1 3-2 4H10c-1-1-2-2-2-4a6 6 0 0 1 4-10z" /></Svg>;
}
export function IconSeat({ size = 24 }: IconProps) {
  return <Svg size={size}><path d="M6 11V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4" /><path d="M4 14h16v6H4z" /><path d="M4 14V11" /><path d="M20 14V11" /></Svg>;
}
export function IconLens({ size = 24 }: IconProps) {
  return <Svg size={size}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v2" /><path d="M12 19v2" /></Svg>;
}
export function IconReply({ size = 15 }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </Svg>
  );
}
export function IconTrash({ size = 15 }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Svg>
  );
}
export function IconSmile({ size = 16 }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 9.5h.01" />
      <path d="M16 9.5h.01" />
      <path d="M8.5 14.5s1.5 2 3.5 2 3.5-2 3.5-2" />
    </Svg>
  );
}
export function IconPencil({ size = 15 }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M4 20h4l10.5-10.5-4-4L4 16z" />
      <path d="M13 6.5l4 4" />
    </Svg>
  );
}
