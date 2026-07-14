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

export interface LeagueAccessFormInput {
  contactName?: string;
  contactEmail: string;
  organization?: string | null;
  leagueName?: string | null;
  location?: string | null;
  message?: string | null;
}

const deriveContactName = (input: LeagueAccessFormInput) => {
  const explicitName = input.contactName?.trim();
  if (explicitName) return explicitName;

  const emailName = input.contactEmail.split('@')[0]?.trim();
  return emailName && emailName.length >= 2 ? emailName : 'League Owner';
};

export const submitLeagueAccessRequest = (
  runtime: CloudRuntime,
  input: LeagueAccessFormInput
) => {
  if (!runtime.enabled) {
    throw new Error('League access requests need a cloud connection.');
  }

  return runtime.dataAccess.identity.requestLeagueAccess({
    contactName: deriveContactName(input),
    contactEmail: input.contactEmail,
    organization: input.organization,
    leagueName: input.leagueName,
    location: input.location,
    message: input.message
  });
};

const fieldClass = 'h-11 border-white/10 bg-[#07111f]/85 text-center text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-300/25';
const labelClass = 'text-xs font-bold text-slate-300';

// Public League Owner access request. There is no open League signup: the form
// creates a waitlist record for Dumala admins to review and provision.
const RequestLeagueAccessForm = ({ runtime: runtimeOverride }: RequestLeagueAccessFormProps) => {
  const liveRuntime = useCloudRuntime();
  const runtime = runtimeOverride ?? liveRuntime;
  const [contactEmail, setContactEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  if (!runtime.enabled) {
    return (
      <p className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
        Cloud connection required.
      </p>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('sending');
    setFeedback('');
    try {
      await submitLeagueAccessRequest(runtime, {
        contactEmail
      });
      setStatus('sent');
      setFeedback('You are on the League Owner access list.');
    } catch (error) {
      setStatus('error');
      setFeedback(error instanceof Error ? error.message : 'Could not submit your request.');
    }
  };

  if (status === 'sent') {
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-4 text-emerald-100">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
          <CheckCircle2 size={17} /> You are on the list
        </div>
        <p className="mt-1 text-sm leading-6 text-emerald-200/90">{feedback}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-label="Join League waitlist">
      <div className="space-y-1.5 text-center">
        <Label htmlFor="league-contact-email" className={labelClass}>Email</Label>
        <Input
          id="league-contact-email"
          type="email"
          required
          value={contactEmail}
          onChange={event => setContactEmail(event.target.value)}
          placeholder="owner@example.com"
          autoComplete="email"
          className={fieldClass}
        />
      </div>

      {feedback && status === 'error' && (
        <p className="text-sm text-amber-300" role="alert">{feedback}</p>
      )}

      <Button type="submit" disabled={status === 'sending'} className="mx-auto h-11 w-full max-w-[11rem] gap-2 rounded-xl bg-cyan-300 font-black text-slate-950 hover:bg-cyan-200">
        {status === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Join waitlist
      </Button>
    </form>
  );
};

export default RequestLeagueAccessForm;
