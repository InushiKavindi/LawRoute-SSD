// JWT authentication has been removed from localStorage.
// The backend now securely manages authentication via HttpOnly cookies.
// These functions are kept as no-ops only to prevent import errors if there are stray references.
export function getAuthToken() { return null; }
export function setAuthToken() { /* no-op */ }
export function subscribeAuthToken() { return () => {}; }
