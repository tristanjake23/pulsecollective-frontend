const BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
export const API_BASE = BASE;

// Shared by tabs/windows on this website and browser profile.
const STORAGE_KEY = `pulse-auth-v1:${BASE}`;
const ROLES = ["doctor", "clinic_admin", "staff", "patient"];

let session = null;
let verifiedRaw = null;
let restoring = null;
let state = { status: "loading", session: null, error: "" };

const listeners = new Set();

function rawSession() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    throw new Error("Allow this site's browser storage to keep your sign-in.");
  }
}

function storedSession(raw = rawSession()) {
  try {
    const value = JSON.parse(raw);

    return value?.version === 1 &&
      typeof value.id === "string" &&
      typeof value.access_token === "string" &&
      value.access_token &&
      typeof value.refresh_token === "string" &&
      value.refresh_token
      ? value
      : null;
  } catch {
    return null;
  }
}

function publish(status, value = null, error = "") {
  session = value;
  state = { status, session: value, error };

  for (const listener of listeners) {
    listener(state);
  }

  if (status === "ready") {
    window.dispatchEvent(
      new CustomEvent("pulse-session-updated", {
        detail: value,
      }),
    );
  }
}

export function subscribeAuth(listener) {
  listeners.add(listener);
  listener(state);

  return () => listeners.delete(listener);
}

export function getApiSession() {
  return session;
}

function changedSession() {
  const error = new Error(
    "Your sign-in changed in another tab. Please try again.",
  );

  error.code = "SESSION_CHANGED";
  return error;
}

function checkProfile(profile) {
  if (!profile?.id || !ROLES.includes(profile.role)) {
    throw new Error("Your account needs an approved role.");
  }

  return profile;
}

export function setApiSession(value) {
  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY);
    verifiedRaw = null;
    publish("ready");
    return;
  }

  checkProfile(value.profile);

  if (!value.access_token || !value.refresh_token) {
    throw new Error(
      "The service returned an incomplete session. Please sign in again.",
    );
  }

  const raw = JSON.stringify({
    version: 1,
    id: window.crypto.randomUUID(),
    access_token: value.access_token,
    refresh_token: value.refresh_token,
  });

  // Store tokens only. Get the role/profile again from the backend.
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    throw new Error("Allow this site's browser storage to keep your sign-in.");
  }

  verifiedRaw = raw;
  publish("ready", value);
}

async function parse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail
          .map((error) => {
            const field = error.loc?.slice(1).join(".");
            return field ? `${field}: ${error.msg}` : error.msg;
          })
          .join("; ")
      : data.detail;

    const error = new Error(
      typeof detail === "string" && detail
        ? detail
        : `API request failed (${response.status})`,
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

async function send(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    return await fetch(BASE + path, {
      ...options,
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    throw new Error(
      "The clinic service could not be reached. Please try again.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function expireIfCurrent(raw) {
  if (rawSession() !== raw) return;

  window.localStorage.removeItem(STORAGE_KEY);
  verifiedRaw = null;
  publish("ready");

  window.dispatchEvent(new Event("pulse-session-expired"));
}

async function refreshSession(failedRaw) {
  // Serialize refresh requests across tabs.
  if (!navigator.locks?.request) {
    throw new Error(
      "Update your browser to continue this session, or sign in again.",
    );
  }

  return navigator.locks.request(`pulse-refresh:${BASE}`, async () => {
    const raw = rawSession();
    const current = storedSession(raw);
    const failed = storedSession(failedRaw);

    if (!current || current.id !== failed?.id) {
      throw changedSession();
    }

    // Another tab already refreshed this login.
    if (raw !== failedRaw) return;

    try {
      const data = await parse(
        await send("/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: current.refresh_token,
          }),
        }),
      );

      if (rawSession() !== raw) {
        throw changedSession();
      }

      checkProfile(data.profile);

      if (!data.access_token || !data.refresh_token) {
        throw new Error(
          "The service returned an incomplete session. Please try again.",
        );
      }

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...current,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        }),
      );
    } catch (error) {
      // Keep the saved login during outages or rate limits.
      if ([401, 403].includes(error.status)) {
        expireIfCurrent(raw);
      }

      throw error;
    }
  });
}

