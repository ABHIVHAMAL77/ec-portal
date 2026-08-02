/**
 * Esports County — Google Sheet sync
 * ---------------------------------------------------------------------------
 * Two things live here:
 *
 *   PAYMENTS  (sheet tab "Payments")
 *     • rows arrive from the portal automatically
 *     • change the "status" cell and the portal updates + emails the payee
 *
 *   TASKS     (sheet tab "Tasks")
 *     • type as many rows as you like, leave "taskId" blank
 *     • menu: Esports County -> Push tasks to portal
 *       ...they're created, assigned, and the assignee is notified
 *     • existing rows (with a taskId) are updated instead
 *
 * ---------------------------------------------------------------------------
 * SETUP (once)
 *   1. Extensions -> Apps Script, paste this whole file.
 *   2. Fill in SECRET below (same value as SHEET_SYNC_SECRET on the server).
 *   3. Run "pullFromPortal" once and approve the permission prompt.
 *   4. Triggers (clock icon):
 *        pullFromPortal  · Time-driven · every 5 minutes
 *        onSheetEdit     · From spreadsheet · On edit
 *   5. Reload the sheet — an "Esports County" menu appears.
 * ---------------------------------------------------------------------------
 */

// ============ SETTINGS — edit this ============
const PORTAL_URL = 'https://portal.esportscounty.com';
const SECRET = 'PASTE_YOUR_SECRET_HERE';
// ==============================================

const SHEET_NAME = 'Payments';
const TASK_SHEET_NAME = 'Tasks';
const STATUS_COL_NAME = 'status';

/* ------------------------------------------------------------------ helpers */

function writeGrid_(sheetName, columns, rows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  sheet.getRange(1, 1, 1, columns.length).setValues([columns]).setFontWeight('bold');
  sheet.setFrozenRows(1);

  if (rows.length) {
    const values = rows.map(function (r) {
      return columns.map(function (c) { return r[c]; });
    });
    sheet.getRange(2, 1, values.length, columns.length).setValues(values);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow > rows.length + 1) {
    sheet.getRange(rows.length + 2, 1, lastRow - rows.length - 1, columns.length).clearContent();
  }
  return sheet;
}

function fetchJson_(url, options) {
  const res = UrlFetchApp.fetch(url, options || { muteHttpExceptions: true });
  const code = res.getResponseCode();
  if (code !== 200) {
    throw new Error('Portal error ' + code + ': ' + res.getContentText());
  }
  return JSON.parse(res.getContentText());
}

/* ----------------------------------------------------------------- payments */

function pullFromPortal() {
  const data = fetchJson_(PORTAL_URL + '/api/sheet/export?secret=' + encodeURIComponent(SECRET));
  writeGrid_(SHEET_NAME, data.columns, data.rows || []);
  SpreadsheetApp.getActiveSpreadsheet().toast('Synced ' + (data.rows || []).length + ' payment requests.');
}

function onSheetEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAME) return;
  if (e.range.getRow() === 1) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = headers.indexOf(STATUS_COL_NAME) + 1;
  const codeCol = headers.indexOf('trackingCode') + 1;
  if (statusCol === 0 || codeCol === 0) return;
  if (e.range.getColumn() !== statusCol) return;

  const row = e.range.getRow();
  const trackingCode = sheet.getRange(row, codeCol).getValue();
  const status = String(e.range.getValue() || '').trim();
  if (!trackingCode || !status) return;

  const res = UrlFetchApp.fetch(PORTAL_URL + '/api/sheet/status', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({
      secret: SECRET,
      trackingCode: trackingCode,
      status: status,
      note: 'Updated from the finance sheet.'
    })
  });

  if (res.getResponseCode() === 200) {
    SpreadsheetApp.getActiveSpreadsheet().toast(trackingCode + ' → ' + status);
  } else {
    SpreadsheetApp.getUi().alert('Could not update ' + trackingCode + '\n\n' + res.getContentText());
  }
}

/* -------------------------------------------------------------------- tasks */

/** Portal -> sheet. Refreshes the Tasks tab (and fills in taskId). */
function pullTasks() {
  const data = fetchJson_(PORTAL_URL + '/api/sheet/tasks?secret=' + encodeURIComponent(SECRET));
  const sheet = writeGrid_(TASK_SHEET_NAME, data.columns, data.rows || []);
  addTaskDropdowns_(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast('Loaded ' + (data.rows || []).length + ' tasks.');
}

/**
 * Sheet -> portal. Rows with a blank taskId are created and assigned;
 * rows with a taskId are updated. taskIds are written back so the next
 * push updates instead of duplicating.
 */
function pushTasks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TASK_SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('No "' + TASK_SHEET_NAME + '" tab yet. Run "Load tasks from portal" first.');
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    ss.toast('Nothing to push — add some rows first.');
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  const rows = values.map(function (v) {
    const obj = {};
    headers.forEach(function (h, i) {
      let cell = v[i];
      // Dates must go over as plain YYYY-MM-DD.
      if (h === 'dueDate' && Object.prototype.toString.call(cell) === '[object Date]') {
        cell = Utilities.formatDate(cell, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      obj[h] = cell === '' || cell === null ? '' : String(cell);
    });
    return obj;
  });

  const res = UrlFetchApp.fetch(PORTAL_URL + '/api/sheet/tasks', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({ secret: SECRET, rows: rows })
  });

  if (res.getResponseCode() !== 200) {
    SpreadsheetApp.getUi().alert('Push failed\n\n' + res.getContentText());
    return;
  }

  const out = JSON.parse(res.getContentText());
  const idCol = headers.indexOf('taskId') + 1;

  // Write new ids back, and flag anything that was skipped.
  const problems = [];
  (out.results || []).forEach(function (r) {
    if (r.taskId && idCol > 0) sheet.getRange(r.row, idCol).setValue(r.taskId);
    if (r.error) problems.push('Row ' + r.row + ': ' + r.error);
  });

  let msg = 'Created ' + out.created + ', updated ' + out.updated + '.';
  if (problems.length) {
    SpreadsheetApp.getUi().alert(msg + '\n\nSome rows were skipped:\n\n' + problems.join('\n'));
  } else {
    ss.toast(msg);
  }
}

/** Dropdowns so priority/status can't be typed wrong. */
function addTaskDropdowns_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rows = Math.max(sheet.getMaxRows() - 1, 1);

  const priorityCol = headers.indexOf('priority') + 1;
  if (priorityCol > 0) {
    sheet.getRange(2, priorityCol, rows).setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(['low', 'medium', 'high', 'urgent'], true)
        .setAllowInvalid(false).build()
    );
  }

  const statusCol = headers.indexOf('status') + 1;
  if (statusCol > 0) {
    sheet.getRange(2, statusCol, rows).setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(['todo', 'in_progress', 'review', 'done'], true)
        .setAllowInvalid(false).build()
    );
  }
}

/* --------------------------------------------------------------------- menu */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Esports County')
    .addItem('Sync payments from portal', 'pullFromPortal')
    .addSeparator()
    .addItem('Load tasks from portal', 'pullTasks')
    .addItem('Push tasks to portal', 'pushTasks')
    .addToUi();
}
