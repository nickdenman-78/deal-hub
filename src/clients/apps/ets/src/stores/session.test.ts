import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/me', () => ({
  getMe: vi.fn(async () => ({
    identityId: 'sub-1',
    name: 'trader',
    email: 'trader@example.test',
    permissions: ['deals:capture', 'deals:read'],
  })),
}));

import { getMe } from '@/api/me';
import { useSessionStore } from './session';

describe('session store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(getMe).mockClear();
  });

  it('answers can() from the /api/me permission list', async () => {
    const session = useSessionStore();
    await session.load();
    expect(session.can('deals:read')).toBe(true);
    expect(session.can('settlement:approve')).toBe(false);
  });

  it('loads /api/me once however many guards ask concurrently', async () => {
    const session = useSessionStore();
    await Promise.all([session.load(), session.load(), session.load()]);
    await session.load();
    expect(getMe).toHaveBeenCalledTimes(1);
  });
});
