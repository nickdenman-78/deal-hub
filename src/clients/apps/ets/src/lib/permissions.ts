/**
 * Mirrors the permission catalogues the modules declare in their
 * IntegrationEvents projects (e.g. DealsPermissions.cs). Add a module's
 * constants here when its first screen lands.
 */
export const DealsPermissions = {
  Read: 'deals:read',
  Capture: 'deals:capture',
  Confirm: 'deals:confirm',
} as const;
