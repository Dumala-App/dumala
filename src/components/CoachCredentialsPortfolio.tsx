import React, { useMemo, useState } from 'react';
import { AlertTriangle, Award, CalendarClock, Download, Eye, EyeOff, FileBadge, Plus, ShieldAlert, Trash2, UserRoundCheck } from 'lucide-react';
import { credentialRenewalState, publicPortfolioSnapshot, type CoachLearningRecord } from '../coachEducation/coachEducation';

type Props = {
  record: CoachLearningRecord;
  onChange: React.Dispatch<React.SetStateAction<CoachLearningRecord>>;
};

const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const STATUS_STYLE = {
  current: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  'due-soon': 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  expired: 'border-red-400/20 bg-red-400/10 text-red-200',
  'no-expiry': 'border-slate-700 bg-slate-800 text-slate-300'
} as const;

export const CoachCredentialsPortfolio = ({ record, onChange }: Props) => {
  const [qualification, setQualification] = useState('');
  const [issuer, setIssuer] = useState('Philippine Football Federation');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [issuedOn, setIssuedOn] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const portfolioPreview = useMemo(() => publicPortfolioSnapshot(record), [record]);
  const renewalCount = record.credentials.filter(item => ['due-soon', 'expired'].includes(credentialRenewalState(item))).length;

  const addCredential = (event: React.FormEvent) => {
    event.preventDefault();
    if (!qualification.trim() || !issuer.trim()) return;
    onChange(current => ({ ...current, credentials: [...current.credentials, {
      id: id(), qualification: qualification.trim(), issuer: issuer.trim(), licenceNumber: licenceNumber.trim(),
      issuedOn, expiresOn, documentName: documentName.trim(), verificationState: 'self-recorded', showInPortfolio: false
    }] }));
    setQualification(''); setLicenceNumber(''); setIssuedOn(''); setExpiresOn(''); setDocumentName('');
  };

  const updatePortfolio = (patch: Partial<CoachLearningRecord['portfolio']>) => onChange(current => ({ ...current, portfolio: { ...current.portfolio, ...patch } }));

  const exportPortfolio = () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), portfolio: publicPortfolioSnapshot(record) }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'dumala-coach-portfolio.json'; anchor.click();
    URL.revokeObjectURL(url);
  };

  return <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
    <section className="rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><FileBadge size={18} className="text-violet-300" /><h4 className="font-display text-base font-black text-white">Qualifications & renewal</h4></div><p className="mt-2 text-xs leading-5 text-slate-400">Keep a private reference of credentials issued by recognized organizations.</p></div>{renewalCount > 0 && <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-200"><CalendarClock size={13} />{renewalCount} need attention</span>}</div>
      <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-400/5 p-3 text-[11px] leading-5 text-violet-100"><ShieldAlert size={15} className="mr-2 inline" />Every entry is labelled <strong>self-recorded</strong>. Dumala cannot verify a licence; confirmation remains with its issuer.</div>
      <form onSubmit={addCredential} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Qualification<input required value={qualification} onChange={event => setQualification(event.target.value)} placeholder="e.g. PFF C Diploma" className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs normal-case tracking-normal text-white outline-none focus:border-violet-400" /></label>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Issuer<input required value={issuer} onChange={event => setIssuer(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs normal-case tracking-normal text-white outline-none focus:border-violet-400" /></label>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Licence number<input value={licenceNumber} onChange={event => setLicenceNumber(event.target.value)} placeholder="Optional" className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs normal-case tracking-normal text-white outline-none focus:border-violet-400" /></label>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Document reference<input value={documentName} onChange={event => setDocumentName(event.target.value)} placeholder="File name or reference only" className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs normal-case tracking-normal text-white outline-none focus:border-violet-400" /></label>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Issued on<input type="date" value={issuedOn} onChange={event => setIssuedOn(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs normal-case tracking-normal text-white outline-none focus:border-violet-400" /></label>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expires on<input type="date" value={expiresOn} min={issuedOn || undefined} onChange={event => setExpiresOn(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs normal-case tracking-normal text-white outline-none focus:border-violet-400" /></label>
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-400 px-4 text-[10px] font-black uppercase tracking-widest text-slate-950 hover:bg-violet-300 sm:col-span-2"><Plus size={14} />Add self-recorded credential</button>
      </form>
      <div className="mt-4 space-y-2">{record.credentials.map(credential => { const state = credentialRenewalState(credential); return <article key={credential.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h5 className="text-sm font-bold text-white">{credential.qualification}</h5><span className={`rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${STATUS_STYLE[state]}`}>{state.replace('-', ' ')}</span></div><p className="mt-1 text-[11px] text-slate-400">{credential.issuer}{credential.licenceNumber ? ` · ${credential.licenceNumber}` : ''}</p><p className="mt-2 text-[10px] text-slate-500">Issued {credential.issuedOn || 'not recorded'} · Expires {credential.expiresOn || 'not recorded'} · Self-recorded</p>{credential.documentName && <p className="mt-1 text-[10px] text-slate-500">Document reference: {credential.documentName}</p>}</div><button type="button" aria-label={`Delete ${credential.qualification}`} onClick={() => onChange(current => ({ ...current, credentials: current.credentials.filter(item => item.id !== credential.id) }))} className="rounded-md p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={14} /></button></div><label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-slate-800 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400"><input type="checkbox" checked={credential.showInPortfolio} onChange={() => onChange(current => ({ ...current, credentials: current.credentials.map(item => item.id === credential.id ? { ...item, showInPortfolio: !item.showInPortfolio } : item) }))} className="accent-violet-400" />Include in public portfolio preview</label></article>; })}{!record.credentials.length && <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-xs text-slate-400">No qualifications recorded. This area is optional and private by default.</div>}</div>
    </section>

    <section className="rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-5">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><UserRoundCheck size={18} className="text-cyan-300" /><h4 className="font-display text-base font-black text-white">Coach portfolio</h4></div><button type="button" onClick={() => updatePortfolio({ isPublic: !record.portfolio.isPublic })} aria-pressed={record.portfolio.isPublic} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-black uppercase tracking-widest ${record.portfolio.isPublic ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' : 'border-slate-700 text-slate-400'}`}>{record.portfolio.isPublic ? <Eye size={13} /> : <EyeOff size={13} />}{record.portfolio.isPublic ? 'Preview public' : 'Private'}</button></div>
      <p className="mt-2 text-xs leading-5 text-slate-400">Choose exactly what a future public coach profile may show. This release creates a local preview only—it does not upload or publish your data.</p>
      <div className="mt-4 space-y-3">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Display name<input value={record.portfolio.displayName} onChange={event => updatePortfolio({ displayName: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs normal-case tracking-normal text-white outline-none focus:border-cyan-400" /></label>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Headline<input value={record.portfolio.headline} onChange={event => updatePortfolio({ headline: event.target.value })} placeholder="Grassroots coach · Youth development" className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs normal-case tracking-normal text-white outline-none focus:border-cyan-400" /></label>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Short bio<textarea value={record.portfolio.bio} onChange={event => updatePortfolio({ bio: event.target.value })} rows={3} maxLength={500} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs normal-case leading-5 tracking-normal text-white outline-none focus:border-cyan-400" /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Age groups coached<input value={record.portfolio.ageGroups} onChange={event => updatePortfolio({ ageGroups: event.target.value })} placeholder="e.g. U10–U16" className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs normal-case tracking-normal text-white outline-none focus:border-cyan-400" /></label><label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Experience<input value={record.portfolio.experience} onChange={event => updatePortfolio({ experience: event.target.value })} placeholder="e.g. 5 seasons" className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs normal-case tracking-normal text-white outline-none focus:border-cyan-400" /></label></div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Achievements<textarea value={record.portfolio.achievements.join('\n')} onChange={event => updatePortfolio({ achievements: event.target.value.split('\n').map(value => value.trim()).filter(Boolean) })} rows={3} placeholder="One achievement per line" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs normal-case leading-5 tracking-normal text-white outline-none focus:border-cyan-400" /></label>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Specialties<div className="mt-1 flex gap-2"><input value={specialty} onChange={event => setSpecialty(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); const value = specialty.trim(); if (value && !record.portfolio.specialties.includes(value)) updatePortfolio({ specialties: [...record.portfolio.specialties, value] }); setSpecialty(''); } }} placeholder="Add a specialty" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs normal-case tracking-normal text-white outline-none focus:border-cyan-400" /><button type="button" onClick={() => { const value = specialty.trim(); if (value && !record.portfolio.specialties.includes(value)) updatePortfolio({ specialties: [...record.portfolio.specialties, value] }); setSpecialty(''); }} className="rounded-lg border border-slate-700 px-3 text-xs text-slate-300 hover:border-cyan-400">Add</button></div></label>
        <div className="flex flex-wrap gap-2">{record.portfolio.specialties.map(item => <button key={item} type="button" onClick={() => updatePortfolio({ specialties: record.portfolio.specialties.filter(value => value !== item) })} title="Remove specialty" className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-[10px] text-cyan-200">{item} ×</button>)}</div>
      </div>
      <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-slate-950 p-5"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">Public portfolio preview</p>{record.portfolio.isPublic ? <><h5 className="mt-3 font-display text-xl font-black text-white">{portfolioPreview.displayName || 'Your display name'}</h5><p className="mt-1 text-xs font-bold text-cyan-200">{portfolioPreview.headline || 'Your coaching headline'}</p><p className="mt-2 text-[10px] text-slate-400">{portfolioPreview.ageGroups || 'Age groups not added'} · {portfolioPreview.experience || 'Experience not added'}</p><p className="mt-3 text-xs leading-5 text-slate-300">{portfolioPreview.bio || 'Add a short coaching biography.'}</p><div className="mt-3 flex flex-wrap gap-1.5">{portfolioPreview.specialties.map(item => <span key={item} className="rounded-full bg-slate-800 px-2.5 py-1 text-[9px] text-slate-300">{item}</span>)}</div>{portfolioPreview.achievements.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-4 text-[11px] text-slate-300">{portfolioPreview.achievements.map(item => <li key={item}>{item}</li>)}</ul>}<div className="mt-4 border-t border-slate-800 pt-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Selected self-recorded qualifications</p>{portfolioPreview.credentials.map(item => <p key={item.id} className="mt-2 text-[11px] text-slate-300"><Award size={12} className="mr-1.5 inline text-violet-300" />{item.qualification} · {item.issuer} <span className="text-slate-500">(self-recorded)</span></p>)}</div></> : <div className="mt-4 flex items-center gap-3 text-xs text-slate-400"><EyeOff size={18} />Portfolio preview is private.</div>}</div>
      <button type="button" onClick={exportPortfolio} disabled={!record.portfolio.isPublic} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-cyan-400/30 px-3 text-[10px] font-black uppercase tracking-widest text-cyan-200 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40"><Download size={13} />Download public portfolio data</button>
      {!record.portfolio.isPublic && <div className="mt-3 flex gap-2 text-[10px] leading-4 text-amber-200"><AlertTriangle size={14} className="shrink-0" />Nothing is shared by default. Public hosting is not enabled in this release.</div>}
    </section>
  </div>;
};
