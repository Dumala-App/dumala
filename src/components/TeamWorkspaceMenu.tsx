import React, { useRef, useState } from 'react';
import {
  Check,
  ChevronsUpDown,
  Download,
  FolderPlus,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Users
} from 'lucide-react';
import type { StaffMember, TeamInfo } from '../types';
import type { BackupRestoreSummary } from '../persistence/backup';
import type { WorkspaceSummary } from '../persistence/workspaces';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
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

interface TeamWorkspaceMenuProps {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  activeTeamName: string;
  onCreateWorkspace: (team: TeamInfo, headCoach: StaffMember) => void;
  onSwitchWorkspace: (workspaceId: string) => void;
  onRenameWorkspace: (workspaceId: string, name: string) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onExportCurrentWorkspace: () => void;
  onImportWorkspace: (file: File) => Promise<BackupRestoreSummary>;
}

const defaultCoachPhoto = 'https://images.unsplash.com/photo-1544717297-ea0e52a269c7?w=150&auto=format&fit=crop&q=80';

export default function TeamWorkspaceMenu({
  workspaces,
  activeWorkspaceId,
  activeTeamName,
  onCreateWorkspace,
  onSwitchWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
  onExportCurrentWorkspace,
  onImportWorkspace
}: TeamWorkspaceMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [stadium, setStadium] = useState('');
  const [league, setLeague] = useState('');
  const [founded, setFounded] = useState(new Date().getFullYear().toString());
  const [coachName, setCoachName] = useState('');
  const [coachRole, setCoachRole] = useState('Manager / Coach');
  const [coachBio, setCoachBio] = useState('');
  const [renameValues, setRenameValues] = useState<Record<string, string>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const resetAddForm = () => {
    setTeamName('');
    setStadium('');
    setLeague('');
    setFounded(new Date().getFullYear().toString());
    setCoachName('');
    setCoachRole('Manager / Coach');
    setCoachBio('');
  };

  const handleCreate = () => {
    if (!teamName.trim() || !coachName.trim()) return;
    onCreateWorkspace({
      name: teamName.trim(),
      founded: founded.trim() || new Date().getFullYear().toString(),
      stadium: stadium.trim() || 'Home Ground',
      coach: coachName.trim(),
      league: league.trim() || 'Friendly Division',
      logoColor: 'from-blue-600 to-indigo-800'
    }, {
      id: crypto.randomUUID(),
      name: coachName.trim(),
      role: coachRole,
      bio: coachBio.trim() || 'Team Manager & Core Organizer.',
      photoUrl: defaultCoachPhoto,
      status: 'Active'
    });
    resetAddForm();
    setAddOpen(false);
    setMenuOpen(false);
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    setImportStatus('Importing backup...');
    try {
      const summary = await onImportWorkspace(file);
      setImportStatus(`Imported ${summary.players} players, ${summary.staff} staff, and ${summary.games} games.`);
      setManageOpen(false);
      setMenuOpen(false);
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setMenuOpen(open => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="h-10 max-w-[13rem] rounded-xl bg-white/10 px-3 text-left text-white hover:bg-white/15 hover:text-white"
        >
          <Users size={15} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-xs font-bold">{activeTeamName || 'Team workspace'}</span>
          <ChevronsUpDown size={14} aria-hidden="true" />
        </Button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-12 z-50 w-[19rem] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
          >
            <div className="border-b border-border px-3 py-2">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Team workspaces</p>
              <p className="truncate text-sm font-extrabold">{activeTeamName || 'No active team'}</p>
            </div>
            <div className="max-h-56 overflow-y-auto p-1">
              {workspaces.map(workspace => (
                <button
                  key={workspace.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSwitchWorkspace(workspace.id);
                    setMenuOpen(false);
                  }}
                  className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm font-semibold hover:bg-muted"
                >
                  <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                  {workspace.id === activeWorkspaceId && <Check size={15} className="text-success" aria-hidden="true" />}
                </button>
              ))}
            </div>
            <div className="grid gap-1 border-t border-border p-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  setMenuOpen(false);
                  setAddOpen(true);
                }}
              >
                <Plus size={15} aria-hidden="true" /> Add team
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  setMenuOpen(false);
                  setManageOpen(true);
                }}
              >
                <Pencil size={15} aria-hidden="true" /> Manage teams
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  setMenuOpen(false);
                  onExportCurrentWorkspace();
                }}
              >
                <Download size={15} aria-hidden="true" /> Export current team
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add team</DialogTitle>
            <DialogDescription>Create a separate local workspace for another team.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-team-name">Team name</Label>
              <Input id="new-team-name" value={teamName} onChange={event => setTeamName(event.target.value)} placeholder="Apex Rangers FC" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-team-founded">Founded year</Label>
              <Input id="new-team-founded" value={founded} onChange={event => setFounded(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-team-ground">Home ground</Label>
              <Input id="new-team-ground" value={stadium} onChange={event => setStadium(event.target.value)} placeholder="Home Ground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-team-league">League / division</Label>
              <Input id="new-team-league" value={league} onChange={event => setLeague(event.target.value)} placeholder="Friendly Division" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-team-coach">Manager name</Label>
              <Input id="new-team-coach" value={coachName} onChange={event => setCoachName(event.target.value)} placeholder="Alex Sterling" />
            </div>
            <div className="space-y-2">
              <Label>Manager role</Label>
              <Select value={coachRole} onValueChange={setCoachRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manager / Coach">Manager / Coach</SelectItem>
                  <SelectItem value="Head Coach">Head Coach</SelectItem>
                  <SelectItem value="Assistant Coach">Assistant Coach</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-team-coach-bio">Manager bio</Label>
              <Textarea id="new-team-coach-bio" value={coachBio} onChange={event => setCoachBio(event.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleCreate} disabled={!teamName.trim() || !coachName.trim()}>
              <FolderPlus size={15} aria-hidden="true" /> Create team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage teams</DialogTitle>
            <DialogDescription>Switch, rename, import, export, or remove local team workspaces.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {workspaces.map(workspace => {
              const renameValue = renameValues[workspace.id] ?? workspace.name;
              const isActive = workspace.id === activeWorkspaceId;
              const isConfirmingDelete = pendingDeleteId === workspace.id;
              return (
                <div key={workspace.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="truncate text-sm font-extrabold">{workspace.name}</p>
                        {isActive && <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-black uppercase text-success">Active</span>}
                      </div>
                      <Input
                        value={renameValue}
                        onChange={event => setRenameValues(current => ({ ...current, [workspace.id]: event.target.value }))}
                        aria-label={`Rename ${workspace.name}`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button type="button" variant="outline" size="sm" onClick={() => onSwitchWorkspace(workspace.id)} disabled={isActive}>
                        <RefreshCw size={14} aria-hidden="true" /> Switch
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => onRenameWorkspace(workspace.id, renameValue)} disabled={!renameValue.trim()}>
                        <Pencil size={14} aria-hidden="true" /> Rename
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (isConfirmingDelete) {
                            onDeleteWorkspace(workspace.id);
                            setPendingDeleteId(null);
                          } else {
                            setPendingDeleteId(workspace.id);
                          }
                        }}
                        className="hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={14} aria-hidden="true" /> {isConfirmingDelete ? 'Confirm delete' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {importStatus && <p className="text-xs font-medium text-muted-foreground">{importStatus}</p>}
          <DialogFooter>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={event => void handleImport(event.target.files?.[0])}
            />
            <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()}>
              <Upload size={15} aria-hidden="true" /> Import as new team
            </Button>
            <Button type="button" onClick={() => setManageOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
