export interface UserPreferences {
  timezone: string;
  dateFormat: string;
  pageSize: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  pageSize: 25,
};

const STORAGE_KEY = 'fundo_admin_preferences';

export function getPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      timezone: parsed.timezone || DEFAULT_PREFERENCES.timezone,
      dateFormat: parsed.dateFormat || DEFAULT_PREFERENCES.dateFormat,
      pageSize: Number(parsed.pageSize) || DEFAULT_PREFERENCES.pageSize,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Partial<UserPreferences>): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  const current = getPreferences();
  const updated: UserPreferences = {
    ...current,
    ...preferences,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('preferences-updated'));
  } catch (e) {
    console.error('Failed to save preferences to localStorage', e);
  }
  return updated;
}
