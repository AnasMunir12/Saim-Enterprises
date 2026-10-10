// Client-safe: no database imports here, so the admin UI can use these too.
export const MESSAGE_STATUSES = ["new", "read", "replied", "archived"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

export const MESSAGE_STATUS_TONES = { new: "amber", read: "stone", replied: "green", archived: "violet" } as const;

export function isMessageStatus(value: unknown): value is MessageStatus {
  return typeof value === "string" && (MESSAGE_STATUSES as readonly string[]).includes(value);
}

/** Removes control characters. Single-line fields lose newlines and tabs too (they become single spaces). */
export function cleanText(value: string, multiline = false) {
  if (multiline) {
    return value
      .replace(/\r\n?/g, "\n")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .trim();
  }
  return value.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/ {2,}/g, " ").trim();
}

/** Window event fired by the inbox so the sidebar badge refreshes straight away. */
export const MESSAGES_CHANGED = "admin:messages-changed";