export function restoreSession() {
  if (restoring) return restoring;

  restoring = (async () => {
    publish("loading");

    try {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const raw = rawSession();
        const stored = storedSession(raw);

        if (!stored) {
          if (raw) {
            window.localStorage.removeItem(STORAGE_KEY);
          }

          verifiedRaw = null;
          publish("ready");
          return null;
        }

        let response;

        try {
          response = await send("/auth/me", {
            headers: {
              Authorization: `Bearer ${stored.access_token}`,
            },
          });
        } catch (error) {
          if (rawSession() !== raw) continue;
          throw error;
        }

        if (rawSession() !== raw) continue;

        if (response.status === 401) {
          try {
            await refreshSession(raw);
          } catch (error) {
            if (
              error.code === "SESSION_CHANGED" ||
              rawSession() !== raw
            ) {
              continue;
            }

            if ([401, 403].includes(error.status)) {
              return null;
            }

            throw error;
          }

          const refreshedRaw = rawSession();
          const refreshed = storedSession(refreshedRaw);

          if (!refreshed || refreshed.id !== stored.id) {
            continue;
          }

          try {
            response = await send("/auth/me", {
              headers: {
                Authorization: `Bearer ${refreshed.access_token}`,
              },
            });
          } catch (error) {
            if (rawSession() !== refreshedRaw) continue;
            throw error;
          }

          if (rawSession() !== refreshedRaw) continue;

          if ([401, 403].includes(response.status)) {
            expireIfCurrent(refreshedRaw);
            return null;
          }

          const profile = checkProfile(await parse(response));

          if (rawSession() !== refreshedRaw) continue;

          verifiedRaw = refreshedRaw;

          const value = {
            ...refreshed,
            profile,
          };

          publish("ready", value);
          return value;
        }

        if (response.status === 403) {
          expireIfCurrent(raw);
          return null;
        }

        const profile = checkProfile(await parse(response));

        if (rawSession() !== raw) continue;

        verifiedRaw = raw;

        const value = {
          ...stored,
          profile,
        };

        publish("ready", value);
        return value;
      }

      throw new Error("Sign-in changed repeatedly. Please try again.");
    } catch (error) {
      verifiedRaw = null;
      publish("error", null, error.message);
      throw error;
    }
  })().finally(() => {
    restoring = null;
  });

  return restoring;
}

window.addEventListener("storage", (event) => {
  if (
    event.storageArea !== window.localStorage ||
    (event.key !== STORAGE_KEY && event.key !== null)
  ) {
    return;
  }

  // Hide the old workspace while checking the new account.
  verifiedRaw = null;
  publish("loading");

  void restoreSession().catch(() => {});
});

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
  if (
    !publicRequest &&
    (state.status !== "ready" || verifiedRaw !== rawSession())
  ) {
    await restoreSession();
  }

  const requestRaw = publicRequest ? null : rawSession();
  const requestLogin = storedSession(requestRaw);

  const headers = {
    "Content-Type": file
      ? file.type || "application/octet-stream"
      : "application/json",
  };

  if (!publicRequest && session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await send(path, {
    method,
    headers,
    body: file || (body === undefined ? undefined : JSON.stringify(body)),
  });

  if (!publicRequest && storedSession()?.id !== requestLogin?.id) {
    throw changedSession();
  }

  if (
    response.status === 401 &&
    requestLogin &&
    !publicRequest &&
    retry
  ) {
    await refreshSession(requestRaw);
    await restoreSession();

    if (storedSession()?.id !== requestLogin.id) {
      throw changedSession();
    }

    return api(path, {
      method,
      body,
      publicRequest,
      retry: false,
      file,
    });
  }

  if (response.status === 401 && requestLogin && !publicRequest) {
    expireIfCurrent(requestRaw);
  }

  const data = await parse(response);

  if (!publicRequest && storedSession()?.id !== requestLogin?.id) {
    throw changedSession();
  }

  return data;
}

export async function login(credentials) {
  const value = await api("/auth/login", {
    method: "POST",
    body: credentials,
    publicRequest: true,
  });

  setApiSession(value);
  return value;
}

export async function logout() {
  const previous = session || storedSession();

  // Clear every tab first so a late refresh cannot restore this login.
  setApiSession(null);

  if (previous?.access_token) {
    await parse(
      await send("/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${previous.access_token}`,
        },
      }),
    );
  }
}

export async function signup(details) {
  const result = await api("/auth/signup", {
    method: "POST",
    body: details,
    publicRequest: true,
  });

  if (result.access_token) {
    if (result.profile?.role !== "patient") {
      throw new Error("Patient registration is unavailable.");
    }

    setApiSession(result);
  }

  return result;
}

export function requestPasswordReset(details) {
  return api("/auth/password-reset", {
    method: "POST",
    body: details,
    publicRequest: true,
  });
}

export function completePasswordReset(details) {
  return api("/auth/password-reset/complete", {
    method: "POST",
    body: details,
    publicRequest: true,
  });
}

export function resendConfirmation(details) {
  return api("/auth/resend-confirmation", {
    method: "POST",
    body: details,
    publicRequest: true,
  });
}

export function verifyEmail(details) {
  return api("/auth/verify-email", {
    method: "POST",
    body: details,
    publicRequest: true,
  });
}
