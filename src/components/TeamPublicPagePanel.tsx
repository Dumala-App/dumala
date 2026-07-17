import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Globe, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import {
  CloudTeamPageError,
  buildPublicTeamUrl,
  isValidTeamSlug,
  suggestTeamSlug,
  type ClubPublicPage
} from '../cloud/teamPage';
import { LocalImageUploadError, prepareLocalImageDataUrl } from '../images/localImageUpload';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

// Coach-facing settings for the public team page (#/t/<slug>). One compressed
// team photo, a headline, section toggles, and a publish switch. Everything is
// saved to club_public_pages in the coach's cloud workspace, so the panel asks
// for cloud sync when the workspace is local-only.

interface TeamPublicPagePanelProps {
  clubId?: string | null;
  teamName: string;
}

// Keep the single photo small: 1280px WebP under ~200 KB so even a full page of
// published teams stays gentle on database storage.
const TEAM_PHOTO_MAX_DIMENSION = 1280;
const TEAM_PHOTO_MAX_BYTES = 200 * 1024;

const glassPanelClass = 'rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl';
const glassInsetClass = 'rounded-xl border border-cyan-300/10 bg-[#0b1726]/72 text-slate-100 shadow-inner shadow-black/10 backdrop-blur-sm';
const glassFieldClass = '!border-cyan-300/10 !bg-[#0b1726]/85 !text-slate-100 placeholder:!text-slate-500';

const estimateDataUrlKb = (dataUrl: string) => Math.round((dataUrl.length * 3) / 4 / 1024);

type SectionKey = 'showRoster' | 'showStaff' | 'showLineup' | 'showResults';

const SECTION_TOGGLES: Array<{ key: SectionKey; label: string; hint: string }> = [
  { key: 'showRoster', label: 'Squad list', hint: 'Names, numbers, and positions only' },
  { key: 'showLineup', label: 'Starting lineup', hint: 'Latest formation from Tactics' },
  { key: 'showResults', label: 'Recent results', hint: 'Last 5 completed matches' },
  { key: 'showStaff', label: 'Coaching staff', hint: 'Names and roles only' }
];

