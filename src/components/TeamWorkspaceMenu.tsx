import React, { useRef, useState } from 'react';
import {
  Check,
  ChevronsUpDown,
  Download,
  FolderPlus,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
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
import { MOCK_WORKSPACE_CHOICES } from '../mockWorkspaces';
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
const fieldClass = 'border-cyan-300/15 bg-[#0b1726] text-slate-100 placeholder:text-slate-500 focus-visible:ring-orange-300/35';
const selectTriggerClass = 'border-cyan-300/15 bg-[#0b1726] text-slate-100 focus:ring-orange-300/35';
const selectContentClass = 'border-cyan-300/15 bg-[#07111f] text-slate-100 shadow-2xl shadow-black/50';
const selectItemClass = 'text-slate-100 focus:bg-orange-300/10 focus:text-orange-100';
const secondaryButtonClass = 'border-cyan-300/15 bg-[#0b1726] text-slate-100 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100';
const primaryButtonClass = 'bg-orange-400 text-slate-950 shadow-sm shadow-orange-950/25 hover:bg-orange-300 hover:text-slate-950 disabled:bg-slate-700 disabled:text-slate-400';

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
  const [founded, setFounded] = useState('');
  const [coachName, setCoachName] = useState('');
  const [coachRole, setCoachRole] = useState('Manager / Coach');
  const [coachBio, setCoachBio] = useState('');
  const [selectedMockId, setSelectedMockId] = useState(MOCK_WORKSPACE_CHOICES[0]?.id ?? '');
  const [mockImportStatus, setMockImportStatus] = useState('');
  const [isImportingMock, setIsImportingMock] = useState(false);
  const [renameValues, setRenameValues] = useState<Record<string, string>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const resetAddForm = () => {
    setTeamName('');
    setStadium('');
    setLeague('');
    setFounded('');
    setCoachName('');
    setCoachRole('Manager / Coach');
    setCoachBio('');
    setMockImportStatus('');
  };

  const handleCreate = () => {
    if (!teamName.trim() || !coachName.trim()) return;
    onCreateWorkspace({
      name: teamName.trim(),
      founded: founded.trim() || '2012',
      stadium: stadium.trim() || 'Centermall',
      coach: coachName.trim(),
      league: league.trim() || 'League 1',
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

  const handleImportMockWorkspace = async () => {
    const choice = MOCK_WORKSPACE_CHOICES.find(item => item.id === selectedMockId);
    if (!choice || isImportingMock) return;

    setIsImportingMock(true);
    setMockImportStatus(`Importing ${choice.label}...`);
    try {
      const file = new File(
        [JSON.stringify(choice.backup)],
        choice.fileName,
        { type: 'application/json' }
      );
      const summary = await onImportWorkspace(file);
      setMockImportStatus(`Added ${choice.label}: ${summary.players} players, ${summary.staff} staff, ${summary.games} games.`);
      resetAddForm();
      setAddOpen(false);
      setMenuOpen(false);
    } catch (error) {
      setMockImportStatus(error instanceof Error ? error.message : `Could not add ${choice.label}.`);
    } finally {
      setIsImportingMock(false);
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
          className="h-10 max-w-[13rem] rounded-xl border border-white/[0.14] bg-white/[0.04] px-3 text-left text-[#DDE4EF] shadow-[inset_0_1px_0_rgba(255,255,255,.10),0_1px_2px_rgba(0,0,0,.3)] backdrop-blur-md hover:border-white/[0.26] hover:bg-white/[0.07] hover:text-white"
        >
          <Users size={15} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-xs font-bold">{activeTeamName || 'Team workspace'}</span>
          <ChevronsUpDown size={14} aria-hidden="true" />
        </Button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-12 z-50 w-[19rem] overflow-hidden rounded-xl border border-cyan-300/15 bg-[#07111f] text-slate-100 shadow-2xl shadow-black/50"
          >
            <div className="border-b border-cyan-300/10 px-3 py-2">
              <p className="text-[10px] font-black uppercase text-slate-400">Team workspaces</p>
              <p className="truncate text-sm font-extrabold text-slate-100">{activeTeamName || 'No active team'}</p>
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
                  className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm font-semibold text-slate-200 hover:bg-orange-300/10 hover:text-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300/30"
                >
                  <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                  {workspace.id === activeWorkspaceId && <Check size={15} className="text-emerald-300" aria-hidden="true" />}
                </button>
              ))}
            </div>
            <div className="grid gap-1 border-t border-cyan-300/10 p-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start text-slate-200 hover:bg-orange-300/10 hover:text-orange-100"
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
                className="justify-start text-slate-200 hover:bg-orange-300/10 hover:text-orange-100"
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
                className="justify-start text-slate-200 hover:bg-orange-300/10 hover:text-orange-100"
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
        <DialogContent className="max-h-[calc(100vh-3rem)] max-w-2xl overflow-y-auto border-cyan-300/15 bg-[#07111f] text-slate-100 shadow-2xl shadow-black/60 [&_.text-muted-foreground]:text-slate-400">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Add team</DialogTitle>
            <DialogDescription>Create a separate local workspace for another team.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-team-name" className="text-slate-300">Team name</Label>
              <Input id="new-team-name" value={teamName} onChange={event => setTeamName(event.target.value)} placeholder="Portuseros FC" className={fieldClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-team-founded" className="text-slate-300">Founded year</Label>
              <Input id="new-team-founded" value={founded} onChange={event => setFounded(event.target.value)} placeholder="2012" className={fieldClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-team-ground" className="text-slate-300">Home ground</Label>
              <Input id="new-team-ground" value={stadium} onChange={event => setStadium(event.target.value)} placeholder="Centermall" className={fieldClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-team-league" className="text-slate-300">League / division</Label>
              <Input id="new-team-league" value={league} onChange={event => setLeague(event.target.value)} placeholder="League 1" className={fieldClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-team-coach" className="text-slate-300">Manager name</Label>
              <Input id="new-team-coach" value={coachName} onChange={event => setCoachName(event.target.value)} placeholder="Alex Sterling" className={fieldClass} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Manager role</Label>
              <Select value={coachRole} onValueChange={setCoachRole}>
                <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem className={selectItemClass} value="Manager / Coach">Manager / Coach</SelectItem>
                  <SelectItem className={selectItemClass} value="Head Coach">Head Coach</SelectItem>
                  <SelectItem className={selectItemClass} value="Assistant Coach">Assistant Coach</SelectItem>
                  <SelectItem className={selectItemClass} value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-team-coach-bio" className="text-slate-300">Manager bio</Label>
              <Textarea id="new-team-coach-bio" value={coachBio} onChange={event => setCoachBio(event.target.value)} rows={3} className={fieldClass} />
            </div>
            <div className="space-y-3 rounded-xl border border-cyan-300/15 bg-[#0b1726] p-3 md:col-span-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-orange-200">Try a sample team</p>
                  <p className="text-xs text-slate-400">Choose a bundled workspace from the mock folder and add it as a separate team.</p>
                </div>
                <Sparkles size={18} className="hidden text-orange-300 sm:block" aria-hidden="true" />
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Select value={selectedMockId} onValueChange={setSelectedMockId} disabled={MOCK_WORKSPACE_CHOICES.length === 0}>
                  <SelectTrigger className={selectTriggerClass} aria-label="Sample team">
                    <SelectValue placeholder="Select a sample team" />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    {MOCK_WORKSPACE_CHOICES.map(choice => (
                      <SelectItem key={choice.id} className={selectItemClass} value={choice.id}>
                        {choice.label} · {choice.detail}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => void handleImportMockWorkspace()}
                  disabled={!selectedMockId || isImportingMock}
                  className={primaryButtonClass}
                >
                  {isImportingMock ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
                  Add sample
                </Button>
              </div>
              {mockImportStatus && <p className="text-xs font-semibold text-slate-300">{mockImportStatus}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className={secondaryButtonClass} onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleCreate} disabled={!teamName.trim() || !coachName.trim()} className={primaryButtonClass}>
              <FolderPlus size={15} aria-hidden="true" /> Create team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-3xl border-cyan-300/15 bg-[#07111f] text-slate-100 shadow-2xl shadow-black/60 [&_.text-muted-foreground]:text-slate-400">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Manage teams</DialogTitle>
            <DialogDescription>Switch, rename, import, export, or remove local team workspaces.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {workspaces.map(workspace => {
              const renameValue = renameValues[workspace.id] ?? workspace.name;
              const isActive = workspace.id === activeWorkspaceId;
              const isConfirmingDelete = pendingDeleteId === workspace.id;
              return (
                <div key={workspace.id} className="rounded-lg border border-cyan-300/15 bg-[#0b1726] p-3 text-slate-100">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="truncate text-sm font-extrabold text-slate-100">{workspace.name}</p>
                        {isActive && <span className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-200">Active</span>}
                      </div>
                      <Input
                        value={renameValue}
                        onChange={event => setRenameValues(current => ({ ...current, [workspace.id]: event.target.value }))}
                        aria-label={`Rename ${workspace.name}`}
                        className={fieldClass}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button type="button" variant="outline" size="sm" className={secondaryButtonClass} onClick={() => onSwitchWorkspace(workspace.id)} disabled={isActive}>
                        <RefreshCw size={14} aria-hidden="true" /> Switch
                      </Button>
                      <Button type="button" variant="outline" size="sm" className={secondaryButtonClass} onClick={() => onRenameWorkspace(workspace.id, renameValue)} disabled={!renameValue.trim()}>
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
                        className="border-cyan-300/15 bg-[#0b1726] text-slate-100 hover:border-rose-300/30 hover:bg-rose-400/10 hover:text-rose-100"
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
            <Button type="button" variant="outline" className={secondaryButtonClass} onClick={() => importInputRef.current?.click()}>
              <Upload size={15} aria-hidden="true" /> Import as new team
            </Button>
            <Button type="button" className={primaryButtonClass} onClick={() => setManageOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
