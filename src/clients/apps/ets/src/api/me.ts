import { apiGet } from './client';

/** GET /api/me — the caller's identity and permission catalogue (ADR-0006). */
export interface Me {
  identityId: string;
  name: string;
  email: string | null;
  permissions: string[];
}

export const getMe = () => apiGet<Me>('/api/me');
