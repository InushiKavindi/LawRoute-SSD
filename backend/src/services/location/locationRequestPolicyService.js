import { LOCATION_AUTOCOMPLETE_POLICY } from "../../constants/locationConstants.js";

const clientWindows = new Map();

const getWindowStart = (now) => Math.floor(now / LOCATION_AUTOCOMPLETE_POLICY.windowMs)
  * LOCATION_AUTOCOMPLETE_POLICY.windowMs;

export function consumeLocationAutocompleteRequest(clientId, now = Date.now()) {
  const key = clientId || "unknown";
  const windowStart = getWindowStart(now);
  const current = clientWindows.get(key);

  if (!current || current.windowStart !== windowStart) {
    clientWindows.set(key, { windowStart, count: 1 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= LOCATION_AUTOCOMPLETE_POLICY.requestsPerWindow) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowStart + LOCATION_AUTOCOMPLETE_POLICY.windowMs - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetLocationAutocompleteRequestBudgets() {
  clientWindows.clear();
}
