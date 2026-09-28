/**
 * Corpers Lodge Attendance - Google Apps Script Backend
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete any existing code and paste this entire file.
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type: "Web app".
 * 6. Set Description: "Lodge Attendance API v1".
 * 7. Set "Execute as": "Me" (your Google account).
 * 8. Set "Who has access": "Anyone".
 * 9. Click "Deploy" and copy the Web App URL (ends with /exec).
 * 10. Paste the Web App URL into the React application settings.
 */

const SHEET_OCCUPANTS = 'Occupants';
const SHEET_ATTENDANCE = 'Attendance';

const DEFAULT_INITIAL_OCCUPANTS = [
  'Adesewa Adedeji',
  'Zikmang Lekmang',
  'Esther Ugwu',
  'Longji Gideon',
  'Mariam Usman',
  'Charles Dian',
  'Nwakaeze Nicole',
  'Salima Anwar',
  'Ejeh Favour',
  'Emmanuel Gabriel',
  'Josh Nyitse',
  'Iyanuoluwa Roseline',
  'Jennifer Simeon',
  'Afiniki Tanko',
  'Jamal Ibraheem',
  'Sadiq  Abubakar',
  'Grace Dogo',
  'Fatima Mohammad',
  'Ukah Victor',
  'Gift Esebame-Usiabulu',
  'Zik Esther',
  'Ummulkulthumi Mohammed',
  'Leruchi Divine',
  'Praise Udom',
];

// Handles GET requests
function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action;

    return handleAction(action, params);
  } catch (error) {
    return createJsonResponse({ error: error.message || 'Server error' }, 500);
  }
}

// Handles POST requests
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    return handleAction(action, payload);
  } catch (error) {
    return createJsonResponse({ error: error.message || 'Server error' }, 500);
  }
}

// Route action to specific handler with strict validation
function handleAction(action, data) {
  ensureSheetsInitialized();

  switch (action) {
    case 'getOccupants':
      return handleGetOccupants();

    case 'getAttendance':
      return handleGetAttendance(data.date);

    case 'addOccupant':
      return handleAddOccupant(data.name);

    case 'editOccupant':
      return handleEditOccupant(data.oldName, data.newName);

    case 'removeOccupant':
      return handleRemoveOccupant(data.name);

    case 'setAttendance':
      return handleSetAttendance(data.date, data.occupantName, data.status, data.excuseStatus, data.excuseReason);

    case 'batchSetAttendance':
      return handleBatchSetAttendance(data.date, data.records);

    case 'ping':
      return createJsonResponse({ ok: true, timestamp: new Date().toISOString() });

    default:
      return createJsonResponse(
        { error: 'Invalid action. Supported: getOccupants, getAttendance, addOccupant, editOccupant, removeOccupant, setAttendance, batchSetAttendance, ping' },
        400
      );
  }
}

// ==========================================
// ACTION HANDLERS
// ==========================================

function handleGetOccupants() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_OCCUPANTS);
  const data = sheet.getDataRange().getValues();

  // Row 1 is header: ['Name', 'Active']
  const occupants = [];
  for (let i = 1; i < data.length; i++) {
    const rawName = data[i][0];
    const rawActive = data[i][1];

    if (!rawName) continue;
    const name = String(rawName).trim();
    const isActive = rawActive === true || String(rawActive).toUpperCase() === 'TRUE' || String(rawActive) === '1';

    if (isActive) {
      occupants.push({
        id: 'occ-' + encodeURIComponent(name),
        name: name,
        active: true,
        rowIndex: i + 1,
      });
    }
  }

  return createJsonResponse({ occupants: occupants });
}

