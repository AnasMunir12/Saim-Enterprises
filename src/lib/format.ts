export function formatPKR(value: number | undefined | null) {
  return `PKR ${Number(value ?? 0).toLocaleString("en-PK")}`;
}

export function formatDate(value: string | Date | undefined | null, withTime = false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", withTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" });
}

export function shortId(id: string) {
  return id.length > 10 ? `#${id.slice(-8).toUpperCase()}` : `#${id.toUpperCase()}`;
}
