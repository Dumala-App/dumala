import type { AssessmentSession, FprdsAttributeId, FprdsRole, Player } from '../types';
import { CURRENT_BENCHMARK_VERSION, getBenchmarkVersionInfo } from './benchmarks';
import { ROLE_LABELS, ROLE_WEIGHTS } from './weights';
import { getAttributeLabel } from './scoring';
import { getCoachAttributeLanguage } from './coachFeedbackContent';
import { generateFourWeekPlan } from './development';
import { buildPlayerFeedbackReport, sortAssessmentsChronologically } from './progress';

export interface ReportAttributeRow {
  attributeId: FprdsAttributeId;
  label: string;
  weight: number;
  score: number;
  tier: string;
}

export interface ReportOvrPoint {
  date: string;
  ovr: number;
  type: string;
  role: FprdsRole;
}

export interface ReportFeedbackItem {
  label: string;
  detail: string;
  tier: string;
}

export interface ReportDevelopmentWeek {
  weekNumber: number;
  focus: string;
  notes: string;
}

export interface AssessmentReportModel {
  generatedAt: string;
  clubName: string | null;
  player: {
    name: string;
    number: number | null;
    position: string;
    dateOfBirth: string | null;
  };
  latest: {
    date: string;
    type: string;
    ovr: number;
    ovrTier: string;
    ageGroup: string;
    role: FprdsRole;
    roleLabel: string;
  };
  ovrDelta: number | null;
  trendLabel: string;
  attributes: ReportAttributeRow[];
  ovrHistory: ReportOvrPoint[];
  strengths: ReportFeedbackItem[];
  priorities: ReportFeedbackItem[];
  development: {
    focusLabel: string;
    weeks: ReportDevelopmentWeek[];
  };
  coachNotes: string | null;
  benchmarkContext: string;
}

export interface BuildAssessmentReportOptions {
  clubName?: string | null;
  now?: Date;
  benchmarkVersion?: string;
}

const weightedAttributeIds = (role: FprdsRole): FprdsAttributeId[] => (
  (Object.keys(ROLE_WEIGHTS[role]) as FprdsAttributeId[])
    .filter(attributeId => ROLE_WEIGHTS[role][attributeId] > 0)
    .sort((a, b) => ROLE_WEIGHTS[role][b] - ROLE_WEIGHTS[role][a])
);

// Assembles a structured, self-contained report model for a single player from
// their saved assessment sessions. Sessions may be passed in any order; only the
// sessions belonging to `player` are considered. Returns null when the player has
// no saved assessments yet.
export const buildAssessmentReportModel = (
  player: Player,
  sessions: AssessmentSession[],
  options: BuildAssessmentReportOptions = {}
): AssessmentReportModel | null => {
  const playerSessions = sortAssessmentsChronologically(sessions.filter(session => session.playerId === player.id));
  if (playerSessions.length === 0) return null;

  const latest = playerSessions[playerSessions.length - 1];
  const previous = playerSessions.length > 1 ? playerSessions[playerSessions.length - 2] : null;
  const feedback = buildPlayerFeedbackReport(latest, previous);

  const attributes: ReportAttributeRow[] = weightedAttributeIds(latest.role).map(attributeId => {
    const score = latest.attributeScores[attributeId] ?? 10;
    return {
      attributeId,
      label: getCoachAttributeLanguage(attributeId).display,
      weight: ROLE_WEIGHTS[latest.role][attributeId],
      score,
      tier: getAttributeLabel(score).label
    };
  });

  const ovrHistory: ReportOvrPoint[] = playerSessions.map(session => ({
    date: session.assessmentDate,
    ovr: session.ovr,
    type: session.assessmentType,
    role: session.role
  }));

  const plan = latest.developmentPlan ?? generateFourWeekPlan(latest.role, latest.attributeScores);

  const toFeedbackItem = (item: { displayName: string; coachPhrase: string; label: string; reason?: string }): ReportFeedbackItem => ({
    label: item.displayName,
    detail: item.reason ?? item.coachPhrase,
    tier: item.label
  });

  return {
    generatedAt: (options.now ?? new Date()).toISOString(),
    clubName: options.clubName ?? null,
    player: {
      name: player.name,
      number: typeof player.number === 'number' ? player.number : null,
      position: player.position,
      dateOfBirth: player.dateOfBirth ?? null
    },
    latest: {
      date: latest.assessmentDate,
      type: latest.assessmentType,
      ovr: latest.ovr,
      ovrTier: latest.labels.ovrTierLabel,
      ageGroup: latest.ageGroup,
      role: latest.role,
      roleLabel: ROLE_LABELS[latest.role]
    },
    ovrDelta: feedback?.ovrDelta ?? null,
    trendLabel: feedback?.trendLabel ?? 'First saved assessment',
    attributes,
    ovrHistory,
    strengths: (feedback?.strengths ?? []).map(toFeedbackItem),
    priorities: (feedback?.priorities ?? []).map(item => toFeedbackItem({ ...item })),
    development: {
      focusLabel: getCoachAttributeLanguage(plan.focusAttributeId).display,
      weeks: plan.weeks.map(week => ({ weekNumber: week.weekNumber, focus: week.focus, notes: week.notes }))
    },
    coachNotes: latest.coachNotes?.trim() ? latest.coachNotes.trim() : null,
    benchmarkContext: getBenchmarkVersionInfo(options.benchmarkVersion ?? latest.benchmarkVersion ?? CURRENT_BENCHMARK_VERSION).label
  };
};

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
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(date);
};

