// Shimmering placeholder block. Size it with a className or inline style at the call site.
export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function SkeletonLine({ wide }: { wide?: boolean }) {
  return <div className={`skeleton skeleton--line${wide ? " wide" : ""}`} aria-hidden="true" />;
}