function handleGetAttendance(date) {
  const validDate = validateDate(date);
  if (!validDate) {
    return createJsonResponse({ error: 'Missing or invalid date. Expected YYYY-MM-DD.' }, 400);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
  const data = sheet.getDataRange().getValues();

  // Row 1 is header: ['Date', 'Occupant Name', 'Status', 'Excuse Status', 'Excuse Reason']
  const attendance = {};
  for (let i = 1; i < data.length; i++) {
    const rowDate = formatDateCell(data[i][0]);
    const rawName = data[i][1];
    const rawStatus = data[i][2];
    const rawExcuseStatus = data[i][3];
    const rawExcuseReason = data[i][4];

    if (rowDate === validDate && rawName && rawStatus) {
      const name = String(rawName).trim();
      const status = String(rawStatus).toUpperCase().trim();
      if (['PRESENT', 'ABSENT', 'PASS', 'DUTY'].indexOf(status) !== -1) {
        let excuseStatus = 'none';
        let excuseReason = '';
        if (status === 'ABSENT') {
          if (rawExcuseStatus && String(rawExcuseStatus).trim().toLowerCase() === 'provided') {
            excuseStatus = 'provided';
            excuseReason = rawExcuseReason ? String(rawExcuseReason).trim() : '';
          }
        }
        attendance[name] = {
          status: status,
          excuseStatus: excuseStatus,
          excuseReason: excuseReason,
        };
      }
    }
  }

  return createJsonResponse({ date: validDate, attendance: attendance });
}

function handleAddOccupant(name) {
  const cleanName = sanitizeName(name);
  if (!cleanName) {
    return createJsonResponse({ error: 'Name must be between 2 and 80 characters without formula prefixes.' }, 400);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_OCCUPANTS);
  const data = sheet.getDataRange().getValues();

  // Check if occupant already exists
  for (let i = 1; i < data.length; i++) {
    const existingName = String(data[i][0]).trim();
    if (existingName.toLowerCase() === cleanName.toLowerCase()) {
      // Re-activate if was inactive
      sheet.getRange(i + 1, 2).setValue(true);
      return createJsonResponse({ success: true, name: cleanName, reactivated: true });
    }
  }

  // Append new active occupant
  sheet.appendRow([cleanName, true]);
  return createJsonResponse({ success: true, name: cleanName, reactivated: false });
}

function handleEditOccupant(oldName, newName) {
  const cleanOld = sanitizeName(oldName);
  const cleanNew = sanitizeName(newName);

  if (!cleanOld || !cleanNew) {
    return createJsonResponse({ error: 'Both oldName and newName must be valid strings.' }, 400);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const occSheet = ss.getSheetByName(SHEET_OCCUPANTS);
  const occData = occSheet.getDataRange().getValues();

  let found = false;
  for (let i = 1; i < occData.length; i++) {
    const name = String(occData[i][0]).trim();
    if (name.toLowerCase() === cleanOld.toLowerCase()) {
      occSheet.getRange(i + 1, 1).setValue(cleanNew);
      found = true;
      break;
    }
  }

  if (!found) {
    return createJsonResponse({ error: 'Occupant "' + cleanOld + '" not found.' }, 404);
  }

  // Also update attendance records to maintain historical continuity
  const attSheet = ss.getSheetByName(SHEET_ATTENDANCE);
  const attData = attSheet.getDataRange().getValues();
  for (let j = 1; j < attData.length; j++) {
    if (String(attData[j][1]).trim().toLowerCase() === cleanOld.toLowerCase()) {
      attSheet.getRange(j + 1, 2).setValue(cleanNew);
    }
  }

  return createJsonResponse({ success: true, oldName: cleanOld, newName: cleanNew });
}

function handleRemoveOccupant(name) {
  const cleanName = sanitizeName(name);
  if (!cleanName) {
    return createJsonResponse({ error: 'Invalid name provided.' }, 400);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_OCCUPANTS);
  const data = sheet.getDataRange().getValues();

  let found = false;
  for (let i = 1; i < data.length; i++) {
    const rowName = String(data[i][0]).trim();
    if (rowName.toLowerCase() === cleanName.toLowerCase()) {
      // Soft-delete by setting Active = false
      sheet.getRange(i + 1, 2).setValue(false);
      found = true;
      break;
    }
  }

  if (!found) {
    return createJsonResponse({ error: 'Occupant "' + cleanName + '" not found.' }, 404);
  }

  return createJsonResponse({ success: true, name: cleanName, active: false });
}

function handleSetAttendance(date, occupantName, status, excuseStatus, excuseReason) {
  const validDate = validateDate(date);
  const cleanName = sanitizeName(occupantName);
  const validStatus = validateStatus(status);

  if (!validDate) {
    return createJsonResponse({ error: 'Invalid date. Must be YYYY-MM-DD.' }, 400);
  }
  if (!cleanName) {
    return createJsonResponse({ error: 'Invalid occupant name.' }, 400);
  }
  if (!validStatus) {
    return createJsonResponse({ error: 'Invalid status. Must be PRESENT, ABSENT, PASS, or DUTY.' }, 400);
  }

  // Validate and sanitize excuse
  let finalExcuseStatus = 'none';
  let finalExcuseReason = '';
  if (validStatus === 'ABSENT') {
    if (excuseStatus && String(excuseStatus).trim().toLowerCase() === 'provided') {
      finalExcuseStatus = 'provided';
      finalExcuseReason = excuseReason ? sanitizeReason(String(excuseReason)) : '';
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
  const data = sheet.getDataRange().getValues();

  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    const rowDate = formatDateCell(data[i][0]);
    const rowName = String(data[i][1]).trim();

    if (rowDate === validDate && rowName.toLowerCase() === cleanName.toLowerCase()) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 3).setValue(validStatus);
    sheet.getRange(foundRow, 4).setValue(finalExcuseStatus);
    sheet.getRange(foundRow, 5).setValue(finalExcuseReason);
  } else {
    sheet.appendRow([validDate, cleanName, validStatus, finalExcuseStatus, finalExcuseReason]);
  }

  return createJsonResponse({
    success: true,
    date: validDate,
    occupantName: cleanName,
    status: validStatus,
    excuseStatus: finalExcuseStatus,
    excuseReason: finalExcuseReason,
  });
}

function handleBatchSetAttendance(date, records) {
  const validDate = validateDate(date);
  if (!validDate) {
    return createJsonResponse({ error: 'Invalid date.' }, 400);
  }
  if (!records || typeof records !== 'object') {
    return createJsonResponse({ error: 'Missing records object.' }, 400);
  }

  const names = Object.keys(records);
  for (let i = 0; i < names.length; i++) {
    const n = names[i];
    const item = records[n];
    if (item && typeof item === 'object') {
      handleSetAttendance(validDate, n, item.status, item.excuseStatus, item.excuseReason);
    } else {
      handleSetAttendance(validDate, n, item);
    }
  }

  return createJsonResponse({ success: true, count: names.length, date: validDate });
}

// ==========================================
// HELPERS & VALIDATION
// ==========================================

function ensureSheetsInitialized() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Occupants sheet
  let occSheet = ss.getSheetByName(SHEET_OCCUPANTS);
  if (!occSheet) {
    occSheet = ss.insertSheet(SHEET_OCCUPANTS);
    occSheet.appendRow(['Name', 'Active']);
    occSheet.getRange(1, 1, 1, 2).setFontWeight('bold');

    // Seed default occupants
    for (let i = 0; i < DEFAULT_INITIAL_OCCUPANTS.length; i++) {
      occSheet.appendRow([DEFAULT_INITIAL_OCCUPANTS[i], true]);
    }
  }

  // 2. Attendance sheet
  let attSheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!attSheet) {
    attSheet = ss.insertSheet(SHEET_ATTENDANCE);
    attSheet.appendRow(['Date', 'Occupant Name', 'Status', 'Excuse Status', 'Excuse Reason']);
    attSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  } else {
    // If sheet exists and has headers, ensure columns 4 & 5 have headers if missing
    const lastCol = Math.max(attSheet.getLastColumn(), 5);
    const headers = attSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    if (!headers[3]) {
      attSheet.getRange(1, 4).setValue('Excuse Status').setFontWeight('bold');
    }
    if (!headers[4]) {
      attSheet.getRange(1, 5).setValue('Excuse Reason').setFontWeight('bold');
    }
  }
}

function validateDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function validateStatus(status) {
  if (!status || typeof status !== 'string') return null;
  const upper = status.trim().toUpperCase();
  if (upper === 'PRESENT' || upper === 'ABSENT' || upper === 'PASS' || upper === 'DUTY') {
    return upper;
  }
  return null;
}

function sanitizeName(name) {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return null;
  // Prevent spreadsheet injection formulas (=, +, -, @)
  if (/^[=\+\-@]/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function sanitizeReason(reason) {
  if (!reason || typeof reason !== 'string') return '';
  let trimmed = reason.trim().substring(0, 200);
  // Prevent spreadsheet injection formulas (=, +, -, @)
  if (/^[=\+\-@]/.test(trimmed)) {
    trimmed = "'" + trimmed;
  }
  return trimmed;
}

function formatDateCell(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10);
  }
  return s;
}

function createJsonResponse(obj, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
