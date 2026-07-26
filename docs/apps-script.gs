/**
 * Esports County — Payments ⇄ Google Sheet sync
 * ---------------------------------------------------------------------------
 * HOW TO SET UP (5 minutes, one time)
 *
 * 1. Create a Google Sheet, e.g. "Esports County — Payments".
 * 2. Extensions → Apps Script. Delete anything there and paste this whole file.
 * 3. Edit the two settings just below (PORTAL_URL and SECRET).
 *      SECRET must match SHEET_SYNC_SECRET in the portal's .env file.
 * 4. Save, then in the toolbar choose the function "pullFromPortal" and click Run.
 *      Google will ask for permission the first time — approve it.
 * 5. Automatic refresh: Triggers (clock icon) → Add Trigger →
 *      function: pullFromPortal · event source: Time-driven · every 5 minutes.
 * 6. Push status edits back: Triggers → Add Trigger →
 *      function: onSheetEdit · event source: From spreadsheet · On edit.
 *
 * After that: new submissions appear automatically, and when you change a
 * value in the Status column the portal is updated and the payee is emailed.
 * Valid statuses: submitted, under_review, approved, on_hold, rejected, paid
 * ---------------------------------------------------------------------------
 */

// ============ SETTINGS — edit these two lines ============
const PORTAL_URL = 'https://portal.esportscounty.com';
const SECRET = 'PASTE_THE_SAME_SECRET_AS_SHEET_SYNC_SECRET';
// =========================================================

const SHEET_NAME = 'Payments';
const STATUS_COL_NAME = 'status';

/** Pull every payment request from the portal into the sheet. */
function pullFromPortal() {
  const res = UrlFetchApp.fetch(
    PORTAL_URL + '/api/sheet/export?secret=' + encodeURIComponent(SECRET),
    { muteHttpExceptions: true }
  );

  if (res.getResponseCode() !== 200) {
    throw new Error('Portal error ' + res.getResponseCode() + ': ' + res.getContentText());
  }

  const data = JSON.parse(res.getContentText());
  const columns = data.columns;
  const rows = data.rows || [];

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  // Header
  sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
  sheet.getRange(1, 1, 1, columns.length).setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Body
  if (rows.length) {
    const values = rows.map(function (r) {
      return columns.map(function (c) {
        return r[c];
      });
    });
    sheet.getRange(2, 1, values.length, columns.length).setValues(values);
  }

  // Clear any leftover rows from previous pulls
  const lastRow = sheet.getLastRow();
  if (lastRow > rows.length + 1) {
    sheet.getRange(rows.length + 2, 1, lastRow - rows.length - 1, columns.length).clearContent();
  }

  sheet.autoResizeColumns(1, Math.min(columns.length, 8));
  SpreadsheetApp.getActiveSpreadsheet().toast('Synced ' + rows.length + ' payment requests.');
}

/** When the Status column is edited, push the change back to the portal. */
function onSheetEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAME) return;
  if (e.range.getRow() === 1) return; // header

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = headers.indexOf(STATUS_COL_NAME) + 1;
  const codeCol = headers.indexOf('trackingCode') + 1;
  if (statusCol === 0 || codeCol === 0) return;
  if (e.range.getColumn() !== statusCol) return; // only Status edits

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
      note: 'Updated from the finance sheet.',
    }),
  });

  if (res.getResponseCode() === 200) {
    SpreadsheetApp.getActiveSpreadsheet().toast(trackingCode + ' → ' + status);
  } else {
    SpreadsheetApp.getUi().alert(
      'Could not update ' + trackingCode + '\n\n' + res.getContentText()
    );
  }
}

/** Adds a "Payments" menu with a manual Sync button. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Payments')
    .addItem('Sync from portal', 'pullFromPortal')
    .addToUi();
}
