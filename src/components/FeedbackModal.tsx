import {FormEvent, useState} from 'react';
import {Bug, Lightbulb, MessageSquare, Send, X} from 'lucide-react';

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

export default function FeedbackModal({teamName, onClose}: FeedbackModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

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
    const subject = encodeURIComponent(`[Stack Team Manager ${form.category}] ${form.subject}`);
    const body = encodeURIComponent(buildEmailBody());
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    setStatusMessage('');

    const payload = {
      _subject: `[Stack Team Manager ${form.category}] ${form.subject}`,
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
      const response = await fetch(`https://formsubmit.co/ajax/${FEEDBACK_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Feedback service rejected the submission.');

      setStatus('success');
      setStatusMessage('Feedback sent. Thank you for helping improve Stack Team Manager.');
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
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
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
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close feedback form"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              Feedback type
              <select
                value={form.category}
                onChange={event => updateField('category', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option>Improvement</option>
                <option>Suggestion</option>
                <option>Bug</option>
                <option>Usability issue</option>
                <option>Feature request</option>
                <option>Other</option>
              </select>
            </label>

            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              Affected area
              <select
                value={form.area}
                onChange={event => updateField('area', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option>Dashboard</option>
                <option>Roster</option>
                <option>Tactics</option>
                <option>Training</option>
                <option>Schedule</option>
                <option>League</option>
                <option>Updates</option>
                <option>Backup and restore</option>
                <option>Mobile experience</option>
                <option>Entire app</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5 text-xs font-bold text-slate-700">
            Short summary
            <input
              required
              maxLength={120}
              value={form.subject}
              onChange={event => updateField('subject', event.target.value)}
              placeholder="Briefly describe the idea or problem"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block space-y-1.5 text-xs font-bold text-slate-700">
            Detailed information
            <textarea
              required
              minLength={10}
              rows={5}
              value={form.details}
              onChange={event => updateField('details', event.target.value)}
              placeholder="What happened? What were you trying to do? Include steps to reproduce a bug or explain why an improvement would help."
              className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block space-y-1.5 text-xs font-bold text-slate-700">
            Expected behavior or suggested outcome
            <textarea
              rows={3}
              value={form.expectedBehavior}
              onChange={event => updateField('expectedBehavior', event.target.value)}
              placeholder="Describe what you expected to happen or how you would improve it."
              className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              Urgency
              <select
                value={form.urgency}
                onChange={event => updateField('urgency', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option>Low</option>
                <option>Normal</option>
                <option>High</option>
                <option>Blocking my testing</option>
              </select>
            </label>

            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              Your email (optional)
              <input
                type="email"
                value={form.contactEmail}
                onChange={event => updateField('contactEmail', event.target.value)}
                placeholder="For follow-up questions"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
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
              <button
                type="button"
                onClick={openEmailFallback}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
              >
                Open email app
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={14} />
              {isSubmitting ? 'Sending feedback...' : 'Send feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
