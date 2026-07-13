import React, { FormEvent, useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import type { CloudRuntime } from '../cloud/runtime';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface RequestLeagueAccessFormProps {
  runtime?: CloudRuntime;
}

// Public "Request League Access" waitlist. There is no open League signup: an
// owner submits this form and a Dumala admin provisions the account and grants
// the league entitlement. Works for signed-out visitors and signed-in coaches.
const RequestLeagueAccessForm = ({ runtime: runtimeOverride }: RequestLeagueAccessFormProps) => {
  const liveRuntime = useCloudRuntime();
  const runtime = runtimeOverride ?? liveRuntime;
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  if (!runtime.enabled) {
    return (
      <p className="rounded-lg border border-slate-700 bg-[#050b14] px-4 py-3 text-sm text-slate-300">
        League access requests need a cloud connection. Please try again from an online device.
      </p>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('sending');
    setFeedback('');
    try {
      await runtime.dataAccess.identity.requestLeagueAccess({
        contactName,
        contactEmail,
        organization,
        leagueName,
        location,
        message
      });
      setStatus('sent');
      setFeedback('Thanks — your request is in. A Dumala admin will review it and set up your League account.');
    } catch (error) {
      setStatus('error');
      setFeedback(error instanceof Error ? error.message : 'Could not submit your request. Please try again.');
    }
  };

  if (status === 'sent') {
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-6 text-emerald-100">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
          <CheckCircle2 size={18} /> Request received
        </div>
        <p className="mt-2 text-sm leading-relaxed text-emerald-200/90">{feedback}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Request League access">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="league-contact-name" className="text-slate-200">Your name</Label>
          <Input
            id="league-contact-name"
            required
            value={contactName}
            onChange={event => setContactName(event.target.value)}
            placeholder="Ada Owner"
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="league-contact-email" className="text-slate-200">Email</Label>
          <Input
            id="league-contact-email"
            type="email"
            required
            value={contactEmail}
            onChange={event => setContactEmail(event.target.value)}
            placeholder="owner@example.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="league-org" className="text-slate-200">Organization <span className="text-slate-500">(optional)</span></Label>
          <Input id="league-org" value={organization} onChange={event => setOrganization(event.target.value)} placeholder="Metro Football" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="league-name" className="text-slate-200">League name <span className="text-slate-500">(optional)</span></Label>
          <Input id="league-name" value={leagueName} onChange={event => setLeagueName(event.target.value)} placeholder="Metro Youth League" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="league-location" className="text-slate-200">Location <span className="text-slate-500">(optional)</span></Label>
          <Input id="league-location" value={location} onChange={event => setLocation(event.target.value)} placeholder="Manila, Philippines" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="league-message" className="text-slate-200">Tell us about your league <span className="text-slate-500">(optional)</span></Label>
          <textarea
            id="league-message"
            value={message}
            onChange={event => setMessage(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Age groups, number of clubs, seasons per year…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {feedback && status === 'error' && (
        <p className="text-sm text-amber-400" role="alert">{feedback}</p>
      )}

      <Button type="submit" disabled={status === 'sending'} className="gap-2">
        {status === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Request League access
      </Button>
      <p className="text-xs text-slate-500">
        Submitting a request does not by itself unlock the app — an admin grants access. League access is free during the beta pilot.
      </p>
    </form>
  );
};

export default RequestLeagueAccessForm;
