import { Occupant, AttendanceMap, INITIAL_OCCUPANTS } from '../types/attendance';

const OCCUPANTS_CACHE_KEY = 'corpers_lodge_occupants_cache_v2';
const ATTENDANCE_CACHE_PREFIX = 'corpers_lodge_att_cache_v2_';
const APPS_SCRIPT_URL_KEY = 'corpers_lodge_apps_script_url_v2';

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatDisplayDate(dateKey: string = getTodayKey()): string {
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateKey;
  }
}

export function formatDateSimple(dateKey: string = getTodayKey()): string {
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateKey;
  }
}

/**
 * Get the configured Google Apps Script Web App URL.
 * Checks URL search parameters first (?api=...), then environment variables, then localStorage.
 */
export function getWebAppUrl(): string | null {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('api');
      if (urlParam && urlParam.trim()) {
        const clean = urlParam.trim();
        saveWebAppUrl(clean);
        return clean;
      }
    }
  } catch (err) {
    console.error('Error reading URL search params', err);
  }

  // Check env variable
  const envUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim();
  }

  // Check storage
  try {
    const saved = localStorage.getItem(APPS_SCRIPT_URL_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch (err) {
    console.error('Error reading saved Web App URL', err);
  }

  return null;
}

export function saveWebAppUrl(url: string | null): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(APPS_SCRIPT_URL_KEY, url.trim());
    } else {
      localStorage.removeItem(APPS_SCRIPT_URL_KEY);
    }
  } catch (err) {
    console.error('Error saving Web App URL', err);
  }
}

/**
 * Temporary offline/fast-boot cache.
 * NOTE: The Google Sheet is always the authoritative source of truth.
 */
export function getCachedOccupants(): Occupant[] {
  try {
    const raw = localStorage.getItem(OCCUPANTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading cached occupants', err);
  }

  return INITIAL_OCCUPANTS.map((name, index) => ({
    id: `occ-${encodeURIComponent(name)}`,
    name,
    active: true,
    rowIndex: index + 2,
  }));
}

export function saveCachedOccupants(occupants: Occupant[]): void {
  try {
    localStorage.setItem(OCCUPANTS_CACHE_KEY, JSON.stringify(occupants));
  } catch (err) {
    console.error('Error saving cached occupants', err);
  }
}

export function getCachedAttendance(dateKey: string = getTodayKey()): AttendanceMap {
  try {
    const raw = localStorage.getItem(`${ATTENDANCE_CACHE_PREFIX}${dateKey}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading cached attendance', err);
  }
  return {};
}

export function saveCachedAttendance(dateKey: string, map: AttendanceMap): void {
  try {
    localStorage.setItem(`${ATTENDANCE_PREFIX}${dateKey}`, JSON.stringify(map));
  } catch (err) {
    console.error('Error saving cached attendance', err);
  }
}
const ATTENDANCE_PREFIX = ATTENDANCE_CACHE_PREFIX;
