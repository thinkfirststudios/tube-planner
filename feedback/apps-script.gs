/**
 * Tube Planner tour results -> Google Sheet.
 *
 * Paste this into Extensions > Apps Script on the results sheet, then
 * Deploy > New deployment > Web app, "Execute as: Me", "Who has access: Anyone".
 * Setup steps are in README.md under "Tour results".
 *
 * Each tour sends one flat JSON object. Its keys become column headers; a key
 * the sheet hasn't seen yet gets a new column, so adding a tour step needs no
 * change here.
 */

var SHEET_NAME = 'Tour results';
var MAX_KEYS = 60;
var MAX_TEXT = 1000;

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    if (!data || typeof data !== 'object' || Array.isArray(data) || !data.session) {
      return reply('ignored');
    }

    var sheet = getSheet();
    var headers = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
    if (headers.indexOf('received') === -1) headers.unshift('received');

    var keys = Object.keys(data).slice(0, MAX_KEYS);
    keys.forEach(function (k) {
      if (headers.indexOf(k) === -1) headers.push(k);
    });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);

    var row = headers.map(function (h) {
      if (h === 'received') return new Date();
      var v = data[h];
      if (v === undefined || v === null) return '';
      if (typeof v === 'number') return v;
      // A leading = + - @ would make Sheets treat text as a formula.
      var text = String(v).slice(0, MAX_TEXT);
      return /^[=+\-@]/.test(text) ? "'" + text : text;
    });
    sheet.appendRow(row);
    return reply('ok');
  } catch (err) {
    return reply('error');
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  return book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
}

function reply(status) {
  return ContentService.createTextOutput(JSON.stringify({ status: status })).setMimeType(ContentService.MimeType.JSON);
}
