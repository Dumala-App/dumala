import {FormEvent, useRef, useState} from 'react';
import {Bug, Lightbulb, MessageSquare, Send, X} from 'lucide-react';
import {useDialogAccessibility} from '../hooks/useDialogAccessibility';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import type { FeedbackCategory, FeedbackUrgency } from '../cloud/admin';

interface FeedbackModalProps {
  teamName: string;
  onClose: () => void;
}

interface FeedbackForm {
  category: string;
  area: string;
  subject: string;
  details: string;
  expectedBehavior: string;
  urgency: string;
  contactEmail: string;
}

const FEEDBACK_EMAIL = 'kleinski23@gmail.com';
const INITIAL_FORM: FeedbackForm = {
  category: 'Improvement',
  area: 'Dashboard',
  subject: '',
  details: '',
  expectedBehavior: '',
  urgency: 'Normal',
  contactEmail: '',
};

const feedbackControlClass = 'rounded-xl text-sm font-medium text-slate-800';
const feedbackLabelClass = 'space-y-1.5 text-xs normal-case tracking-normal text-slate-700';

const categoryMap: Record<string, FeedbackCategory> = {
  Improvement: 'improvement',
  Suggestion: 'suggestion',
  Bug: 'bug',
  'Usability issue': 'usability_issue',
  'Feature request': 'feature_request',
  Other: 'other'
};

const urgencyMap: Record<string, FeedbackUrgency> = {
  Low: 'low',
  Normal: 'normal',
  High: 'high',
  'Blocking my testing': 'blocking'
};

