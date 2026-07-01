import React, { useState, type ReactNode } from 'react';
import { Announcement } from '../types';
import { Megaphone, Plus, Bell, Info, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from './ui/badge';
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
import {
  DARK_GLASS_CLASSES,
  DARK_GLASS_DASHBOARD_SURFACE_STYLE,
  DARK_GLASS_THEME_STYLE
} from '../theme/darkGlassTheme';

interface AnnouncementsViewProps {
  homeWorkspaceHeader?: ReactNode;
  announcements: Announcement[];
  onAddAnnouncement: (newAnn: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
}

type AnnouncementCategory = Announcement['category'];

const ANNOUNCEMENT_CATEGORIES: readonly AnnouncementCategory[] = ['Urgent', 'Matchday', 'Training', 'Social'];
const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  Urgent: 'Urgent action required',
  Matchday: 'Match day details',
  Training: 'Training session info',
  Social: 'Social events'
};
const ANNOUNCEMENT_BADGE_VARIANTS: Record<AnnouncementCategory, React.ComponentProps<typeof Badge>['variant']> = {
  Urgent: 'destructive',
  Matchday: 'info',
  Training: 'warning',
  Social: 'success'
};

const parseAnnouncementCategory = (value: string): AnnouncementCategory => (
  ANNOUNCEMENT_CATEGORIES.includes(value as AnnouncementCategory) ? value as AnnouncementCategory : 'Urgent'
);

const announcementControlClass = 'rounded-xl text-sm';
const announcementCardClass = 'rounded-2xl border border-border bg-card p-5 shadow-sm';
const announcementHeaderClass = 'border-b border-border pb-3';
const announcementTitleClass = 'font-display text-lg font-black tracking-tight text-foreground';
const announcementDescriptionClass = 'mt-1 text-sm font-medium leading-relaxed text-muted-foreground';
const announcementLabelClass = 'text-[11px] font-black uppercase tracking-widest text-muted-foreground';

export default function AnnouncementsView({ homeWorkspaceHeader, announcements, onAddAnnouncement, onDeleteAnnouncement }: AnnouncementsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [realCategory, setRealCategory] = useState<AnnouncementCategory>("Urgent");
  const [author, setAuthor] = useState("Marcus Sterling (Coach)");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnn: Announcement = {
      id: "a_" + Date.now(),
      title: title.trim(),
      content: content.trim(),
      date: new Date().toISOString().split('T')[0],
      category: realCategory,
      author: author.trim()
    };

    onAddAnnouncement(newAnn);

    setTitle("");
    setContent("");
    setRealCategory("Urgent");
    setIsAdding(false);
  };

  return (
    <div
      id="announcements-view-container"
      className={DARK_GLASS_CLASSES.dashboardShell}
      style={{ ...DARK_GLASS_THEME_STYLE, ...DARK_GLASS_DASHBOARD_SURFACE_STYLE }}
    >
      {homeWorkspaceHeader}
      
      {/* Title Header Panel */}
      <div className={`${announcementCardClass} flex flex-col justify-between gap-4 sm:flex-row sm:items-center`}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
            <Megaphone size={18} />
          </div>
          <div>
            <h3 className={announcementTitleClass}>Team Bulletin Board</h3>
            <p className={announcementDescriptionClass}>Official communications and game-day alerts for all squad members.</p>
          </div>
        </div>

        <Button
          id="toggle-announcement-form-btn"
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="rounded-xl text-xs font-bold"
        >
          {isAdding ? <Plus size={14} className="rotate-45" /> : <Plus size={14} />}
          {isAdding ? 'Cancel Post' : 'Post Announcement'}
        </Button>
      </div>

      {/* Write Announcement Form */}
      {isAdding && (
        <motion.div
          id="add-announcement-form-container"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`${announcementCardClass} space-y-4`}
        >
          <div className={`${announcementHeaderClass} flex items-center gap-2`}>
            <Megaphone className="text-primary" size={18} />
            <div>
              <p className={announcementLabelClass}>New bulletin</p>
              <h4 className="font-display text-base font-black text-foreground">Draft Bulletin Notice</h4>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="ann-title-input" className="mb-1 block">Headline Notice *</Label>
                <Input
                  id="ann-title-input"
                  type="text" 
                  required 
                  placeholder="e.g. Venue Change: Match vs Vanguard"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={announcementControlClass}
                />
              </div>

              <div>
                <Label className="mb-1 block">Importance Category *</Label>
                <Select
                  value={realCategory}
                  onValueChange={value => setRealCategory(parseAnnouncementCategory(value))}
                >
                  <SelectTrigger id="ann-category-select" className={announcementControlClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANNOUNCEMENT_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {ANNOUNCEMENT_CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3">
                <Label htmlFor="ann-author-input" className="mb-1 block">Author Name / Role *</Label>
                <Input
                  id="ann-author-input"
                  type="text" 
                  required 
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className={announcementControlClass}
                />
              </div>

              <div className="md:col-span-3">
                <Label htmlFor="ann-content-input" className="mb-1 block">Body Content *</Label>
                <Textarea
                  id="ann-content-input"
                  required
                  placeholder="Detailed directions, timing changes, setup arrangements, kits..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={4}
                  className={cn('min-h-28', announcementControlClass)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-border pt-3">
              <Button
                id="cancel-add-ann-btn"
                type="button" 
                onClick={() => setIsAdding(false)}
                variant="outline"
                className="rounded-xl text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                id="submit-ann-btn"
                type="submit" 
                className="rounded-xl px-5 text-sm font-semibold"
              >
                Publish Notice
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Announcements List */}
      <div id="announcement-bulletins-list" className="space-y-4">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-border bg-muted/45 px-6 py-12 text-center">
            <Bell size={32} className="text-muted-foreground/60" />
            <h4 className="font-display text-base font-black text-foreground">Notice Bulletin empty</h4>
            <p className="max-w-sm text-sm font-medium leading-relaxed text-muted-foreground">Any coach updates or schedule changes will highlight here.</p>
          </div>
        ) : (
          announcements.map((ann) => {
            const isUrgent = ann.category === 'Urgent';
            const isMatchday = ann.category === 'Matchday';
            const isTraining = ann.category === 'Training';

            return (
              <motion.div
                id={`ann-card-${ann.id}`}
                key={ann.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/25 ${
                  isUrgent ? 'border-destructive/25 bg-destructive/5' : 'border-border'
                }`}
              >
                {/* Left accent bar based on category */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  isUrgent ? 'bg-rose-500' :
                  isMatchday ? 'bg-primary' :
                  isTraining ? 'bg-warning' :
                  'bg-success'
                }`} />

                <div className="flex justify-between items-start pl-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        id={`ann-${ann.id}-cat-badge`}
                        variant={ANNOUNCEMENT_BADGE_VARIANTS[ann.category]}
                        className="rounded-full px-2.5"
                      >
                        {ann.category}
                      </Badge>
                      <span id={`ann-${ann.id}-date`} className="text-xs font-medium text-muted-foreground">
                        Posted: {ann.date}
                      </span>
                    </div>

                    <h4 id={`ann-${ann.id}-title`} className="pt-1 font-display text-base font-black tracking-tight text-foreground md:text-lg">
                      {ann.title}
                    </h4>
                  </div>

                  <Button
                    id={`delete-ann-btn-${ann.id}`}
                    type="button"
                    onClick={() => onDeleteAnnouncement(ann.id)}
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Remove Bulletin"
                    aria-label={`Remove ${ann.title}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                <div className="mt-3.5 pl-2">
                  <p id={`ann-${ann.id}-content`} className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-muted-foreground">
                    {ann.content}
                  </p>
                </div>

                <div className="mt-4 flex flex-col justify-between gap-3 border-t border-border pt-3 pl-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
                  <span id={`ann-${ann.id}-author`} className="flex items-center gap-1.5 font-semibold text-foreground">
                    <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                      {ann.author.charAt(0).toUpperCase()}
                    </span>
                    {ann.author}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Info size={12} className="text-muted-foreground" /> Only Coaches and Admins can delete notices
                  </div>
                </div>

              </motion.div>
            );
          })
        )}
      </div>

    </div>
  );
}

