var SPREADSHEET_ID = '1-ehCEJFXzGXwGorWREUWYHkUiFPUQLc6iqEzKfNWqak';
var TAB_NAME       = 'workouts';
var SECRET_TOKEN   = 'FEYNMAN_GYM_2026';
var HEADERS = ['logged_at', 'date', 'workout_name', 'exercise_name', 'variant', 'set_number', 'reps', 'weight_kg', 'notes'];

// Deployment: Execute as Me, Who has access: Anyone
// "Anyone" is required for CORS to work with token auth — the browser cannot send
// credentialed cross-origin requests to a "Only myself" web app without session cookies.

// Receives: { token, rows: [{ date, workout_name, exercise_name, variant, set_number, reps, weight_kg, notes }] }
// Returns:  { success: true, logged: N } or { error: string }
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    validateCaller_(payload.token);

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
    validateCaller_(e.parameter.token);

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

function validateCaller_(token) {
  if (token !== SECRET_TOKEN) {
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
