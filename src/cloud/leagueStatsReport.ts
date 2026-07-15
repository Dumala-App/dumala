import type { StatDatabase } from './league';

// A self-contained, print-friendly statistics report for a league scope (a
// season, a single event, or the whole league). No external assets are
// referenced, so the file opens fully offline and can be saved as a PDF from
// any browser's print dialog. Mirrors src/fprds/assessmentReport.ts.

export interface StatReportScope {
  leagueName: string;
  scopeLabel: string;
  generatedAt: string;
}

const escapeHtml = (value: string): string => (
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
);

const formatReportDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

/** A single summary tile of a value and label. */
const tile = (value: string | number, label: string): string =>
  `<div class="tile"><div class="v">${escapeHtml(String(value))}</div><div class="k">${escapeHtml(label)}</div></div>`;

export const renderStatDatabaseReportHtml = (db: StatDatabase, scope: StatReportScope): string => {
  const { players, teams, totals } = db;

  const playerRows = players.length === 0
    ? '<tr><td colspan="9" class="muted">No statistics recorded for this scope yet.</td></tr>'
    : players.map((p, index) => `
        <tr>
          <td class="num">${index + 1}</td>
          <td>${escapeHtml(p.playerName)}</td>
          <td>${escapeHtml(p.teamName)}</td>
          <td class="num">${p.matches}</td>
          <td class="num strong">${p.goals}</td>
          <td class="num">${p.assists}</td>
          <td class="num">${p.goalContributions}</td>
          <td class="num">${p.yellow}</td>
          <td class="num">${p.red}</td>
        </tr>`).join('');

  const teamRows = teams.length === 0
    ? '<tr><td colspan="7" class="muted">No teams recorded for this scope yet.</td></tr>'
    : teams.map((t, index) => `
        <tr>
          <td class="num">${index + 1}</td>
          <td>${escapeHtml(t.teamName)}</td>
          <td class="num">${t.players}</td>
          <td class="num strong">${t.goals}</td>
          <td class="num">${t.assists}</td>
          <td class="num">${t.yellow}</td>
          <td class="num">${t.red}</td>
        </tr>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(scope.leagueName)} — Statistics Report</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #f8fafc; }
  .sheet { max-width: 860px; margin: 0 auto; padding: 32px; background: #ffffff; }
  header { border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px; }
  .eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #0284c7; margin: 0; }
  h1 { font-size: 26px; margin: 6px 0 2px; }
  .subtitle { font-size: 13px; color: #475569; margin: 0; }
  .tiles { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 24px; }
  .tile { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; text-align: center; }
  .tile .v { font-size: 22px; font-weight: 900; line-height: 1; color: #0f172a; }
  .tile .k { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-top: 4px; }
  section { margin-bottom: 24px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #eef2f7; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.strong { font-weight: 800; }
  tbody tr:nth-child(odd) { background: #fbfdff; }
  .muted { color: #64748b; text-align: center; padding: 16px; }
  footer { margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; }
  @media print {
    body { background: #ffffff; }
    .sheet { max-width: none; padding: 0; }
    section, .tiles { break-inside: avoid; }
    thead { display: table-header-group; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <header>
      <p class="eyebrow">Dumala League · Statistics Record</p>
      <h1>${escapeHtml(scope.leagueName)}</h1>
      <p class="subtitle">${escapeHtml(scope.scopeLabel)}</p>
    </header>

    <div class="tiles">
      ${tile(totals.goals, 'Goals')}
      ${tile(totals.assists, 'Assists')}
      ${tile(totals.yellow, 'Yellow')}
      ${tile(totals.red, 'Red')}
      ${tile(totals.players, 'Players')}
      ${tile(totals.matches, 'Matches')}
    </div>

    <section>
      <h2>Player statistics</h2>
      <table>
        <thead><tr>
          <th class="num">#</th><th>Player</th><th>Team</th><th class="num">MP</th>
          <th class="num">G</th><th class="num">A</th><th class="num">G+A</th><th class="num">Y</th><th class="num">R</th>
        </tr></thead>
        <tbody>${playerRows}</tbody>
      </table>
    </section>

    <section>
      <h2>Team statistics</h2>
      <table>
        <thead><tr>
          <th class="num">#</th><th>Team</th><th class="num">Players</th>
          <th class="num">G</th><th class="num">A</th><th class="num">Y</th><th class="num">R</th>
        </tr></thead>
        <tbody>${teamRows}</tbody>
      </table>
    </section>

    <footer>
      Generated by Dumala on ${escapeHtml(formatReportDate(scope.generatedAt))}.
      MP = matches with a recorded statistic · G = goals · A = assists · G+A = goal contributions · Y = yellow cards · R = red cards.
      Figures reflect statistics entered by league staff and are provisional until verified.
    </footer>
  </div>
</body>
</html>`;
};