const deltaBadge = (delta: number | null): string => {
  if (delta === null) return '<span class="chip chip-neutral">Baseline</span>';
  if (delta > 0) return `<span class="chip chip-up">+${delta} OVR</span>`;
  if (delta < 0) return `<span class="chip chip-down">${delta} OVR</span>`;
  return '<span class="chip chip-neutral">Level</span>';
};

// Renders the report model into a standalone, print-friendly HTML document.
// No external assets are referenced, so the file works fully offline and can be
// opened and saved as a PDF from any browser's print dialog.
export const renderAssessmentReportHtml = (model: AssessmentReportModel): string => {
  const attributeRows = model.attributes.map(row => `
        <tr>
          <td>${escapeHtml(row.label)}</td>
          <td class="num">${row.score}</td>
          <td>${escapeHtml(row.tier)}</td>
        </tr>`).join('');

  const historyRows = model.ovrHistory.map(point => `
        <tr>
          <td>${escapeHtml(formatReportDate(point.date))}</td>
          <td>${escapeHtml(point.type)}</td>
          <td class="num">${point.ovr}</td>
        </tr>`).join('');

  const feedbackList = (items: ReportFeedbackItem[]): string => (
    items.length === 0
      ? '<li class="muted">Not enough data yet.</li>'
      : items.map(item => `<li><strong>${escapeHtml(item.label)}</strong> <span class="tier">(${escapeHtml(item.tier)})</span><br><span class="muted">${escapeHtml(item.detail)}</span></li>`).join('')
  );

  const weekRows = model.development.weeks.map(week => `
        <tr>
          <td class="num">${week.weekNumber}</td>
          <td>${escapeHtml(week.focus)}</td>
          <td>${escapeHtml(week.notes)}</td>
        </tr>`).join('');

  const numberSuffix = model.player.number !== null ? ` · #${model.player.number}` : '';
  const clubLine = model.clubName ? `${escapeHtml(model.clubName)} · ` : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(model.player.name)} — FPRDS Assessment Report</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #f8fafc; }
  .sheet { max-width: 820px; margin: 0 auto; padding: 32px; background: #ffffff; }
  header { border-bottom: 3px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; }
  .eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #6366f1; margin: 0; }
  h1 { font-size: 26px; margin: 6px 0 2px; }
  .subtitle { font-size: 13px; color: #475569; margin: 0; }
  .meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .chip { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: #eef2ff; color: #3730a3; }
  .chip-up { background: #dcfce7; color: #166534; }
  .chip-down { background: #fee2e2; color: #991b1b; }
  .chip-neutral { background: #e2e8f0; color: #334155; }
  .snapshot { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
  .ovr { flex: 0 0 auto; text-align: center; border: 2px solid #4f46e5; border-radius: 16px; padding: 14px 22px; }
  .ovr .value { font-size: 40px; font-weight: 900; line-height: 1; color: #4f46e5; }
  .ovr .label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
  .snapshot-facts { flex: 1 1 240px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; align-content: center; }
  .fact { border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 12px; }
  .fact .k { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; }
  .fact .v { font-size: 14px; font-weight: 700; margin-top: 2px; }
  section { margin-bottom: 24px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #eef2f7; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  ul { margin: 0; padding-left: 18px; }
  li { margin-bottom: 8px; font-size: 13px; }
  .muted { color: #64748b; }
  .tier { color: #6366f1; font-weight: 700; font-size: 12px; }
  .notes { border-left: 3px solid #4f46e5; background: #f5f3ff; padding: 10px 14px; border-radius: 0 8px 8px 0; font-size: 13px; }
  footer { margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; }
  @media print {
    body { background: #ffffff; }
    .sheet { max-width: none; padding: 0; }
    section, .snapshot { break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <header>
      <p class="eyebrow">Dumala · FPRDS Development Report</p>
      <h1>${escapeHtml(model.player.name)}${numberSuffix}</h1>
      <p class="subtitle">${clubLine}${escapeHtml(model.player.position)} · ${escapeHtml(model.latest.roleLabel)} · ${escapeHtml(model.latest.ageGroup)}</p>
      <div class="meta">
        <span class="chip">${escapeHtml(model.latest.type)} assessment</span>
        <span class="chip">${escapeHtml(formatReportDate(model.latest.date))}</span>
        ${deltaBadge(model.ovrDelta)}
      </div>
    </header>

    <div class="snapshot">
      <div class="ovr">
        <div class="value">${model.latest.ovr}</div>
        <div class="label">OVR · ${escapeHtml(model.latest.ovrTier)}</div>
      </div>
      <div class="snapshot-facts">
        <div class="fact"><div class="k">Trend</div><div class="v">${escapeHtml(model.trendLabel)}</div></div>
        <div class="fact"><div class="k">Role</div><div class="v">${escapeHtml(model.latest.roleLabel)}</div></div>
        <div class="fact"><div class="k">Age group</div><div class="v">${escapeHtml(model.latest.ageGroup)}</div></div>
        <div class="fact"><div class="k">Assessments</div><div class="v">${model.ovrHistory.length}</div></div>
      </div>
    </div>

    <section>
      <h2>Attribute scores (role-weighted)</h2>
      <table>
        <thead><tr><th>Attribute</th><th class="num">Score</th><th>Tier</th></tr></thead>
        <tbody>${attributeRows}</tbody>
      </table>
    </section>

    <section class="cols">
      <div>
        <h2>Strengths</h2>
        <ul>${feedbackList(model.strengths)}</ul>
      </div>
      <div>
        <h2>Development priorities</h2>
        <ul>${feedbackList(model.priorities)}</ul>
      </div>
    </section>

    <section>
      <h2>4-week development plan · Focus: ${escapeHtml(model.development.focusLabel)}</h2>
      <table>
        <thead><tr><th class="num">Week</th><th>Focus</th><th>Notes</th></tr></thead>
        <tbody>${weekRows}</tbody>
      </table>
    </section>

    ${model.ovrHistory.length > 1 ? `<section>
      <h2>OVR history</h2>
      <table>
        <thead><tr><th>Date</th><th>Type</th><th class="num">OVR</th></tr></thead>
        <tbody>${historyRows}</tbody>
      </table>
    </section>` : ''}

    ${model.coachNotes ? `<section>
      <h2>Coach notes</h2>
      <div class="notes">${escapeHtml(model.coachNotes)}</div>
    </section>` : ''}

    <footer>
      Generated by Dumala on ${escapeHtml(formatReportDate(model.generatedAt))} · Benchmark: ${escapeHtml(model.benchmarkContext)}.
      Training creates development evidence; FPRDS assessment verifies current ability. This report reflects drill-based results, not a substitute for qualified coaching judgement.
    </footer>
  </div>
</body>
</html>`;
};