export default function FeedbackModal({teamName, onClose}: FeedbackModalProps) {
  const cloudRuntime = useCloudRuntime();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  useDialogAccessibility(dialogRef, true, onClose);

  const updateField = (field: keyof FeedbackForm, value: string) => {
    setForm(current => ({...current, [field]: value}));
  };

  const buildEmailBody = () => [
    `Category: ${form.category}`,
    `Area: ${form.area}`,
    `Urgency: ${form.urgency}`,
    `Team workspace: ${teamName}`,
    `Page: ${window.location.href}`,
    '',
    'Feedback details:',
    form.details,
    '',
    'Expected behavior or suggested outcome:',
    form.expectedBehavior || 'Not provided',
    '',
    `Contact email: ${form.contactEmail || 'Not provided'}`,
  ].join('\n');

  const openEmailFallback = () => {
    const subject = encodeURIComponent(`[Dumala ${form.category}] ${form.subject}`);
    const body = encodeURIComponent(buildEmailBody());
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('idle');
    setStatusMessage('');

    if (!navigator.onLine) {
      setStatus('error');
      setStatusMessage('Feedback needs an internet connection. Your form is still here, so reconnect and try again or open your email app.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      _subject: `[Dumala ${form.category}] ${form.subject}`,
      _template: 'table',
      _captcha: 'false',
      _honey: '',
      _replyto: form.contactEmail,
      category: form.category,
      affected_area: form.area,
      urgency: form.urgency,
      subject: form.subject,
      details: form.details,
      expected_behavior_or_suggestion: form.expectedBehavior || 'Not provided',
      tester_email: form.contactEmail || 'Not provided',
      team_workspace: teamName,
      page_url: window.location.href,
      browser: navigator.userAgent,
      submitted_at: new Date().toISOString(),
    };

    try {
      if (cloudRuntime.enabled) {
        const savedFeedback = await cloudRuntime.dataAccess.admin.createFeedback({
          category: categoryMap[form.category] ?? 'other',
          affectedArea: form.area,
          urgency: urgencyMap[form.urgency] ?? 'normal',
          subject: form.subject,
          details: form.details,
          expectedBehavior: form.expectedBehavior || null,
          contactEmail: form.contactEmail || null,
          pageUrl: window.location.href,
          browser: navigator.userAgent,
          teamWorkspace: teamName
        });
        void cloudRuntime.dataAccess.admin.recordUsageEvent({
          eventType: 'feedback_submitted',
          viewName: form.area,
          featureName: 'share_feedback',
          appVersion: '0.0.0',
          metadata: {
            feedbackId: savedFeedback.id,
            category: categoryMap[form.category] ?? 'other',
            urgency: urgencyMap[form.urgency] ?? 'normal',
            teamWorkspace: teamName
          }
        }).catch(() => undefined);
      } else {
        const response = await fetch(`https://formsubmit.co/ajax/${FEEDBACK_EMAIL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Feedback service rejected the submission.');
      }

      setStatus('success');
      setStatusMessage(cloudRuntime.enabled
        ? 'Feedback saved to the Dumala admin inbox. Thank you for helping improve the app.'
        : 'Feedback sent. Thank you for helping improve Dumala.'
      );
      setForm(INITIAL_FORM);
    } catch {
      setStatus('error');
      setStatusMessage('Automatic delivery was unavailable. Use the email button to send the same feedback from your email app.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-dialog-title"
    >
      <div ref={dialogRef} tabIndex={-1} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <MessageSquare size={19} />
            </div>
            <div>
              <h2 id="feedback-dialog-title" className="font-display text-lg font-black text-slate-900">
                Share feedback
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                Report a bug, suggest an improvement, or tell us what would make the app more useful. Submissions are sent to the app owner.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close feedback form"
          >
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs normal-case tracking-normal text-slate-700">Feedback type</Label>
              <Select
                value={form.category}
                onValueChange={value => updateField('category', value)}
              >
                <SelectTrigger className={feedbackControlClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Improvement">Improvement</SelectItem>
                  <SelectItem value="Suggestion">Suggestion</SelectItem>
                  <SelectItem value="Bug">Bug</SelectItem>
                  <SelectItem value="Usability issue">Usability issue</SelectItem>
                  <SelectItem value="Feature request">Feature request</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs normal-case tracking-normal text-slate-700">Affected area</Label>
              <Select
                value={form.area}
                onValueChange={value => updateField('area', value)}
              >
                <SelectTrigger className={feedbackControlClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dashboard">Dashboard</SelectItem>
                  <SelectItem value="Roster">Roster</SelectItem>
                  <SelectItem value="Tactics">Tactics</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Schedule">Schedule</SelectItem>
                  <SelectItem value="League">League</SelectItem>
                  <SelectItem value="Updates">Updates</SelectItem>
                  <SelectItem value="Backup and restore">Backup and restore</SelectItem>
                  <SelectItem value="Mobile experience">Mobile experience</SelectItem>
                  <SelectItem value="Entire app">Entire app</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Label className={cn('block', feedbackLabelClass)}>
            Short summary
            <Input
              required
              maxLength={120}
              value={form.subject}
              onChange={event => updateField('subject', event.target.value)}
              placeholder="Briefly describe the idea or problem"
              className={feedbackControlClass}
            />
          </Label>

          <Label className={cn('block', feedbackLabelClass)}>
            Detailed information
            <Textarea
              required
              minLength={10}
              rows={5}
              value={form.details}
              onChange={event => updateField('details', event.target.value)}
              placeholder="What happened? What were you trying to do? Include steps to reproduce a bug or explain why an improvement would help."
              className="min-h-32 resize-y rounded-xl text-sm font-medium leading-relaxed text-slate-800"
            />
          </Label>

          <Label className={cn('block', feedbackLabelClass)}>
            Expected behavior or suggested outcome
            <Textarea
              rows={3}
              value={form.expectedBehavior}
              onChange={event => updateField('expectedBehavior', event.target.value)}
              placeholder="Describe what you expected to happen or how you would improve it."
              className="min-h-24 resize-y rounded-xl text-sm font-medium leading-relaxed text-slate-800"
            />
          </Label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs normal-case tracking-normal text-slate-700">Urgency</Label>
              <Select
                value={form.urgency}
                onValueChange={value => updateField('urgency', value)}
              >
                <SelectTrigger className={feedbackControlClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Blocking my testing">Blocking my testing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Label className={feedbackLabelClass}>
              Your email (optional)
              <Input
                type="email"
                value={form.contactEmail}
                onChange={event => updateField('contactEmail', event.target.value)}
                placeholder="For follow-up questions"
                className={feedbackControlClass}
              />
            </Label>
          </div>

          <div className="grid gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs text-indigo-950 sm:grid-cols-2">
            <div className="flex gap-2">
              <Bug size={15} className="mt-0.5 shrink-0 text-indigo-600" />
              <span>Bug reports automatically include the page, browser, workspace name, and submission time.</span>
            </div>
            <div className="flex gap-2">
              <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-500" />
              <span>Do not include passwords, private medical details, or other sensitive information.</span>
            </div>
          </div>

          {status !== 'idle' && (
            <div
              role="status"
              className={`rounded-xl border px-4 py-3 text-xs font-bold ${
                status === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              {statusMessage}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            {status === 'error' && (
              <Button
                type="button"
                onClick={openEmailFallback}
                variant="outline"
                className="rounded-xl border-slate-200 bg-white text-xs font-black text-slate-700"
              >
                Open email app
              </Button>
            )}
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="rounded-xl text-xs font-black"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-5 text-xs font-black shadow-md hover:bg-indigo-500"
            >
              <Send size={14} />
              {isSubmitting ? 'Sending feedback...' : 'Send feedback'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
