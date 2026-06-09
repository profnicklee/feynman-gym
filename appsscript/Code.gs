var SPREADSHEET_ID   = '1-ehCEJFXzGXwGorWREUWYHkUiFPUQLc6iqEzKfNWqak';
var TAB_NAME         = 'workouts';
var SESSION_TAB_NAME = 'workout_sessions';
var SECRET_TOKEN     = 'FEYNMAN_GYM_2026';
var HEADERS          = ['logged_at', 'date', 'workout_name', 'exercise_name', 'variant', 'set_number', 'reps', 'weight_kg', 'notes'];
var SESSION_HEADERS  = ['date', 'workout_name', 'start_time', 'end_time', 'duration_minutes', 'total_rest_seconds'];

// Deployment: Execute as Me, Who has access: Anyone
// "Anyone" is required for CORS to work with token auth.

// Receives: { token, rows: [...] }  OR  { token, session: {...} }
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    validateCaller_(payload.token);

    if (payload.session) {
      return logSession_(payload.session);
    }

    if (payload.rows) {
      var rows = payload.rows;
      if (!Array.isArray(rows) || rows.length === 0) {
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
    }

    return jsonResponse_({ error: 'No rows or session in payload' });
  } catch (err) {
    return jsonResponse_({ error: err.message });
  }
}

// Returns: { rows: [...] }
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
        logged_at:     row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
        date:          formatDate_(row[1]),
        workout_name:  row[2],
        exercise_name: row[3],
        variant:       row[4],
        set_number:    Number(row[5]),
        reps:          Number(row[6]),
        weight_kg:     Number(row[7]),
        notes:         row[8] || ''
      };
    });

    return jsonResponse_({ rows: rows });
  } catch (err) {
    return jsonResponse_({ error: err.message });
  }
}

function logSession_(session) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SESSION_TAB_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SESSION_TAB_NAME);
    sheet.appendRow(SESSION_HEADERS);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(SESSION_HEADERS);
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    session.date,
    session.workout_name,
    session.start_time,
    session.end_time,
    session.duration_minutes,
    session.total_rest_seconds
  ]);

  return jsonResponse_({ success: true });
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
