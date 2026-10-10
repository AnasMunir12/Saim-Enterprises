import Link from "next/link";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link className={`wordmark ${className}`.trim()} href="/" aria-label="Saim Enterprises home page">
      saim <i>enterprises</i>
    </Link>
  );
}
