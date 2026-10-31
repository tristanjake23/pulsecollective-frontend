const BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
export const API_BASE = BASE;
let session = null,
  refreshing = null;
export function setApiSession(value) {
  session = value;
}
export function getApiSession() {
  return session;
}
async function parse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail
          .map((e) => `${e.loc?.slice(1).join(".")}: ${e.msg}`)
          .join("; ")
      : data.detail;
    throw new Error(detail || `API request failed (${response.status})`);
  }
  return data;
}
export async function api(
  path,
  {
    method = "GET",
    body,
    publicRequest = false,
    retry = true,
    file = null,
  } = {},
) {
  const headers = {
    "Content-Type": file
      ? file.type || "application/octet-stream"
      : "application/json",
  };
  if (session?.access_token && !publicRequest)
    headers.Authorization = `Bearer ${session.access_token}`;
  let response;
  try {
    response = await fetch(BASE + path, {
      method,
      headers,
      body: file || (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch {
    throw new Error(
      "The clinic service could not be reached. Please try again or contact the clinic.",
    );
  }
  if (
    response.status === 401 &&
    session?.refresh_token &&
    !publicRequest &&
    retry
  ) {
    if (!refreshing)
      refreshing = fetch(BASE + "/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      })
        .then(parse)
        .then((data) => {
          session = data;
          window.dispatchEvent(
            new CustomEvent("pulse-session-updated", { detail: data }),
          );
          return data;
        })
        .catch((error) => {
          session = null;
          window.dispatchEvent(new Event("pulse-session-expired"));
          throw error;
        })
        .finally(() => {
          refreshing = null;
        });
    await refreshing;
    return api(path, { method, body, publicRequest, retry: false, file });
  }
  return parse(response);
}
export async function login(credentials) {
  const value = await api("/auth/login", {
    method: "POST",
    body: credentials,
    publicRequest: true,
  });
  if (
    !["doctor", "clinic_admin", "staff", "patient"].includes(value.profile.role)
  )
    throw new Error("Your account needs an approved role.");
  setApiSession(value);
  return value;
}
export async function logout() {
  try {
    if (session) await api("/auth/logout", { method: "POST" });
  } finally {
    session = null;
  }
}

export async function signup(details) {
  const result = await api("/auth/signup", {
    method: "POST",
    body: details,
    publicRequest: true,
  });
  if (result.access_token) {
    if (result.profile?.role !== "patient")
      throw new Error("Patient registration is unavailable.");
    setApiSession(result);
  }
  return result;
}
