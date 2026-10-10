// Small fetch wrapper for the admin UI: returns parsed JSON or throws an Error with a readable message.
export class AdminFetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function adminFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
    });
  } catch {
    throw new AdminFetchError("Network error. Check your connection and try again.", 0);
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401) {
    throw new AdminFetchError("Your session has expired. Please sign in again.", 401);
  }

  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data ? String((data as { message: unknown }).message) : "Something went wrong.";
    throw new AdminFetchError(message, response.status);
  }

  return data as T;
}
