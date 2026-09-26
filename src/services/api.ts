import { Occupant, AttendanceMap, AttendanceStatus } from '../types/attendance';

export interface ApiResponse<T = any> {
  occupants?: Occupant[];
  attendance?: Record<string, AttendanceStatus>;
  success?: boolean;
  error?: string;
  ok?: boolean;
  date?: string;
  [key: string]: any;
}

/**
 * Robust fetch helper to communicate with Google Apps Script Web App.
 * Handles 302 redirects and parses JSON responses.
 */
async function sendRequest(
  webAppUrl: string,
  action: string,
  payload: Record<string, any> = {},
): Promise<any> {
  const isMutation = [
    'addOccupant',
    'editOccupant',
    'removeOccupant',
    'setAttendance',
    'batchSetAttendance',
  ].includes(action);

  if (isMutation) {
    const res = await fetch(webAppUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } else {
    // GET request
    const url = new URL(webAppUrl);
    url.searchParams.set('action', action);
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, String(val));
      }
    });

    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  }
}

/**
 * Fetch all active occupants from Google Sheets via Apps Script Web App.
 */
export async function apiFetchOccupants(webAppUrl: string): Promise<Occupant[]> {
  const data = await sendRequest(webAppUrl, 'getOccupants');
  if (Array.isArray(data.occupants)) {
    return data.occupants;
  }
  return [];
}

/**
 * Fetch attendance map for a given date from Google Sheets via Apps Script Web App.
 */
export async function apiFetchAttendance(
  webAppUrl: string,
  date: string,
): Promise<AttendanceMap> {
  const data = await sendRequest(webAppUrl, 'getAttendance', { date });
  if (data && typeof data.attendance === 'object' && data.attendance !== null) {
    return data.attendance;
  }
  return {};
}

/**
 * Save an individual occupant's attendance status to Google Sheets.
 */
export async function apiSetAttendance(
  webAppUrl: string,
  date: string,
  occupantName: string,
  status: AttendanceStatus,
): Promise<void> {
  await sendRequest(webAppUrl, 'setAttendance', {
    date,
    occupantName,
    status,
  });
}

/**
 * Add a new occupant (active=true) to Google Sheets.
 */
export async function apiAddOccupant(webAppUrl: string, name: string): Promise<void> {
  await sendRequest(webAppUrl, 'addOccupant', { name });
}

/**
 * Edit an occupant's name in Google Sheets (and update existing attendance history).
 */
export async function apiEditOccupant(
  webAppUrl: string,
  oldName: string,
  newName: string,
): Promise<void> {
  await sendRequest(webAppUrl, 'editOccupant', { oldName, newName });
}

/**
 * Soft-delete / deactivate an occupant in Google Sheets (active=false).
 */
export async function apiRemoveOccupant(webAppUrl: string, name: string): Promise<void> {
  await sendRequest(webAppUrl, 'removeOccupant', { name });
}

/**
 * Ping check to verify Web App URL is working and accessible.
 */
export async function apiPing(webAppUrl: string): Promise<boolean> {
  try {
    const res = await sendRequest(webAppUrl, 'ping');
    return res && res.ok === true;
  } catch (err) {
    console.error('Ping check failed', err);
    return false;
  }
}
