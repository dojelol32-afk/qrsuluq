const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value) {
    return typeof value === 'string' && UUID_RE.test(value);
}

// Escapes a value for CSV and neutralises spreadsheet formula injection
// (values starting with = + - @ tab or CR are prefixed with an apostrophe).
function csvEscape(value) {
    let s = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
}

module.exports = { isUuid, csvEscape };
