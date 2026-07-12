import React, { useEffect, useMemo, useState } from 'react';
import { Award, BookMarked, Check, CirclePlus, ExternalLink, Flag, NotebookPen, Route, ShieldCheck, Trash2 } from 'lucide-react';
import {
  COACH_LEARNING_STORAGE_KEY,
  COACH_EDUCATION_PATHWAYS,
  EMPTY_COACH_LEARNING_RECORD,
  OFFICIAL_COACHING_RESOURCES,
  learningProgress,
  parseCoachLearningRecord,
  type CoachLearningRecord
} from '../coachEducation/coachEducation';
import { CoachCredentialsPortfolio } from './CoachCredentialsPortfolio';

const today = () => new Date().toISOString().slice(0, 10);
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const readRecord = (): CoachLearningRecord => {
  if (typeof window === 'undefined') return EMPTY_COACH_LEARNING_RECORD;
  return parseCoachLearningRecord(window.localStorage.getItem(COACH_LEARNING_STORAGE_KEY));
};

export const CoachDevelopmentWorkspace = () => {
  const [record, setRecord] = useState<CoachLearningRecord>(readRecord);
  const [planTitle, setPlanTitle] = useState('');
  const [planFocus, setPlanFocus] = useState('Session planning');
  const [goalDrafts, setGoalDrafts] = useState<Record<string, string>>({});
  const [reflection, setReflection] = useState('');
  const progress = useMemo(() => learningProgress(record), [record]);
  const progressPercent = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;

  useEffect(() => {
    window.localStorage.setItem(COACH_LEARNING_STORAGE_KEY, JSON.stringify(record));
  }, [record]);

  const addPlan = (event: React.FormEvent) => {
    event.preventDefault();
    const title = planTitle.trim();
    if (!title) return;
    setRecord(current => ({
      ...current,
      plans: [...current.plans, { id: makeId(), title, focus: planFocus, createdAt: today(), goals: [] }]
    }));
    setPlanTitle('');
  };

  const addGoal = (planId: string) => {
    const title = goalDrafts[planId]?.trim();
    if (!title) return;
    setRecord(current => ({ ...current, plans: current.plans.map(plan => plan.id === planId
      ? { ...plan, goals: [...plan.goals, { id: makeId(), title, targetDate: '', completed: false }] }
      : plan) }));
    setGoalDrafts(current => ({ ...current, [planId]: '' }));
  };

  const saveReflection = (event: React.FormEvent) => {
    event.preventDefault();
    const note = reflection.trim();
    if (!note) return;
    setRecord(current => ({ ...current, reflections: [{
      id: makeId(), createdAt: new Date().toISOString(),
      prompt: 'What did I notice, try, and want to change next?', note
    }, ...current.reflections] }));
    setReflection('');
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-slate-900 to-slate-950 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">My development</p>
              <h4 className="mt-2 font-display text-2xl font-black text-white">Turn learning into better coaching.</h4>
              <p className="mt-2 max-w-xl text-xs leading-6 text-slate-300">Build a practical plan, set small pitch-side goals, and reflect after sessions. Your progress is private to this browser.</p>
            </div>
            <div className="grid size-16 shrink-0 place-items-center rounded-full border-4 border-amber-400/30 bg-slate-950 text-lg font-black text-amber-300" aria-label={`${progressPercent}% of learning goals complete`}>
              {progressPercent}%
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span>{record.plans.length} plans</span><span className="size-1 rounded-full bg-slate-600" /><span>{progress.completed} of {progress.total} goals complete</span>
          </div>
        </section>

        <aside className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <ShieldCheck className="text-emerald-300" size={22} aria-hidden="true" />
          <h4 className="mt-3 text-sm font-black text-white">Learning is not a licence</h4>
          <p className="mt-2 text-xs leading-6 text-slate-300">Dumala plans, reading, and reflections are personal development records. They do not award, verify, renew, or replace PFF or AFC credentials.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-slate-950/50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-200">
            <Award size={13} aria-hidden="true" /> Official credentials stay external
          </div>
        </aside>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-5">
          <div className="flex items-center gap-2"><Flag size={17} className="text-amber-300" /><h4 className="font-display text-base font-black text-white">Learning plans & goals</h4></div>
          <form onSubmit={addPlan} className="mt-4 grid gap-2 sm:grid-cols-[1fr_150px_auto]">
            <input value={planTitle} onChange={event => setPlanTitle(event.target.value)} placeholder="e.g. Improve session design" aria-label="Learning plan title" className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white outline-none focus:border-amber-400" />
            <select value={planFocus} onChange={event => setPlanFocus(event.target.value)} aria-label="Learning plan focus" className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white outline-none focus:border-amber-400">
              {['Session planning', 'Tactics', 'Player development', 'Conditioning', 'Leadership', 'Safeguarding', 'First aid', 'Laws of the Game'].map(focus => <option key={focus}>{focus}</option>)}
            </select>
            <button type="submit" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3 text-[10px] font-black uppercase tracking-widest text-slate-950 hover:bg-amber-300"><CirclePlus size={14} /> Add plan</button>
          </form>
          <div className="mt-4 space-y-3">
            {record.plans.map(plan => (
              <article key={plan.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-start justify-between gap-3"><div><span className="text-[9px] font-black uppercase tracking-widest text-amber-300">{plan.focus}</span><h5 className="mt-1 text-sm font-bold text-white">{plan.title}</h5></div><button type="button" aria-label={`Delete ${plan.title}`} onClick={() => setRecord(current => ({ ...current, plans: current.plans.filter(item => item.id !== plan.id) }))} className="rounded-md p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={14} /></button></div>
                <ul className="mt-3 space-y-2">
                  {plan.goals.map(goal => <li key={goal.id}><label className="flex cursor-pointer items-start gap-2 text-xs text-slate-300"><input type="checkbox" checked={goal.completed} onChange={() => setRecord(current => ({ ...current, plans: current.plans.map(item => item.id === plan.id ? { ...item, goals: item.goals.map(candidate => candidate.id === goal.id ? { ...candidate, completed: !candidate.completed } : candidate) } : item) }))} className="mt-0.5 accent-amber-400" /><span className={goal.completed ? 'text-slate-500 line-through' : ''}>{goal.title}</span></label></li>)}
                </ul>
                <div className="mt-3 flex gap-2"><input value={goalDrafts[plan.id] ?? ''} onChange={event => setGoalDrafts(current => ({ ...current, [plan.id]: event.target.value }))} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addGoal(plan.id); } }} placeholder="Add a small, observable goal" aria-label={`Add a goal to ${plan.title}`} className="h-9 min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-white outline-none focus:border-amber-400" /><button type="button" onClick={() => addGoal(plan.id)} className="rounded-lg border border-slate-700 px-3 text-[10px] font-black uppercase text-slate-300 hover:border-amber-400 hover:text-amber-300">Add</button></div>
              </article>
            ))}
            {!record.plans.length && <div className="rounded-xl border border-dashed border-slate-700 p-7 text-center text-xs text-slate-400">Start with one coaching challenge you want to improve this month.</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-5">
          <div className="flex items-center gap-2"><NotebookPen size={17} className="text-sky-300" /><h4 className="font-display text-base font-black text-white">Reflection journal</h4></div>
          <p className="mt-2 text-xs leading-5 text-slate-400">What did I notice, try, and want to change next?</p>
          <form onSubmit={saveReflection} className="mt-3">
            <textarea value={reflection} onChange={event => setReflection(event.target.value)} rows={4} placeholder="Capture one honest observation from training or match day…" aria-label="New coaching reflection" className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs leading-6 text-white outline-none placeholder:text-slate-600 focus:border-sky-400" />
            <button type="submit" className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-sky-400 px-3 text-[10px] font-black uppercase tracking-widest text-slate-950 hover:bg-sky-300"><Check size={13} /> Save reflection</button>
          </form>
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {record.reflections.map(entry => <article key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><time className="text-[9px] font-black uppercase tracking-widest text-slate-500">{new Date(entry.createdAt).toLocaleDateString()}</time><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-300">{entry.note}</p></article>)}
            {!record.reflections.length && <p className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-xs text-slate-400">Your private reflection history will appear here.</p>}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-5">
        <div className="flex items-center gap-2"><Route size={18} className="text-orange-300" /><h4 className="font-display text-base font-black text-white">Practical learning pathway</h4></div>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400">These are Dumala development lanes—not a licence ladder. PFF and its regional associations publish course availability and entry requirements; always confirm the current official route before applying.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{COACH_EDUCATION_PATHWAYS.map((pathway, index) => <article key={pathway.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-300">Lane {String(index + 1).padStart(2, '0')}</span><h5 className="mt-2 text-sm font-bold text-white">{pathway.title}</h5><p className="mt-1 text-[11px] leading-5 text-slate-400">{pathway.purpose}</p><p className="mt-3 border-t border-slate-800 pt-3 text-[10px] leading-4 text-slate-300"><strong className="text-orange-200">Next:</strong> {pathway.nextAction}</p></article>)}</div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-5">
        <div className="flex items-center gap-2"><BookMarked size={17} className="text-emerald-300" /><h4 className="font-display text-base font-black text-white">Official resource directory</h4></div>
        <p className="mt-2 text-xs leading-5 text-slate-400">Verified starting points from football governing bodies. Course availability and eligibility can change—confirm details with the publisher.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {OFFICIAL_COACHING_RESOURCES.map(resource => <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="group rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-emerald-400/50 hover:bg-emerald-400/5"><div className="flex items-center justify-between"><span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">{resource.publisher} · {resource.kind}</span><ExternalLink size={13} className="text-slate-600 group-hover:text-emerald-300" /></div><h5 className="mt-3 text-sm font-bold text-white">{resource.title}</h5><p className="mt-1 text-[11px] leading-5 text-slate-400">{resource.description}</p><p className="mt-3 text-[9px] uppercase tracking-widest text-slate-600">Link checked {resource.lastVerified}</p></a>)}
        </div>
      </section>

      <CoachCredentialsPortfolio record={record} onChange={setRecord} />
    </div>
  );
};
