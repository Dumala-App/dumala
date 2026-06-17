import React from 'react';
import type { Announcement, Player, Standing, TeamInfo } from '../types';
import AnnouncementsView from './AnnouncementsView';
import StandingsView from './StandingsView';
import UpdatesView from './UpdatesView';

export type LeagueUpdatesTab = 'league' | 'updates' | 'bulletins';

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

  // Updates
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
}

const TabPill = (props: { label: string; isActive: boolean; onClick: () => void }) => {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={`Open ${props.label}`}
      className={`rounded-xl border px-4 py-2 text-xs font-black transition-colors ${
        props.isActive
          ? 'border-indigo-200 bg-indigo-600 text-white'
          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
      }`}
    >
      {props.label}
    </button>
  );
};

export default function LeagueUpdatesHubView(props: LeagueUpdatesHubViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/70 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <TabPill label="League" isActive={props.activeTab === 'league'} onClick={() => props.onTabChange('league')} />
          <TabPill label="Bulletins" isActive={props.activeTab === 'bulletins'} onClick={() => props.onTabChange('bulletins')} />
          <TabPill label="Updates" isActive={props.activeTab === 'updates'} onClick={() => props.onTabChange('updates')} />
        </div>
      </div>

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
        />
      )}

      {props.activeTab === 'updates' && (
        <UpdatesView />
      )}

      {props.activeTab === 'bulletins' && (
        <AnnouncementsView announcements={props.announcements} onAddAnnouncement={props.onAddAnnouncement} onDeleteAnnouncement={props.onDeleteAnnouncement} />
      )}
    </div>
  );
}