const TeamPublicPagePanel = ({ clubId, teamName }: TeamPublicPagePanelProps) => {
  const runtime = useCloudRuntime();
  const teamPage = runtime.enabled && clubId ? runtime.dataAccess.teamPage : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [savedPage, setSavedPage] = useState<ClubPublicPage | null>(null);

  const [isPublic, setIsPublic] = useState(false);
  const [slug, setSlug] = useState('');
  const [headline, setHeadline] = useState('');
  const [teamPhoto, setTeamPhoto] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    showRoster: true,
    showStaff: true,
    showLineup: true,
    showResults: true
  });

  useEffect(() => {
    if (!teamPage || !clubId) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    teamPage.getSettings(clubId)
      .then(page => {
        if (!active) return;
        setSavedPage(page);
        if (page) {
          setIsPublic(page.is_public);
          setSlug(page.slug);
          setHeadline(page.headline ?? '');
          setTeamPhoto(page.team_photo);
          setSections({
            showRoster: page.show_roster,
            showStaff: page.show_staff,
            showLineup: page.show_lineup,
            showResults: page.show_results
          });
        } else {
          setSlug(suggestTeamSlug(teamName));
        }
      })
      .catch(() => {
        if (active) setMessage({ tone: 'error', text: 'The public page settings could not be loaded. Try again shortly.' });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [teamPage, clubId, teamName]);

  const normalizedSlug = slug.trim().toLowerCase();
  const slugValid = isValidTeamSlug(normalizedSlug);
  const publicUrl = useMemo(() => (slugValid ? buildPublicTeamUrl(normalizedSlug) : null), [slugValid, normalizedSlug]);

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setProcessingPhoto(true);
    try {
      const dataUrl = await prepareLocalImageDataUrl(file, {
        maxDimension: TEAM_PHOTO_MAX_DIMENSION,
        maxBytes: TEAM_PHOTO_MAX_BYTES,
        outputType: 'image/webp'
      });
      setTeamPhoto(dataUrl);
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof LocalImageUploadError ? error.message : 'That image could not be processed. Try a different photo.'
      });
    } finally {
      setProcessingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!teamPage || !clubId) return;
    setMessage(null);
    if (!slugValid) {
      setMessage({ tone: 'error', text: 'Links can use 3-32 lowercase letters, numbers, and hyphens (no leading or trailing hyphen).' });
      return;
    }
    setSaving(true);
    try {
      const page = await teamPage.saveSettings(clubId, {
        isPublic,
        slug: normalizedSlug,
        headline: headline.trim() || null,
        teamPhoto,
        ...sections
      });
      setSavedPage(page);
      setSlug(page.slug);
      setMessage({
        tone: 'success',
        text: page.is_public ? 'Saved. Your team page is live.' : 'Saved. Your team page stays private until you publish it.'
      });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof CloudTeamPageError ? error.message : 'The public page could not be saved. Try again shortly.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage({ tone: 'error', text: 'The link could not be copied. Copy it manually from the address shown.' });
    }
  };

  if (!runtime.phase6.teamPageEnabled) return null;

  if (!teamPage) {
    return (
      <div className={`${glassPanelClass} p-6`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/5 text-cyan-200"><Globe size={18} /></span>
          <div>
            <h3 className="text-sm font-black text-slate-100">Public team page</h3>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
              Share a public, read-only page for {teamName} at dumala.asia. This needs your workspace backed up to
              Dumala Cloud first — sign in and connect this workspace, then come back here to publish.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${glassPanelClass} flex items-center gap-2 p-6 text-sm text-slate-400`}>
        <Loader2 size={16} className="animate-spin" /> Loading public page settings…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`${glassPanelClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-300/25 bg-orange-300/10 text-orange-200"><Globe size={18} /></span>
            <div>
              <h3 className="text-sm font-black text-slate-100">Public team page</h3>
              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
                A lite, login-free showcase of your team anyone can open from one link. Nothing is public until you
                publish, and only showcase-safe details are shared — never contact info, notes, ratings, or payments.
              </p>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <span className={`text-xs font-bold ${isPublic ? 'text-emerald-300' : 'text-slate-400'}`}>{isPublic ? 'Published' : 'Private'}</span>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              aria-label="Publish the public team page"
              onClick={() => setIsPublic(current => !current)}
              className={`relative h-6 w-11 rounded-full border transition-colors ${isPublic ? 'border-emerald-300/40 bg-emerald-400/30' : 'border-cyan-300/15 bg-[#0b1726]'}`}
            >
              <span className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${isPublic ? 'left-[calc(100%-1.375rem)] bg-emerald-300' : 'left-0.5 bg-slate-500'}`} style={{ height: 18, width: 18 }} />
            </button>
          </label>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-page-slug" className="text-xs font-bold text-slate-300">Public link</Label>
              <div className="mt-1.5 flex items-center gap-0">
                <span className={`${glassInsetClass} rounded-r-none border-r-0 px-3 py-2 text-xs font-semibold text-slate-400`}>{typeof window !== 'undefined' ? window.location.host : 'dumala.asia'}/#/t/</span>
                <Input
                  id="team-page-slug"
                  value={slug}
                  onChange={event => setSlug(event.target.value.toLowerCase())}
                  placeholder="blue-eagles-fc"
                  className={`${glassFieldClass} rounded-l-none`}
                  maxLength={32}
                />
              </div>
              {!slugValid && slug.trim() !== '' && (
                <p className="mt-1.5 text-[11px] font-semibold text-orange-300">Use 3–32 lowercase letters, numbers, and hyphens (no leading or trailing hyphen).</p>
              )}
            </div>

            <div>
              <Label htmlFor="team-page-headline" className="text-xs font-bold text-slate-300">Headline <span className="font-normal text-slate-500">(optional)</span></Label>
              <Input
                id="team-page-headline"
                value={headline}
                onChange={event => setHeadline(event.target.value)}
                placeholder="Sunday league champions 2026"
                className={`${glassFieldClass} mt-1.5`}
                maxLength={160}
              />
            </div>

            <div className={`${glassInsetClass} space-y-2.5 p-4`}>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Sections on the page</p>
              {SECTION_TOGGLES.map(toggle => (
                <label key={toggle.key} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={sections[toggle.key]}
                    onChange={event => setSections(current => ({ ...current, [toggle.key]: event.target.checked }))}
                    className="h-4 w-4 accent-orange-400"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-200">{toggle.label}</span>
                    <span className="block text-[11px] text-slate-500">{toggle.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-300">Team photo <span className="font-normal text-slate-500">(one photo, compressed automatically)</span></Label>
            {teamPhoto ? (
              <div className={`${glassInsetClass} overflow-hidden p-0`}>
                <img src={teamPhoto} alt={`${teamName} team photo`} className="max-h-56 w-full object-cover" />
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-[11px] font-semibold text-slate-400">~{estimateDataUrlKb(teamPhoto)} KB stored</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setTeamPhoto(null)} className="h-7 gap-1.5 px-2 text-[11px] text-rose-300 hover:text-rose-200">
                    <Trash2 size={13} /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className={`${glassInsetClass} flex cursor-pointer flex-col items-center justify-center gap-2 px-4 py-10 text-center transition-colors hover:border-orange-300/30`}>
                {processingPhoto ? <Loader2 size={20} className="animate-spin text-slate-400" /> : <ImagePlus size={20} className="text-slate-400" />}
                <span className="text-xs font-bold text-slate-300">{processingPhoto ? 'Compressing photo…' : 'Upload a team photo'}</span>
                <span className="text-[11px] text-slate-500">Resized to {TEAM_PHOTO_MAX_DIMENSION}px WebP, kept under {Math.round(TEAM_PHOTO_MAX_BYTES / 1024)} KB</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={processingPhoto}
                  onChange={event => {
                    void handlePhotoUpload(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-cyan-300/10 pt-4">
          <Button type="button" onClick={() => void handleSave()} disabled={saving} className="gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} Save page
          </Button>
          {publicUrl && (
            <>
              <Button type="button" variant="outline" onClick={() => void handleCopyLink()} className="gap-2">
                {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy link'}
              </Button>
              {savedPage?.is_public && savedPage.slug === normalizedSlug && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-200 underline-offset-4 hover:underline"
                >
                  <ExternalLink size={13} /> Open page
                </a>
              )}
            </>
          )}
          {message && (
            <p role="status" className={`w-full text-xs font-semibold sm:ml-auto sm:w-auto ${message.tone === 'success' ? 'text-emerald-300' : 'text-orange-300'}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamPublicPagePanel;
