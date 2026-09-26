import { Occupant, INITIAL_OCCUPANTS } from '../types/attendance';

export interface SheetInfo {
  id: string;
  title: string;
  sheetName: string;
  sheetId: number;
}

/**
 * Extracts a Google Spreadsheet ID from either a full URL or a raw ID string.
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Check if it's already an ID (alphanumeric, dashes, underscores, length typically 25-60)
  if (/^[a-zA-Z0-9-_]{20,70}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Retrieves spreadsheet metadata to obtain the document title and the first sheet title/id.
 */
export async function getSpreadsheetDetails(
  spreadsheetId: string,
  token: string,
): Promise<SheetInfo> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title,index)`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody?.error?.message || `Failed to fetch spreadsheet (${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  const docTitle = data.properties?.title || 'Lodge Occupants';
  const sheets = data.sheets || [];
  const firstSheet = sheets[0]?.properties || { title: 'Sheet1', sheetId: 0 };

  return {
    id: spreadsheetId,
    title: docTitle,
    sheetName: firstSheet.title,
    sheetId: firstSheet.sheetId,
  };
}

/**
 * Reads the list of occupants from the specified Google Sheet.
 */
export async function fetchOccupantsFromSheet(
  spreadsheetId: string,
  sheetName: string,
  token: string,
): Promise<Occupant[]> {
  const range = encodeURIComponent(`'${sheetName}'!A1:B1000`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to read sheet data (${res.status})`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  if (rows.length === 0) {
    return [];
  }

  // Check if row 1 is a header
  const firstCell = String(rows[0][0] || '').trim().toLowerCase();
  const isHeader =
    firstCell.includes('name') ||
    firstCell.includes('occupant') ||
    firstCell.includes('corper') ||
    firstCell.includes('member') ||
    firstCell === 's/n' ||
    firstCell === 'no';

  const occupants: Occupant[] = [];
  const startIndex = isHeader ? 1 : 0;

  for (let i = startIndex; i < rows.length; i++) {
    const rawName = String(rows[i][0] || '').trim();
    if (rawName) {
      occupants.push({
        id: `occ-${i + 1}-${encodeURIComponent(rawName)}`,
        name: rawName,
        rowIndex: i + 1, // 1-based index in the sheet
      });
    }
  }

  return occupants;
}

/**
 * Appends a new occupant name to column A of the sheet.
 */
export async function addOccupantToSheet(
  spreadsheetId: string,
  sheetName: string,
  name: string,
  token: string,
): Promise<void> {
  const range = encodeURIComponent(`'${sheetName}'!A:A`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[name.trim()]],
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to add occupant to sheet (${res.status})`);
  }
}

/**
 * Updates an occupant's name at a specific row in the sheet.
 */
export async function updateOccupantInSheet(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  newName: string,
  token: string,
): Promise<void> {
  const range = encodeURIComponent(`'${sheetName}'!A${rowIndex}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[newName.trim()]],
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to update occupant in sheet (${res.status})`);
  }
}

/**
 * Deletes an occupant's row from the Google Sheet using batchUpdate deleteDimension.
 */
export async function deleteOccupantRowFromSheet(
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number,
  token: string,
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

  // deleteDimension uses 0-based indexing for row ranges [startIndex, endIndex)
  const startIndex = rowIndex - 1;
  const endIndex = rowIndex;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: startIndex,
              endIndex: endIndex,
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to delete occupant from sheet (${res.status})`);
  }
}

/**
 * Creates a brand new Google Spreadsheet initialized with the 24 corpers names.
 */
export async function createLodgeSpreadsheet(
  title: string,
  names: string[] = INITIAL_OCCUPANTS,
  token: string,
): Promise<{ id: string; url: string; sheetName: string; sheetId: number }> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';

  const rows = [
    { values: [{ userEnteredValue: { stringValue: 'Occupant Name' } }] },
    ...names.map((name) => ({
      values: [{ userEnteredValue: { stringValue: name } }],
    })),
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || 'Corpers Lodge Occupants',
      },
      sheets: [
        {
          properties: {
            title: 'Occupants',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: rows,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to create Google Sheet (${res.status})`);
  }

  const data = await res.json();
  const createdSheetId = data.spreadsheetId;
  const sheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${createdSheetId}/edit`;
  const firstSheet = data.sheets?.[0]?.properties || { title: 'Occupants', sheetId: 0 };

  return {
    id: createdSheetId,
    url: sheetUrl,
    sheetName: firstSheet.title,
    sheetId: firstSheet.sheetId,
  };
}
