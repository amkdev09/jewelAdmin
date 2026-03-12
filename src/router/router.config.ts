/**
 * Routes that don't require auth (login, signup, etc.)
 * Used by axios interceptor to skip refresh on 401 for these paths.
 */
export const commonRouters = [
  { path: "/signin" },
  { path: "/signup" },
  { path: "/reset-password" },
];
