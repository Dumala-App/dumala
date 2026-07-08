import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, FlaskConical, Loader2, Send, ShieldCheck } from 'lucide-react';
import type { AssessmentSession, Player } from '../types';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import { deriveBetaDrillResults } from '../fprds/betaDrillResults';
import { ROLE_LABELS } from '../fprds/weights';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

interface FprdsBetaSubmissionDialogProps {
  open: boolean;
  player: Player;
  session: AssessmentSession;
  onOpenChange: (open: boolean) => void;
  onSubmitted: (assessmentId: string) => void;
}

type Availability = 'loading' | 'ready' | 'submitted' | 'unavailable' | 'error';
type Surface = 'grass' | 'artificial' | 'indoor' | 'other';
type TimingMethod = 'manual' | 'electronic' | 'mixed';
type Conditions = 'dry' | 'wet' | 'indoor' | 'unknown';

const CONSENT_VERSION = 'fprds-beta-consent-1';

const calculateAgeAtAssessment = (dateOfBirth: string | undefined, assessmentDate: string) => {
  if (!dateOfBirth) return null;
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  const assessed = new Date(`${assessmentDate}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(assessed.getTime())) return null;
  let age = assessed.getFullYear() - birth.getFullYear();
  const beforeBirthday = assessed.getMonth() < birth.getMonth()
    || (assessed.getMonth() === birth.getMonth() && assessed.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
};

const getErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) return 'The beta submission could not be completed.';
  if (error.message.includes('Sign in')) return 'Sign in to your Dumala Cloud account before sharing beta results.';
  if (error.message.includes('duplicate') || error.message.includes('23505')) return 'This assessment has already been submitted.';
  return error.message;
};

export default function FprdsBetaSubmissionDialog({ open, player, session, onOpenChange, onSubmitted }: FprdsBetaSubmissionDialogProps) {
  const runtime = useCloudRuntime();
  const [availability, setAvailability] = useState<Availability>('loading');
  const [surface, setSurface] = useState<Surface>('grass');
  const [timingMethod, setTimingMethod] = useState<TimingMethod>('manual');
  const [conditions, setConditions] = useState<Conditions>('dry');
  const [confidence, setConfidence] = useState('3');
  const [notes, setNotes] = useState('');
  const [consented, setConsented] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const playerAge = useMemo(() => calculateAgeAtAssessment(player.dateOfBirth, session.assessmentDate), [player.dateOfBirth, session.assessmentDate]);

  useEffect(() => {
    if (!open) return;
    setStatusMessage('');
    setConsented(false);
    if (!runtime.enabled) {
      setAvailability('unavailable');
      return;
    }

    let active = true;
    setAvailability('loading');
    void runtime.dataAccess.admin.findMyFprdsSubmission(session.id)
      .then(existing => {
        if (!active) return;
        setAvailability(existing ? 'submitted' : 'ready');
        if (existing) onSubmitted(session.id);
      })
      .catch(error => {
        if (!active) return;
        setAvailability('error');
        setStatusMessage(getErrorMessage(error));
      });
    return () => { active = false; };
  }, [onSubmitted, open, runtime, session.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!runtime.enabled || !consented || availability !== 'ready') return;
    setIsSubmitting(true);
    setStatusMessage('');
    try {
      await runtime.dataAccess.admin.createFprdsSubmission({
        assessmentId: session.id,
        playerId: session.playerId,
        playerAgeAtAssessment: playerAge,
        ageGroup: session.ageGroup,
        role: session.role,
        assessmentType: session.assessmentType,
        rawResults: session.rawResults,
        attributeScores: session.attributeScores,
        ovr: session.ovr,
        venueContext: { surface, timingMethod, conditions },
        coachConfidence: Number(confidence),
        coachNotes: notes.trim() || null,
        consentVersion: CONSENT_VERSION,
        benchmarkVersion: session.benchmarkVersion,
        drillResults: deriveBetaDrillResults(session)
      });
      setAvailability('submitted');
      setStatusMessage('Anonymized results were sent to the FPRDS beta review queue.');
      onSubmitted(session.id);
      void runtime.dataAccess.admin.recordUsageEvent({
        eventType: 'feature_used',
        viewName: 'assessments',
        featureName: 'fprds_beta_submission',
        metadata: { assessmentType: session.assessmentType, role: session.role, ageGroup: session.ageGroup }
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setStatusMessage(message);
      if (message.includes('already been submitted')) {
        setAvailability('submitted');
        onSubmitted(session.id);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700">
              <FlaskConical className="size-5" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle>Share FPRDS beta results</DialogTitle>
              <DialogDescription className="mt-1">Contribute this assessment to benchmark validation without sending the player&apos;s identity.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
            {([['Date', session.assessmentDate], ['Role', ROLE_LABELS[session.role]], ['Group', session.ageGroup], ['OVR', String(session.ovr)]] as const).map(([label, value]) => (
              <div key={label} className="bg-muted/40 px-3 py-2.5">
                <p className="text-[9px] font-black uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-extrabold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-950">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />
            <div>
              <p className="font-extrabold">Identity stays private</p>
              <p className="mt-1">Dumala sends a one-way anonymous reference, age cohort, drill values, calculated scores, and the test context below. It does not send name, shirt number, photo, date of birth, or team name.</p>
            </div>
          </div>

          {availability === 'loading' && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-4 text-sm font-semibold text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Checking submission status...
            </div>
          )}

          {availability === 'ready' && (
            <>
              <div>
                <h3 className="text-xs font-extrabold text-foreground">Testing context</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <SelectField id="fprds-surface" label="Surface" value={surface} onChange={value => setSurface(value as Surface)} options={[['grass', 'Grass'], ['artificial', 'Artificial'], ['indoor', 'Indoor'], ['other', 'Other']]} />
                  <SelectField id="fprds-timing" label="Timing method" value={timingMethod} onChange={value => setTimingMethod(value as TimingMethod)} options={[['manual', 'Manual stopwatch'], ['electronic', 'Electronic'], ['mixed', 'Mixed']]} />
                  <SelectField id="fprds-conditions" label="Conditions" value={conditions} onChange={value => setConditions(value as Conditions)} options={[['dry', 'Dry'], ['wet', 'Wet'], ['indoor', 'Indoor'], ['unknown', 'Unknown']]} />
                </div>
              </div>

              <SelectField id="fprds-confidence" label="Confidence in test consistency" value={confidence} onChange={setConfidence} options={[['1', '1 - Low confidence'], ['2', '2 - Some concerns'], ['3', '3 - Acceptable'], ['4', '4 - Consistent'], ['5', '5 - Highly controlled']]} />

              <div className="space-y-1.5">
                <Label htmlFor="fprds-beta-notes" className="normal-case tracking-normal">Review note (optional)</Label>
                <Textarea id="fprds-beta-notes" value={notes} onChange={event => setNotes(event.target.value)} maxLength={1000} rows={3} placeholder="Equipment variation, interruptions, or other test-quality context. Do not include names or private information." className="resize-y" />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 text-xs leading-relaxed text-foreground">
                <Checkbox checked={consented} onChange={event => setConsented(event.target.checked)} className="mt-0.5" />
                <span>I confirm I am authorized to share these anonymized assessment results for FPRDS beta benchmark analysis and product improvement.</span>
              </label>
            </>
          )}

          {(availability === 'submitted' || availability === 'unavailable' || availability === 'error') && (
            <div className={`rounded-lg border p-4 text-sm font-semibold ${availability === 'submitted' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`} role="status">
              {availability === 'submitted' && <CheckCircle2 className="mr-2 inline size-4" aria-hidden="true" />}
              {statusMessage || (availability === 'submitted' ? 'This assessment is already in the FPRDS beta review queue.' : availability === 'unavailable' ? 'Dumala Cloud must be enabled before beta results can be shared.' : 'Sign in to your Dumala Cloud account before sharing beta results.')}
            </div>
          )}

          <DialogFooter className="border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            {availability === 'ready' && (
              <Button type="submit" disabled={!consented || isSubmitting}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                {isSubmitting ? 'Submitting...' : 'Submit anonymized results'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SelectField({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="normal-case tracking-normal">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(([optionValue, optionLabel]) => <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
