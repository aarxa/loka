// Loka waitlist: paste this into the Apps Script editor of a Google Sheet (Extensions → Apps Script), then deploy it as
// a web app (Deploy → New deployment → Web app; Execute as: Me; Who has access: Anyone). Each sign-up from the site
// becomes a row in the sheet, and you get an email about it.

const NOTIFY = '';   // where to send the notifications; leave empty for the Google account that owns this sheet

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);                                    // two sign-ups at once still get a row each
  try {
    const p = (e && e.parameter) || {};
    if (p._honey) return reply({ ok: true });              // a bot filled in the hidden field: thank it, keep nothing
    const email = String(p.email || '').trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return reply({ ok: false, error: 'invalid' });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) { sheet.appendRow(['Joined', 'Email', 'From']); sheet.setFrozenRows(1); }
    const rows = sheet.getLastRow() - 1;
    const known = rows > 0 ? sheet.getRange(2, 2, rows, 1).getValues().flat().map(String) : [];
    if (known.includes(email)) return reply({ ok: true, already: true });   // already on the list: no second row

    sheet.appendRow([new Date(), email, p.device === 'phone' ? 'Phone' : 'Laptop']);
    const count = rows + 1, url = SpreadsheetApp.getActiveSpreadsheet().getUrl();
    const safe = email.replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');   // shown as text, never as markup
    MailApp.sendEmail({
      to: NOTIFY || Session.getEffectiveUser().getEmail(),
      subject: 'Loka waitlist: ' + email,
      body: 'New sign-up: ' + email + '\n' + count + (count === 1 ? ' person' : ' people') + ' on the list so far.\n\nThe sheet: ' + url,
      htmlBody: '<p>New sign-up: <b>' + safe + '</b></p><p>' + count + (count === 1 ? ' person' : ' people') +
        ' on the list so far.</p><p><a href="' + url + '">Open the sheet</a></p>'
    });
    return reply({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// opening the web app's address in a browser shows this, so you can check the deployment is live
function doGet() { return reply({ ok: true, service: 'Loka waitlist' }); }

function reply(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
