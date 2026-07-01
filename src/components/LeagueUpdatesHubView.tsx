import React, { lazy, Suspense } from 'react';
import type { Announcement, Player, Standing, TeamInfo } from '../types';
import {
  DARK_GLASS_CLASSES,
  DARK_GLASS_DASHBOARD_SURFACE_STYLE,
  DARK_GLASS_THEME_STYLE
} from '../theme/darkGlassTheme';
import ViewLoadingFallback from './ViewLoadingFallback';
import { SegmentedTabs, type SegmentedTabOption } from './ui/segmented-tabs';

const AnnouncementsView = lazy(() => import('./AnnouncementsView'));
const StandingsView = lazy(() => import('./StandingsView'));
const UpdatesView = lazy(() => import('./UpdatesView'));

export type LeagueUpdatesTab = 'league' | 'updates' | 'bulletins';

const LEAGUE_UPDATES_TAB_OPTIONS: Array<SegmentedTabOption<LeagueUpdatesTab>> = [
  { value: 'league', label: 'League' },
  { value: 'bulletins', label: 'Bulletins' },
  { value: 'updates', label: 'Updates' }
];

const LEAGUE_UPDATES_GLASS_CLASS = [
  'league-updates-glass-theme',
  DARK_GLASS_CLASSES.dashboardShell,
  '[&_.bg-card]:!bg-[#07111f]/88',
  '[&_.bg-white]:!bg-[#07111f]/88',
  '[&_.bg-slate-50]:!bg-[#0b1726]/72',
  '[&_.bg-slate-100]:!bg-white/[0.08]',
  '[&_.bg-indigo-50]:!bg-orange-300/10',
  '[&_.bg-indigo-100]:!bg-orange-300/15',
  '[&_.bg-indigo-200]:!bg-orange-300/20',
  '[&_.bg-blue-50]:!bg-cyan-300/10',
  '[&_.bg-blue-100]:!bg-cyan-300/10',
  '[&_.bg-blue-200]:!bg-cyan-300/20',
  '[&_.bg-sky-50]:!bg-cyan-300/10',
  '[&_.bg-amber-50]:!bg-amber-300/10',
  '[&_.bg-amber-100]:!bg-amber-300/15',
  '[&_.bg-violet-50]:!bg-fuchsia-300/10',
  '[&_.bg-emerald-50]:!bg-emerald-300/10',
  '[&_.border-border]:!border-cyan-300/10',
  '[&_.border-white]:!border-cyan-300/10',
  '[&_.border-slate-100]:!border-cyan-300/10',
  '[&_.border-slate-200]:!border-cyan-300/10',
  '[&_.border-indigo-100]:!border-orange-300/15',
  '[&_.border-indigo-200]:!border-orange-300/20',
  '[&_.border-blue-200]:!border-cyan-300/20',
  '[&_.border-sky-200]:!border-cyan-300/20',
  '[&_.border-amber-200]:!border-amber-300/20',
  '[&_.border-amber-300]:!border-amber-300/25',
  '[&_.border-violet-200]:!border-fuchsia-300/20',
  '[&_.border-emerald-200]:!border-emerald-300/20',
  '[&_.text-foreground]:!text-slate-100',
  '[&_.text-card-foreground]:!text-slate-100',
  '[&_.text-muted-foreground]:!text-slate-400',
  '[&_.text-slate-950]:!text-slate-50',
  '[&_.text-slate-900]:!text-slate-100',
  '[&_.text-slate-800]:!text-slate-100',
  '[&_.text-slate-700]:!text-slate-200',
  '[&_.text-slate-600]:!text-slate-300',
  '[&_.text-slate-500]:!text-slate-400',
  '[&_.text-indigo-900]:!text-orange-100',
  '[&_.text-indigo-800]:!text-orange-100',
  '[&_.text-indigo-700]:!text-orange-200',
  '[&_.text-indigo-600]:!text-orange-300',
  '[&_.text-blue-900]:!text-cyan-100',
  '[&_.text-blue-800]:!text-cyan-100',
  '[&_.text-blue-700]:!text-cyan-200',
  '[&_.text-sky-900]:!text-cyan-100',
  '[&_.text-amber-900]:!text-amber-100',
  '[&_.text-amber-800]:!text-amber-200',
  '[&_.text-emerald-700]:!text-emerald-200',
  '[&_.shadow-sm]:!shadow-black/10',
  '[&_input]:!border-cyan-300/10',
  '[&_input]:!bg-[#0b1726]/85',
  '[&_input]:!text-slate-100',
  '[&_input::placeholder]:!text-slate-500',
  '[&_textarea]:!border-cyan-300/10',
  '[&_textarea]:!bg-[#0b1726]/85',
  '[&_textarea]:!text-slate-100',
  '[&_textarea::placeholder]:!text-slate-500',
  '[&_thead]:!bg-white/[0.05]',
  '[&_thead_tr]:!border-cyan-300/10',
  '[&_tbody]:!divide-cyan-300/10',
  '[&_tr]:!border-cyan-300/10',
  '[&_th]:!border-cyan-300/10',
  '[&_td]:!border-cyan-300/10'
].join(' ');

interface LeagueUpdatesHubViewProps {
  activeTab: LeagueUpdatesTab;
  onTabChange: (tab: LeagueUpdatesTab) => void;

  // League
  standings: Standing[];
  onUpdateStanding: (standing: Standing) => void;
  onResetStandings: () => void;
  teamName: string;
  teamInfo: TeamInfo;
  onUpdateTeamInfo: (updated: TeamInfo) => void;
  onUpdateAllStandings: (standings: Standing[]) => void;
  players: Player[];
  onUpdatePlayer: (player: Player) => void;
  highlightStandingTeamName?: string | null;

  // Updates
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export default function LeagueUpdatesHubView(props: LeagueUpdatesHubViewProps) {
  return (
    <div
      className={LEAGUE_UPDATES_GLASS_CLASS}
      style={{ ...DARK_GLASS_THEME_STYLE, ...DARK_GLASS_DASHBOARD_SURFACE_STYLE }}
    >
      <SegmentedTabs
        value={props.activeTab}
        options={LEAGUE_UPDATES_TAB_OPTIONS}
        onValueChange={props.onTabChange}
        label="League and updates workspace sections"
      />

      <Suspense fallback={<ViewLoadingFallback label={props.activeTab} />}>
        {props.activeTab === 'league' && (
          <StandingsView
            standings={props.standings}
            onUpdateStanding={props.onUpdateStanding}
            onResetStandings={props.onResetStandings}
            teamName={props.teamName}
            teamInfo={props.teamInfo}
            onUpdateTeamInfo={props.onUpdateTeamInfo}
            onUpdateAllStandings={props.onUpdateAllStandings}
            players={props.players}
            onUpdatePlayer={props.onUpdatePlayer}
            highlightStandingTeamName={props.highlightStandingTeamName}
          />
        )}

        {props.activeTab === 'updates' && (
          <UpdatesView />
        )}

        {props.activeTab === 'bulletins' && (
          <AnnouncementsView announcements={props.announcements} onAddAnnouncement={props.onAddAnnouncement} onDeleteAnnouncement={props.onDeleteAnnouncement} />
        )}
      </Suspense>
    </div>
  );
}
