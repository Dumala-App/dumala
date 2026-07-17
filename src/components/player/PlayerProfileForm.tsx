import React, { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, UserRound } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import { computeIsMinor, type ClubRosterPlayer, type PlayerProfile } from '../../cloud/player';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { apexCta, apexGhost, apexInput } from './playerTheme';

interface PlayerProfileFormProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  userId: string;
  linkedPlayer: ClubRosterPlayer | null;
}

const fieldClass = 'space-y-1.5';
const labelClass = 'text-slate-200';

const PlayerProfileForm = ({ runtime, userId, linkedPlayer }: PlayerProfileFormProps) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [position, setPosition] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bio, setBio] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    runtime.dataAccess.player
      .getMyProfile(userId)
      .then(loaded => {
        if (!active) return;
        setProfile(loaded);
        if (loaded) {
          setDisplayName(loaded.display_name ?? '');
          setDateOfBirth(loaded.date_of_birth ?? '');
          setPosition(loaded.position ?? '');
          setHeight(loaded.height != null ? String(loaded.height) : '');
          setWeight(loaded.weight != null ? String(loaded.weight) : '');
          setBio(loaded.bio ?? '');
          setGuardianName(loaded.guardian_name ?? '');
          setGuardianEmail(loaded.guardian_email ?? '');
          setGuardianRelationship(loaded.guardian_relationship ?? '');
        }
      })
      .catch(error => {
        if (active) setMessage(error instanceof Error ? error.message : 'Could not load your profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [runtime, userId]);

  useEffect(() => {
    if (!linkedPlayer) return;
    setDisplayName(current => current || linkedPlayer.name || '');
    setDateOfBirth(current => current || linkedPlayer.date_of_birth || '');
    setPosition(current => current || linkedPlayer.position || '');
    setHeight(current => current || (linkedPlayer.height != null ? String(linkedPlayer.height) : ''));
    setWeight(current => current || (linkedPlayer.weight != null ? String(linkedPlayer.weight) : ''));
    setBio(current => current || linkedPlayer.bio || '');
  }, [linkedPlayer]);

  const isMinor = computeIsMinor(dateOfBirth || null);
  const consentState = profile?.guardian_consent_state ?? 'not_required';
  const consentGranted = consentState === 'granted';
  const consentPending = consentState === 'pending';

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('saving');
    setMessage('');
    try {
      const saved = await runtime.dataAccess.player.upsertMyProfile(userId, {
        displayName,
        dateOfBirth: dateOfBirth || null,
        position,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        bio
      });
      setProfile(saved);
      setStatus('saved');
      setMessage('Profile saved.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not save your profile.');
    }
  };

  const handleConsent = async () => {
    setStatus('saving');
    setMessage('');
    try {
      const state = await runtime.dataAccess.player.setGuardianConsent({
        guardianName,
        guardianEmail: guardianEmail || null,
        guardianRelationship: guardianRelationship || null
      });
      setProfile(current => (current ? {
        ...current,
        guardian_name: guardianName,
        guardian_email: guardianEmail || null,
        guardian_relationship: guardianRelationship || null,
        guardian_consent_state: state
      } : current));
      setStatus('saved');
      setMessage(state === 'granted'
        ? 'Guardian consent verified.'
        : 'Guardian details saved. Consent is pending guardian or club verification.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not save guardian details.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#152031]/80 px-5 py-4 text-sm text-[#c6c6cd]">
        <Loader2 size={16} className="animate-spin" /> Loading your profile…
      </div>
    );
  }

  return (
    <section className="apex-card rounded-xl border border-white/[0.06] p-5">
      <div className="mb-4 flex items-center gap-2 text-[#d8e3fb]">
        <UserRound size={18} className="text-[#dce7f8]" />
        <h2 className="font-player-display text-[13px] font-semibold uppercase tracking-widest text-[#d8e3fb]">Your profile</h2>
      </div>
      {linkedPlayer && (
        <p className="mb-4 rounded-lg border border-[#b9c8de]/20 bg-[#b9c8de]/[0.06] px-3 py-2 text-xs leading-5 text-[#c6c6cd]/80">
          Coach-synced roster details have filled any empty fields. You can still update your personal profile notes.
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-4" aria-label="Player profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={fieldClass}>
            <Label htmlFor="pp-name" className={labelClass}>Display name</Label>
            <Input id="pp-name" className={apexInput} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className={fieldClass}>
            <Label htmlFor="pp-dob" className={labelClass}>Date of birth</Label>
            <Input id="pp-dob" className={apexInput} type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
          </div>
          <div className={fieldClass}>
            <Label htmlFor="pp-position" className={labelClass}>Position</Label>
            <Input id="pp-position" className={apexInput} value={position} onChange={e => setPosition(e.target.value)} placeholder="ST, CM, GK…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={fieldClass}>
              <Label htmlFor="pp-height" className={labelClass}>Height (cm)</Label>
              <Input id="pp-height" className={apexInput} type="number" min={0} value={height} onChange={e => setHeight(e.target.value)} />
            </div>
            <div className={fieldClass}>
              <Label htmlFor="pp-weight" className={labelClass}>Weight (kg)</Label>
              <Input id="pp-weight" className={apexInput} type="number" min={0} value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
          </div>
          <div className={`${fieldClass} sm:col-span-2`}>
            <Label htmlFor="pp-bio" className={labelClass}>About you <span className="text-[#c6c6cd]/50">(optional)</span></Label>
            <textarea
              id="pp-bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={2}
              maxLength={1000}
              className={apexInput}
            />
          </div>
        </div>

        <button type="submit" disabled={status === 'saving'} className={`${apexCta} inline-flex items-center gap-2 px-5 py-3`}>
          {status === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Save profile
        </button>
      </form>

      {isMinor && (
        <div className="mt-5 rounded-lg border border-amber-400/25 bg-amber-400/10 p-4">
          <div className="flex items-center gap-2 text-amber-100">
            <ShieldCheck size={16} />
            <h3 className="text-sm font-black uppercase tracking-wide">Guardian consent</h3>
            {consentGranted && (
              <span className="ml-auto rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold text-emerald-100">Verified</span>
            )}
            {!consentGranted && consentPending && (
              <span className="ml-auto rounded-full border border-amber-200/40 bg-amber-200/10 px-2 py-0.5 text-[11px] font-bold text-amber-100">Pending</span>
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-amber-100/90">
            Because you're under 18, guardian details must be verified before you can join a team or share activity.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className={fieldClass}>
              <Label htmlFor="pp-guardian-name" className={labelClass}>Guardian name</Label>
              <Input id="pp-guardian-name" className={apexInput} value={guardianName} onChange={e => setGuardianName(e.target.value)} />
            </div>
            <div className={fieldClass}>
              <Label htmlFor="pp-guardian-email" className={labelClass}>Guardian email</Label>
              <Input id="pp-guardian-email" className={apexInput} type="email" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} />
            </div>
            <div className={fieldClass}>
              <Label htmlFor="pp-guardian-rel" className={labelClass}>Relationship</Label>
              <Input id="pp-guardian-rel" className={apexInput} value={guardianRelationship} onChange={e => setGuardianRelationship(e.target.value)} placeholder="Mother, Father…" />
            </div>
          </div>
          <button
            type="button"
            className={`${apexGhost} mt-3 inline-flex items-center gap-2 px-4 py-2.5 font-player-mono text-[11px] font-bold uppercase tracking-wider disabled:opacity-40`}
            disabled={status === 'saving' || consentGranted}
            onClick={() => void handleConsent()}
          >
            {status === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {consentGranted ? 'Consent verified' : 'Save guardian details'}
          </button>
        </div>
      )}

      {message && (
        <p className={`mt-3 text-sm ${status === 'error' ? 'text-amber-400' : 'text-[#9fe8c8]'}`} role="status">{message}</p>
      )}
    </section>
  );
};

export default PlayerProfileForm;
