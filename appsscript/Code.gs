var SPREADSHEET_ID  = '1-ehCEJFXzGXwGorWREUWYHkUiFPUQLc6iqEzKfNWqak';
var TAB_NAME        = 'workouts';
var AUTHORIZED_EMAIL = 'feynman.nicks.agent@gmail.com';
var ALLOWED_ORIGIN  = 'https://profnicklee.github.io';
var HEADERS = ['logged_at', 'date', 'workout_name', 'exercise_name', 'variant', 'set_number', 'reps', 'weight_kg', 'notes'];

// Receives: { rows: [{ date, workout_name, exercise_name, variant, set_number, reps, weight_kg, notes }] }
// Returns:  { success: true, logged: N } or { error: string }
function doPost(e) {
  try {
    validateCaller_();

    var payload = JSON.parse(e.postData.contents);
    var rows = payload.rows;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return jsonResponse_({ error: 'No rows provided' });
    }

    var sheet = getOrCreateSheet_();
    var loggedAt = new Date().toISOString();

    rows.forEach(function (row) {
      sheet.appendRow([
        loggedAt,
        row.date,
        row.workout_name,
        row.exercise_name,
        row.variant || '',
        row.set_number,
        row.reps,
        row.weight_kg,
        row.notes || ''
      ]);
    });

    return jsonResponse_({ success: true, logged: rows.length });
  } catch (err) {
    return jsonResponse_({ error: err.message });
  }
}

// Returns: { rows: [{ logged_at, date, workout_name, exercise_name, variant, set_number, reps, weight_kg, notes }] }
function doGet(e) {
  try {
    validateCaller_();

    var sheet = getOrCreateSheet_();
    var data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return jsonResponse_({ rows: [] });
    }

    var rows = data.slice(1).map(function (row) {
      return {
        logged_at: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
        date: formatDate_(row[1]),
        workout_name: row[2],
        exercise_name: row[3],
        variant: row[4],
        set_number: Number(row[5]),
        reps: Number(row[6]),
        weight_kg: Number(row[7]),
        notes: row[8] || ''
      };
    });

    return jsonResponse_({ rows: rows });
  } catch (err) {
    return jsonResponse_({ error: err.message });
  }
}

// Handles CORS preflight (OPTIONS). Safari sends this before a credentialed POST
// with Content-Type: application/json. Returning any 200 response here tells
// Google's infrastructure to proceed; the actual CORS response headers
// (Access-Control-Allow-Origin: ALLOWED_ORIGIN, Access-Control-Allow-Credentials: true,
// Access-Control-Allow-Headers: Content-Type) are added by Apps Script's serving
// layer for authenticated "Execute as: Me / Only myself" requests.
// ContentService does not expose setHeader(), so headers cannot be set in script.
function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function validateCaller_() {
  var email = Session.getActiveUser().getEmail();
  if (email !== AUTHORIZED_EMAIL) {
    throw new Error('Unauthorized');
  }
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(TAB_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(TAB_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function formatDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return value ? String(value) : '';
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
