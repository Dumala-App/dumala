import React, { useEffect, useRef, useState } from 'react';
import { PaymentLedgerEntry, Player, StaffMember, SPECIALTY_TRAITS, SpecialtyTrait, POSITION_ATTRIBUTES_MAP } from '../types';
import { 
  UserPlus, Search, Shield, Plus, AlertCircle, Download, Upload,
  Award, ArrowLeftRight, ArrowRight, Mail, Phone, Calendar, ReceiptText
} from 'lucide-react';
import { motion } from 'motion/react';
import PlayerComparer from './PlayerComparer';
import { getPlayerPlaceholder, STAFF_PLACEHOLDER } from '../playerPlaceholders';
import { formatBackupSourceLabel, type BackupRestoreSummary } from '../persistence/backup';
import { FieldError, FormErrorSummary } from './FormValidation';
import {
  FieldErrors,
  focusFirstInvalidField,
  hasFieldErrors,
  mergeFieldErrors,
  parseIntegerInput
} from '../forms/validation';
import SquadPaymentsPanel from './SquadPaymentsPanel';
import { Button } from './ui/button';
import {
  WORKSPACE_SEGMENTED_LIST_CLASS,
  WORKSPACE_SEGMENTED_TABS_CLASS,
  WORKSPACE_SEGMENTED_TRIGGER_CLASS,
  type SegmentedTabOption
} from './ui/segmented-tabs';
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
import {
  DARK_GLASS_CLASSES,
  DARK_GLASS_DASHBOARD_SURFACE_STYLE,
  DARK_GLASS_THEME_STYLE
} from '../theme/darkGlassTheme';

interface RosterViewProps {
  players: Player[];
  staff: StaffMember[];
  onAddPlayer: (newPlayer: Player) => void;
  onAddStaff: (newStaff: StaffMember) => void;
  onSelectPlayer: (player: Player) => void;
  onSelectStaff: (staff: StaffMember) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<BackupRestoreSummary>;
  onUpdatePlayer?: (player: Player) => void;
  highlightPlayerId?: string | null;
  paymentLedger: PaymentLedgerEntry[];
  onAddPaymentLedgerEntry: (entry: PaymentLedgerEntry) => void;
  onAddBulkPaymentLedgerEntries: (entries: PaymentLedgerEntry[]) => void;
  onUpdatePaymentLedgerEntry: (entry: PaymentLedgerEntry) => void;
  onVoidPaymentLedgerEntry: (entryId: string, reason: string) => void;
}

type PlayerFormField = 'name' | 'number' | 'position' | 'age' | 'height' | 'weight';
type SquadSection = 'players' | 'staff' | 'payments';

const SQUAD_SECTION_OPTIONS: Array<SegmentedTabOption<SquadSection>> = [
  { value: 'players', label: 'Players' },
  { value: 'staff', label: 'Staff' },
  { value: 'payments', label: 'Payments' }
];

const PLAYER_POSITIONS = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'] as const;
const STAFF_ROLE_OPTIONS = [
  'Founder',
  'Manager',
  'Coach',
  'Vice President',
  'President',
  'Team Owner',
  'Director of Football',
  'Assistant Coach',
  'Staff',
  'Other'
] as const;

const integerError = (result: ReturnType<typeof parseIntegerInput>): string | undefined => (
  'errors' in result ? result.errors.value : undefined
);

const rosterGlassPanelClass = 'rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl';
const rosterGlassCardClass = 'rounded-xl border border-cyan-300/10 bg-[#0b1726]/66 text-slate-100 shadow-sm shadow-black/10 backdrop-blur-sm';
const rosterGlassInsetClass = 'rounded-xl border border-cyan-300/10 bg-[#0b1726]/72 text-slate-100 shadow-inner shadow-black/10 backdrop-blur-sm';
const rosterGlassFieldClass = 'border-cyan-300/10 bg-[#0b1726]/85 text-slate-100 placeholder:text-slate-500 focus-visible:border-orange-300/60 focus-visible:ring-orange-300/25';
const rosterGlassFormClass = `${rosterGlassPanelClass} space-y-4 p-6 [&_input]:!border-cyan-300/10 [&_input]:!bg-[#0b1726]/85 [&_input]:!text-slate-100 [&_input]:placeholder:!text-slate-500 [&_textarea]:!border-cyan-300/10 [&_textarea]:!bg-[#0b1726]/85 [&_textarea]:!text-slate-100 [&_textarea]:placeholder:!text-slate-500`;

export default function RosterView({
  players,
  staff,
  onAddPlayer,
  onAddStaff,
  onSelectPlayer,
  onSelectStaff,
  onExportBackup,
  onImportBackup,
  onUpdatePlayer,
  highlightPlayerId,
  paymentLedger,
  onAddPaymentLedgerEntry,
  onAddBulkPaymentLedgerEntries,
  onVoidPaymentLedgerEntry
}: RosterViewProps) {
  const [activeSection, setActiveSection] = useState<SquadSection>('players');
  // Search & Basic Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPos, setFilterPos] = useState("All");

  // Comparison State
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [showCompareWidget, setShowCompareWidget] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [backupMessageType, setBackupMessageType] = useState<'success' | 'error' | 'info'>('info');
  const importInputRef = useRef<HTMLInputElement>(null);
  const addPlayerFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!highlightPlayerId) return;
    const card = document.getElementById(`player-${highlightPlayerId}-card`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightPlayerId]);

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    const isJsonFile = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
    if (!isJsonFile) {
      setBackupMessageType('error');
      setBackupMessage('Choose a Dumala JSON backup file. Other file types are not imported.');
      if (importInputRef.current) importInputRef.current.value = '';
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setBackupMessageType('error');
      setBackupMessage('This backup file is larger than 15 MB. Export a fresh Full Workspace backup and try again.');
      if (importInputRef.current) importInputRef.current.value = '';
      return;
    }
    try {
      const summary = await onImportBackup(file);
      const sourceLabel = formatBackupSourceLabel(summary.sourceVersion);
      setBackupMessageType('success');
      setBackupMessage(
        `${sourceLabel} restored: ${summary.players} players, ${summary.staff} staff, ${summary.paymentEntries} payment records, ${summary.games} events, ${summary.standings} league rows, ${summary.announcements} bulletins, and ${summary.assessments} assessments.`
      );
    } catch (error) {
      setBackupMessageType('error');
      setBackupMessage(error instanceof Error ? error.message : 'The backup could not be restored. Your existing workspace was left unchanged.');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handleToggleCompare = (playerId: string) => {
    setSelectedCompareIds(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      }
      if (prev.length >= 2) {
        return [prev[1], playerId];
      }
      return [...prev, playerId];
    });
  };

  const handleClearCompare = () => {
    setSelectedCompareIds([]);
  };

  // Add Player Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerNumber, setNewPlayerNumber] = useState("");
  const [newPlayerPos, setNewPlayerPos] = useState("Forward");
  const [newPlayerBio, setNewPlayerBio] = useState("");
  const [newPlayerPhoto, setNewPlayerPhoto] = useState("");
  const [newPlayerAge, setNewPlayerAge] = useState("");
  const [newPlayerHeight, setNewPlayerHeight] = useState("");
  const [newPlayerWeight, setNewPlayerWeight] = useState("");
  const [newPlayerTraits, setNewPlayerTraits] = useState<string[]>([]);
  const [playerFormErrors, setPlayerFormErrors] = useState<FieldErrors<PlayerFormField>>({});

  const handleToggleTrait = (traitLabel: string) => {
    setNewPlayerTraits(prev =>
      prev.includes(traitLabel) ? prev.filter(t => t !== traitLabel) : prev.length < 4 ? [...prev, traitLabel] : prev
    );
  };

  const getAvailableTraits = (position: string): SpecialtyTrait[] => {
    return SPECIALTY_TRAITS[position] || [];
  };

  // Reset traits when position changes
  const handlePositionChange = (pos: string) => {
    setNewPlayerPos(pos);
    setNewPlayerTraits([]);
  };

  // Submit Handler for New Player
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedNumber = parseIntegerInput(newPlayerNumber, { label: 'Squad number', min: 1, max: 99 });
    const parsedAge = newPlayerAge.trim()
      ? parseIntegerInput(newPlayerAge, { label: 'Age', min: 10, max: 80 })
      : { ok: true as const, value: undefined };
    const parsedHeight = newPlayerHeight.trim()
      ? parseIntegerInput(newPlayerHeight, { label: 'Height', min: 100, max: 250 })
      : { ok: true as const, value: undefined };
    const parsedWeight = newPlayerWeight.trim()
      ? parseIntegerInput(newPlayerWeight, { label: 'Weight', min: 30, max: 250 })
      : { ok: true as const, value: undefined };

    const nextErrors = mergeFieldErrors<PlayerFormField>(
      newPlayerName.trim() ? {} : { name: 'Player name is required.' },
      parsedNumber.ok ? {} : { number: integerError(parsedNumber) },
      PLAYER_POSITIONS.includes(newPlayerPos as typeof PLAYER_POSITIONS[number])
        ? {}
        : { position: 'Choose a supported player position.' },
      parsedAge.ok ? {} : { age: integerError(parsedAge) },
      parsedHeight.ok ? {} : { height: integerError(parsedHeight) },
      parsedWeight.ok ? {} : { weight: integerError(parsedWeight) }
    );
    if (
      hasFieldErrors(nextErrors)
      || !parsedNumber.ok
      || !parsedAge.ok
      || !parsedHeight.ok
      || !parsedWeight.ok
    ) {
      setPlayerFormErrors(nextErrors);
      focusFirstInvalidField(addPlayerFormRef.current, nextErrors);
      return;
    }

    const playerPhoto = newPlayerPhoto || getPlayerPlaceholder(newPlayerPos);

    const baseAttributes = {
      pace: Math.floor(Math.random() * 25) + 68,
      stamina: Math.floor(Math.random() * 25) + 68,
      agility: Math.floor(Math.random() * 25) + 68,
      strength: Math.floor(Math.random() * 25) + 63,
      firstTouch: Math.floor(Math.random() * 30) + 55,
      shortPassing: Math.floor(Math.random() * 30) + 58
    };

    const posKeys = POSITION_ATTRIBUTES_MAP[newPlayerPos] || [];
    const positionAttributes: Record<string, number> = {};
    posKeys.forEach(key => {
      positionAttributes[key] = Math.floor(Math.random() * 30) + 55;
    });

    const newPlayer: Player = {
      id: "p_" + Date.now(),
      name: newPlayerName.trim(),
      number: parsedNumber.value,
      position: newPlayerPos,
      bio: newPlayerBio || `${newPlayerName.trim()} joined the roster. Highly motivated athlete.`,
      photoUrl: playerPhoto,
      age: parsedAge.value,
      height: parsedHeight.value,
      weight: parsedWeight.value,
      specialtyTraits: newPlayerTraits.length > 0 ? newPlayerTraits : undefined,
      gamesPlayed: 0,
      points: 0,
      assists: 0,
      cleanSheetsOrRebounds: 0,
      minutesPlayed: 0,
      mvpAwards: 0,
      yellowCards: 0,
      redCards: 0,
      baseAttributes,
      positionAttributes,
      registrationStatus: 'Active'
    };

    onAddPlayer(newPlayer);
    
    // Reset Add Form
    setNewPlayerName("");
    setNewPlayerNumber("");
    setNewPlayerPos("Forward");
    setNewPlayerBio("");
    setNewPlayerPhoto("");
    setNewPlayerAge("");
    setNewPlayerHeight("");
    setNewPlayerWeight("");
    setNewPlayerTraits([]);
    setPlayerFormErrors({});
    setIsAdding(false);
  };

  // Add Staff / Management Form State
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("Manager");
  const [customStaffRole, setCustomStaffRole] = useState("");
  const [newStaffBio, setNewStaffBio] = useState("");
  const [newStaffPhoto, setNewStaffPhoto] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffSince, setNewStaffSince] = useState("");

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const roleToSave = newStaffRole === "Other" && customStaffRole.trim() ? customStaffRole.trim() : newStaffRole;

    const newStaff: StaffMember = {
      id: "staff_" + Date.now(),
      name: newStaffName.trim(),
      role: roleToSave,
      bio: newStaffBio || `${newStaffName} has joined the management and staff team as ${roleToSave}.`,
      photoUrl: newStaffPhoto || STAFF_PLACEHOLDER,
      email: newStaffEmail || undefined,
      phone: newStaffPhone || undefined,
      since: newStaffSince || undefined,
      status: 'Active'
    };

    onAddStaff(newStaff);

    // Reset Form
    setNewStaffName("");
    setNewStaffRole("Manager");
    setCustomStaffRole("");
    setNewStaffBio("");
    setNewStaffPhoto("");
    setNewStaffEmail("");
    setNewStaffPhone("");
    setNewStaffSince("");
    setIsAddingStaff(false);
  };

  // Helper calculating dynamic player OVR
  const calculateOVR = (bAttrs: Player['baseAttributes'], pAttrs: Player['positionAttributes']) => {
    if (!bAttrs) return 50;
    
    // Average base stats
    const baseAvg = (bAttrs.pace + bAttrs.stamina + bAttrs.agility + bAttrs.strength + bAttrs.firstTouch + bAttrs.shortPassing) / 6;
    
    // Average position stats if they exist
    const posKeys = Object.keys(pAttrs || {});
    let posAvg = 0;
    if (posKeys.length > 0) {
      posAvg = posKeys.reduce((sum, key) => sum + pAttrs[key], 0) / posKeys.length;
    }
    
    // Weighted combination: 60% base, 40% positional
    return Math.round(posKeys.length > 0 ? (baseAvg * 0.6) + (posAvg * 0.4) : baseAvg);
  };

  // Helper getting deterministic specialized badges
  const getSpecializedTag = (player: Player) => {
    const bAttrs = player.baseAttributes;
    if (!bAttrs) return { label: "Stamina Tank", icon: "💪", style: "bg-slate-900/80 text-slate-200 border-slate-500/30" };
    
    const highestAttr = Object.entries(bAttrs).reduce((prev, curr) => prev[1] > curr[1] ? prev : curr);
    
    switch (highestAttr[0]) {
      case 'pace': 
        return { label: "Speedster", icon: "⚡", style: "bg-blue-900/80 text-blue-200 border-blue-500/30" };
      case 'strength': 
        return { label: "Powerhouse", icon: "🏋️", style: "bg-rose-900/80 text-rose-200 border-rose-500/30" };
      case 'shortPassing': 
        return { label: "Maestro", icon: "🪄", style: "bg-emerald-900/80 text-emerald-200 border-emerald-500/30" };
      case 'agility': 
        return { label: "Magician", icon: "🕺", style: "bg-amber-900/80 text-amber-200 border-amber-500/30" };
      case 'firstTouch': 
        return { label: "Velcro", icon: "🧲", style: "bg-purple-900/80 text-purple-200 border-purple-500/30" };
      default: 
        return { label: "Stamina Tank", icon: "💪", style: "bg-slate-900/80 text-slate-200 border-slate-500/30" };
    }
  };

  // Filter roster
  const activeRoster = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          player.number.toString().includes(searchTerm);
    const matchesPosition = filterPos === "All" || player.position === filterPos;
    return matchesSearch && matchesPosition;
  });

  const staffMembers = staff;
  const duplicateJerseyPlayer = newPlayerNumber.trim()
      ? players.find(player => player.number === Number(newPlayerNumber))
    : undefined;

  return (
    <div
      id="roster-view-container"
      className={DARK_GLASS_CLASSES.dashboardShell}
      style={{ ...DARK_GLASS_THEME_STYLE, ...DARK_GLASS_DASHBOARD_SURFACE_STYLE }}
    >
      <nav className={WORKSPACE_SEGMENTED_TABS_CLASS} aria-label="Squad workspace sections">
        <div className={WORKSPACE_SEGMENTED_LIST_CLASS}>
          {SQUAD_SECTION_OPTIONS.map((section) => (
            <button
              key={section.value}
              type="button"
              onClick={() => {
                setActiveSection(section.value);
                setIsAdding(false);
                setIsAddingStaff(false);
              }}
              className={WORKSPACE_SEGMENTED_TRIGGER_CLASS}
              aria-pressed={activeSection === section.value}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Dynamic Header banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 p-6 text-white shadow-lg shadow-black/20 backdrop-blur-xl">
        <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-10">
          <Shield size={180} className="stroke-[3]" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest">SQUAD WORKSHOP</span>
              <span className="text-slate-400 text-xs font-mono">Real-time Administration</span>
            </div>
            <h2 className="text-2xl font-display font-black tracking-tight">Team Roster & Player Directory</h2>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Synthesize your squad metrics, register athletes, and protect the complete browser workspace below.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {activeSection === 'players' && (
        <div className={`${rosterGlassPanelClass} px-3 py-3 font-medium`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <Input
                id="search-roster-input"
                type="text"
                placeholder="Search squad..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`h-9 pl-9 text-xs font-medium ${rosterGlassFieldClass}`}
                aria-label="Search squad"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
              <div className="flex max-w-full overflow-x-auto rounded-lg border border-cyan-300/10 bg-[#0b1726]/72 p-0.5 shadow-inner shadow-black/10" role="group" aria-label="Filter roster by position">
                {["All", "Forward", "Midfielder", "Defender", "Goalkeeper"].map((pos) => (
                  <Button
                    id={`filter-pos-${pos.toLowerCase()}`}
                    key={pos}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterPos(pos)}
                    aria-pressed={filterPos === pos}
                    className={`rounded-md px-2.5 text-[10px] ${
                      filterPos === pos
                        ? 'bg-orange-400 text-slate-950 shadow-sm ring-1 ring-orange-300/30'
                        : 'text-slate-400 hover:bg-orange-300/10 hover:text-orange-100'
                    }`}
                  >
                    {pos === 'All' ? 'All' : pos}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  id="toggle-compare-widget-btn"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompareWidget(!showCompareWidget)}
                  aria-pressed={showCompareWidget}
                  className={`gap-1.5 px-2.5 text-[10px] ${
                    showCompareWidget
                      ? 'border-orange-300/35 bg-orange-300/10 text-orange-100'
                      : 'border-cyan-300/15 bg-[#0b1726]/85 text-slate-400 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100'
                  }`}
                  title="Toggle Athlete Comparison Matchup Board"
                >
                  <ArrowLeftRight size={12} className="stroke-[2.5]" />
                  <span>{showCompareWidget ? 'Comparing' : 'Compare'}</span>
                </Button>

                <Button
                  id="btn-export-backup"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onExportBackup}
                  className="gap-1.5 border-cyan-300/15 bg-[#0b1726]/85 px-2.5 text-[10px] text-slate-400 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100"
                  title="Export roster, assessments, tactics, training, notes, availability, payments, and standings history"
                >
                  <Download size={12} className="stroke-[2.5]" />
                  <span>Export</span>
                </Button>

                <Input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => void handleImportFile(event.target.files?.[0])}
                  aria-label="Restore team backup file"
                />
                <Button
                  id="btn-import-backup"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => importInputRef.current?.click()}
                  className="gap-1.5 border-cyan-300/15 bg-[#0b1726]/85 px-2.5 text-[10px] text-slate-400 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100"
                  title="Restore a Dumala full-workspace or legacy JSON backup"
                >
                  <Upload size={12} className="stroke-[2.5]" />
                  <span>Restore</span>
                </Button>
              </div>
            </div>

          </div>
          {backupMessage && (
            <p
              className={`mt-2 rounded-lg border px-3 py-2 text-[10px] font-bold ${
                backupMessageType === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : backupMessageType === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-cyan-300/10 bg-[#0b1726]/66 text-slate-300'
              }`}
              role={backupMessageType === 'error' ? 'alert' : 'status'}
            >
              {backupMessage}
            </p>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
            Full Workspace V4 includes players, staff, payments, schedule, league, bulletins, assessments, tactics, training, availability, coach notes, and standings history.
          </p>
        </div>
        )}

        {/* Section Layouts */}
        {activeSection === 'staff' && <div id="management-staff-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-lg font-black uppercase tracking-wider text-slate-100">
              <Shield className="text-amber-500" size={20} />
              Management & Staff
            </h3>
            <Button
              id="toggle-add-staff-form-btn"
              type="button"
              onClick={() => {
                setIsAddingStaff(!isAddingStaff);
                setIsAdding(false);
              }}
              aria-expanded={isAddingStaff}
              className="h-8 rounded-lg border border-amber-500/10 bg-amber-500 px-3.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-sm hover:scale-[1.02] hover:bg-amber-600 active:scale-[0.98]"
            >
              {isAddingStaff ? <Plus size={12} className="rotate-45" /> : <UserPlus size={12} />}
              <span>{isAddingStaff ? 'Cancel' : 'Add Staff'}</span>
            </Button>
          </div>

          {/* Add Staff form */}
          {isAddingStaff && (
            <motion.div 
              id="add-staff-form-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={rosterGlassFormClass}
            >
              <div className="flex items-center gap-2 border-b border-cyan-300/10 pb-2">
                <Shield className="text-amber-500" size={18} />
                <h3 className="font-display text-sm font-black uppercase tracking-wider text-slate-100">Add Management or Staff Member</h3>
              </div>

              <form onSubmit={handleAddStaffSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className={`${rosterGlassInsetClass} flex items-center gap-4 p-4 lg:col-span-4`}>
                  <div className="relative shrink-0">
                    <img 
                      src={newStaffPhoto || STAFF_PLACEHOLDER}
                      alt="Staff Preview" 
                      className="h-12 w-12 rounded-full border border-cyan-300/15 object-cover object-top"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="mb-1 block text-slate-400">Staff Photo</Label>
                    <Input
                      id="new-staff-photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setNewStaffPhoto(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('new-staff-photo')?.click()}
                      variant="outline"
                      size="sm"
                      className="h-8 border-cyan-300/15 bg-[#0b1726]/85 text-[11px] text-slate-100 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100"
                    >
                      Upload Custom Photo
                    </Button>
                    {newStaffPhoto && (
                      <Button
                        type="button"
                        onClick={() => setNewStaffPhoto('')}
                        variant="link"
                        className="ml-3 text-[11px] text-rose-500"
                      >
                        Clear Image
                      </Button>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <Label className="mb-1.5 block text-slate-400">Full Name *</Label>
                  <Input
                    id="new-staff-name-input"
                    type="text" 
                    required 
                    placeholder="e.g. Richard Hendricks"
                    value={newStaffName}
                    onChange={e => setNewStaffName(e.target.value)}
                    className="h-10 rounded-xl text-xs focus-visible:ring-amber-500/30"
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-slate-400">Role / Position *</Label>
                  <Select
                    value={newStaffRole}
                    onValueChange={setNewStaffRole}
                  >
                    <SelectTrigger id="new-staff-role-select" className="h-10 rounded-xl border-cyan-300/10 bg-[#0b1726]/85 text-xs text-slate-100 focus:ring-amber-500/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-cyan-300/15 bg-[#0b1726] text-slate-100">
                      {STAFF_ROLE_OPTIONS.map(role => (
                        <SelectItem key={role} value={role}>
                          {role === 'Other' ? 'Other / Custom Title' : role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newStaffRole === "Other" && (
                  <div>
                    <Label className="mb-1.5 block text-slate-400">Custom Role Title *</Label>
                    <Input
                      id="custom-staff-role-input"
                      type="text" 
                      required 
                      placeholder="e.g. Treasurer"
                      value={customStaffRole}
                      onChange={e => setCustomStaffRole(e.target.value)}
                      className="h-10 rounded-xl text-xs focus-visible:ring-amber-500/30"
                    />
                  </div>
                )}

                <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="mb-1.5 block text-slate-400">Email</Label>
                    <Input
                      id="new-staff-email-input"
                      type="email"
                      placeholder="coach@club.com"
                      value={newStaffEmail}
                      onChange={e => setNewStaffEmail(e.target.value)}
                      className="h-10 rounded-xl text-xs focus-visible:ring-amber-500/30"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-slate-400">Phone</Label>
                    <Input
                      id="new-staff-phone-input"
                      type="text"
                      placeholder="+1 234 567 890"
                      value={newStaffPhone}
                      onChange={e => setNewStaffPhone(e.target.value)}
                      className="h-10 rounded-xl text-xs focus-visible:ring-amber-500/30"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-slate-400">Since</Label>
                    <Input
                      id="new-staff-since-input"
                      type="text"
                      placeholder="e.g. Jan 2025"
                      value={newStaffSince}
                      onChange={e => setNewStaffSince(e.target.value)}
                      className="h-10 rounded-xl text-xs focus-visible:ring-amber-500/30"
                    />
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <Label className="mb-1.5 block text-slate-400">Short Bio Statement (Optional)</Label>
                  <Textarea
                    id="new-staff-bio-input"
                    placeholder="Write a brief description of their background, philosophy, key responsibilities..."
                    value={newStaffBio}
                    onChange={e => setNewStaffBio(e.target.value)}
                    rows={2}
                    className="min-h-20 rounded-xl text-xs focus-visible:ring-amber-500/30"
                  />
                </div>

                <div className="lg:col-span-4 flex flex-col sm:flex-row justify-end gap-2 p-1">
                  <Button
                    id="cancel-add-staff-btn"
                    type="button" 
                    onClick={() => setIsAddingStaff(false)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-cyan-300/15 bg-[#0b1726]/85 text-slate-100 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    id="submit-add-staff-btn"
                    type="submit" 
                    size="sm"
                    className="rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-600"
                  >
                    Add Staff Member
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {staffMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {staffMembers.map((staff) => {
                return (
                  <motion.div
                    key={staff.id}
                    whileHover={{ y: -4 }}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 shadow-lg shadow-black/20 backdrop-blur-xl transition-all"
                  >
                    <div className="relative h-44 bg-slate-800 overflow-hidden">
                      <img 
                        src={staff.photoUrl} 
                        alt={staff.name}
                        onClick={() => onSelectStaff(staff)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer opacity-80"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
                      
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-amber-500/90 backdrop-blur-md text-slate-950 border border-amber-400 text-[10px] uppercase font-black px-2 py-1 rounded-md tracking-wider">
                          {staff.role}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 text-white">
                        <h4 
                          onClick={() => onSelectStaff(staff)}
                          className="font-display font-bold text-lg leading-tight truncate w-40 cursor-pointer hover:text-amber-400 transition-colors"
                        >
                          {staff.name}
                        </h4>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-cyan-300/10 bg-[#07111f]/92 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Staff Directory</span>
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => onSelectStaff(staff)}
                          className="gap-0.5 text-xs text-amber-400"
                        >
                          Profile <ArrowRight aria-hidden="true" />
                        </Button>
                      </div>
                      <div className="space-y-1 text-[10px]">
                        {staff.email && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Mail size={10} className="text-slate-500 shrink-0" />
                            <span className="truncate">{staff.email}</span>
                          </div>
                        )}
                        {staff.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone size={10} className="text-slate-500 shrink-0" />
                            <span className="truncate">{staff.phone}</span>
                          </div>
                        )}
                        {staff.since && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Calendar size={10} className="text-slate-500 shrink-0" />
                            <span className="truncate">Since {staff.since}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className={`${rosterGlassPanelClass} flex flex-col items-center justify-center space-y-2 py-8 text-center`}>
              <Shield size={24} className="text-slate-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">No management or staff listed</h4>
              <p className="text-slate-400 text-[11px]">Click "Add Staff" above to register founders, directors, coaches, and more!</p>
            </div>
          )}
        </div>}

        {/* Grid Layout of Upgraded Cards */}
        {activeSection === 'players' && <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-lg font-black uppercase tracking-wider text-slate-100">
              <UserPlus className="text-indigo-500" size={20} />
              Active Roster
            </h3>
            <Button
              id="toggle-add-player-form-btn"
              type="button"
              onClick={() => {
                setIsAdding(!isAdding);
                setIsAddingStaff(false);
              }}
              aria-expanded={isAdding}
              className="h-8 rounded-lg border border-indigo-650/10 bg-indigo-600 px-3.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm hover:bg-indigo-700"
            >
              {isAdding ? <Plus size={12} className="rotate-45" /> : <UserPlus size={12} />}
              <span>{isAdding ? 'Cancel' : 'Add Player'}</span>
            </Button>
          </div>

          {/* Add Player Form (Expands inline) */}
          {isAdding && (
            <motion.div 
              id="add-player-fom-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={rosterGlassFormClass}
            >
              <div className="flex items-center gap-2 border-b border-cyan-300/10 pb-2">
                <UserPlus className="text-indigo-600" size={18} />
                <h3 className="font-display text-sm font-black uppercase tracking-wider text-slate-100">Register New athlete</h3>
              </div>

              <form ref={addPlayerFormRef} onSubmit={handleAddSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-4" noValidate>
                <div className="lg:col-span-4">
                  <FormErrorSummary id="add-player-error-summary" errors={playerFormErrors} />
                </div>
                <div className={`${rosterGlassInsetClass} flex items-center gap-4 p-4 lg:col-span-4`}>
                  <div className="relative shrink-0">
                    <img 
                      src={newPlayerPhoto || getPlayerPlaceholder(newPlayerPos)}
                      alt="Player Preview" 
                      className="h-12 w-12 rounded-full border border-cyan-300/15 object-cover object-top"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="mb-1 block text-slate-400">Athlete Photo</Label>
                    <Input
                      id="new-player-photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setNewPlayerPhoto(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('new-player-photo')?.click()}
                      variant="outline"
                      size="sm"
                      className="h-8 border-cyan-300/15 bg-[#0b1726]/85 text-[11px] text-slate-100 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100"
                    >
                      Upload Custom Photo
                    </Button>
                    {newPlayerPhoto && (
                      <Button
                        type="button"
                        onClick={() => setNewPlayerPhoto('')}
                        variant="link"
                        className="ml-3 text-[11px] text-rose-500"
                      >
                        Clear Image
                      </Button>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <Label className="mb-1.5 block text-slate-400">Full Athlete Name *</Label>
                  <Input
                    id="new-player-name-input"
                    data-validation-field="name"
                    type="text" 
                    placeholder="e.g. Liam Fitzpatrick"
                    value={newPlayerName}
                    onChange={e => {
                      setNewPlayerName(e.target.value);
                      setPlayerFormErrors(previous => ({ ...previous, name: undefined }));
                    }}
                    aria-invalid={Boolean(playerFormErrors.name)}
                    aria-describedby={playerFormErrors.name ? 'new-player-name-error' : undefined}
                    className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 ${
                      playerFormErrors.name
                        ? 'border-rose-300 focus-visible:ring-rose-500/30'
                        : 'border-cyan-300/10 focus-visible:ring-orange-300/25'
                    }`}
                  />
                  <FieldError id="new-player-name-error" message={playerFormErrors.name} />
                </div>

                <div>
                  <Label className="mb-1.5 block text-slate-400">Squad Number *</Label>
                  <Input
                    id="new-player-jersey-input"
                    data-validation-field="number"
                    type="number" 
                    min="1" 
                    max="99" 
                    step="1"
                    inputMode="numeric"
                    placeholder="e.g. 19"
                    value={newPlayerNumber}
                    onChange={e => {
                      setNewPlayerNumber(e.target.value);
                      setPlayerFormErrors(previous => ({ ...previous, number: undefined }));
                    }}
                    aria-invalid={Boolean(playerFormErrors.number)}
                    aria-describedby={playerFormErrors.number ? 'new-player-jersey-error' : duplicateJerseyPlayer ? 'new-player-jersey-warning' : undefined}
                    className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 ${
                      playerFormErrors.number
                        ? 'border-rose-300 focus-visible:ring-rose-500/30'
                        : 'border-cyan-300/10 focus-visible:ring-orange-300/25'
                    }`}
                  />
                  <FieldError id="new-player-jersey-error" message={playerFormErrors.number} />
                  {duplicateJerseyPlayer && !playerFormErrors.number && (
                    <p id="new-player-jersey-warning" className="mt-1 text-[11px] font-semibold text-amber-700">
                      Jersey #{newPlayerNumber} is already used by {duplicateJerseyPlayer.name}. You can still register this player.
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-1.5 block text-slate-400">Position *</Label>
                  <Select
                    value={newPlayerPos}
                    onValueChange={value => {
                      handlePositionChange(value);
                      setPlayerFormErrors(previous => ({ ...previous, position: undefined }));
                    }}
                  >
                    <SelectTrigger
                      id="new-player-position-select"
                      data-validation-field="position"
                      aria-invalid={Boolean(playerFormErrors.position)}
                      aria-describedby={playerFormErrors.position ? 'new-player-position-error' : undefined}
                      className={`h-10 rounded-xl text-xs ${
                        playerFormErrors.position
                          ? 'border-rose-300 focus:ring-rose-500/30'
                          : 'border-cyan-300/10 bg-[#0b1726]/85 text-slate-100 focus:ring-indigo-500/30'
                      }`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-cyan-300/15 bg-[#0b1726] text-slate-100">
                      {PLAYER_POSITIONS.map(position => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError id="new-player-position-error" message={playerFormErrors.position} />
                </div>

                <div>
                  <Label className="mb-1.5 block text-slate-400">Age</Label>
                  <Input
                    id="new-player-age-input"
                    data-validation-field="age"
                    type="number"
                    min="10"
                    max="80"
                    step="1"
                    inputMode="numeric"
                    placeholder="e.g. 24"
                    value={newPlayerAge}
                    onChange={e => {
                      setNewPlayerAge(e.target.value);
                      setPlayerFormErrors(previous => ({ ...previous, age: undefined }));
                    }}
                    aria-invalid={Boolean(playerFormErrors.age)}
                    aria-describedby={playerFormErrors.age ? 'new-player-age-error' : undefined}
                    className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 ${
                      playerFormErrors.age
                        ? 'border-rose-300 focus-visible:ring-rose-500/30'
                        : 'border-cyan-300/10 focus-visible:ring-orange-300/25'
                    }`}
                  />
                  <FieldError id="new-player-age-error" message={playerFormErrors.age} />
                </div>

                <div>
                  <Label className="mb-1.5 block text-slate-400">Height (cm)</Label>
                  <Input
                    id="new-player-height-input"
                    data-validation-field="height"
                    type="number"
                    min="100"
                    max="250"
                    step="1"
                    inputMode="numeric"
                    placeholder="e.g. 180"
                    value={newPlayerHeight}
                    onChange={e => {
                      setNewPlayerHeight(e.target.value);
                      setPlayerFormErrors(previous => ({ ...previous, height: undefined }));
                    }}
                    aria-invalid={Boolean(playerFormErrors.height)}
                    aria-describedby={playerFormErrors.height ? 'new-player-height-error' : undefined}
                    className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 ${
                      playerFormErrors.height
                        ? 'border-rose-300 focus-visible:ring-rose-500/30'
                        : 'border-cyan-300/10 focus-visible:ring-orange-300/25'
                    }`}
                  />
                  <FieldError id="new-player-height-error" message={playerFormErrors.height} />
                </div>

                <div>
                  <Label className="mb-1.5 block text-slate-400">Weight (kg)</Label>
                  <Input
                    id="new-player-weight-input"
                    data-validation-field="weight"
                    type="number"
                    min="30"
                    max="250"
                    step="1"
                    inputMode="numeric"
                    placeholder="e.g. 75"
                    value={newPlayerWeight}
                    onChange={e => {
                      setNewPlayerWeight(e.target.value);
                      setPlayerFormErrors(previous => ({ ...previous, weight: undefined }));
                    }}
                    aria-invalid={Boolean(playerFormErrors.weight)}
                    aria-describedby={playerFormErrors.weight ? 'new-player-weight-error' : undefined}
                    className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 ${
                      playerFormErrors.weight
                        ? 'border-rose-300 focus-visible:ring-rose-500/30'
                        : 'border-cyan-300/10 focus-visible:ring-orange-300/25'
                    }`}
                  />
                  <FieldError id="new-player-weight-error" message={playerFormErrors.weight} />
                </div>

                <div className={`${rosterGlassInsetClass} p-4 lg:col-span-4`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <Label className="block text-slate-500">
                        {newPlayerPos} Traits
                      </Label>
                      <p className="mt-1 text-[10px] text-slate-400">Choose up to four traits for this player.</p>
                    </div>
                    <span className="rounded-lg border border-orange-300/20 bg-orange-300/10 px-2 py-1 text-[10px] font-black text-orange-100">
                      {newPlayerTraits.length}/4 selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableTraits(newPlayerPos).map((trait) => {
                      const isSelected = newPlayerTraits.includes(trait.label);
                      const selectionLimitReached = newPlayerTraits.length >= 4 && !isSelected;

                      return (
                        <Button
                          key={trait.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-pressed={isSelected}
                          disabled={selectionLimitReached}
                          onClick={() => handleToggleTrait(trait.label)}
                          className={`h-auto rounded-lg px-2.5 py-1.5 text-[10px] ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                              : 'border-cyan-300/15 bg-[#0b1726]/85 text-slate-300 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100'
                          }`}
                        >
                          <span className="mr-1">{trait.icon}</span>
                          {trait.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <Label className="mb-1.5 block text-slate-400">Short Bio Statement (Optional)</Label>
                  <Textarea
                    id="new-player-bio-input"
                    placeholder="Write a brief synopsis of the player's background, past clubs, strengths..."
                    value={newPlayerBio}
                    onChange={e => setNewPlayerBio(e.target.value)}
                    rows={2}
                    className="min-h-20 rounded-xl text-xs focus-visible:ring-indigo-500/30"
                  />
                </div>

                <div className="lg:col-span-4 flex flex-col sm:flex-row justify-end gap-2 p-1">
                  <Button
                    id="cancel-add-player-btn"
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-cyan-300/15 bg-[#0b1726]/85 text-slate-100 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    id="submit-add-player-btn"
                    type="submit" 
                    size="sm"
                    className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Register Athlete
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {activeRoster.length > 0 ? (
            <div id="roster-grid" className="grid grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeRoster.map((player) => {
                const isIntegrityHighlighted = highlightPlayerId === player.id;
                const ovr = calculateOVR(player.baseAttributes, player.positionAttributes);
                const bAttr = player.baseAttributes || { pace: 50, stamina: 50, agility: 50, strength: 50, firstTouch: 50, shortPassing: 50 };
                const pAttr = player.positionAttributes || {};

                // Position-aware colors
                const posColors: Record<string, string> = {
                  'Forward': 'bg-rose-600/90 text-rose-100 border-rose-400/30',
                  'Midfielder': 'bg-emerald-600/90 text-emerald-100 border-emerald-400/30',
                  'Defender': 'bg-sky-600/90 text-sky-100 border-sky-400/30',
                  'Goalkeeper': 'bg-amber-500/90 text-amber-950 border-amber-300/30'
                };
                const posColor = posColors[player.position] || 'bg-slate-600/90 text-slate-100 border-slate-400/30';
                const shortPos = player.position === 'Forward' ? 'FWD' : player.position === 'Midfielder' ? 'MID' : player.position === 'Defender' ? 'DEF' : 'GK';

                // Pick 4 most relevant attributes by position
                const getTopAttrs = () => {
                  if (player.position === 'Goalkeeper') {
                    return [
                      { label: 'DIV', value: pAttr['Diving'] || 50, color: 'bg-sky-500' },
                      { label: 'HAN', value: pAttr['Handling'] || 50, color: 'bg-yellow-500' },
                      { label: 'REF', value: pAttr['Reflexes'] || 50, color: 'bg-rose-500' },
                      { label: 'PAC', value: bAttr.pace, color: 'bg-emerald-500' }
                    ];
                  } else if (player.position === 'Defender') {
                    return [
                      { label: 'TAC', value: pAttr['Tackling'] || 50, color: 'bg-sky-500' },
                      { label: 'STR', value: bAttr.strength, color: 'bg-purple-500' },
                      { label: 'PAC', value: bAttr.pace, color: 'bg-indigo-500' },
                      { label: 'PAS', value: bAttr.shortPassing, color: 'bg-emerald-500' }
                    ];
                  } else if (player.position === 'Midfielder') {
                    return [
                      { label: 'PAS', value: bAttr.shortPassing, color: 'bg-emerald-500' },
                      { label: 'VIS', value: pAttr['Vision'] || 50, color: 'bg-amber-500' },
                      { label: 'AGI', value: bAttr.agility, color: 'bg-rose-500' },
                      { label: 'STA', value: bAttr.stamina, color: 'bg-amber-400' }
                    ];
                  } else { // Forward
                    return [
                      { label: 'FIN', value: pAttr['Finishing'] || 50, color: 'bg-rose-500' },
                      { label: 'PAC', value: bAttr.pace, color: 'bg-indigo-500' },
                      { label: 'AGI', value: bAttr.agility, color: 'bg-amber-500' },
                      { label: 'STR', value: bAttr.strength, color: 'bg-purple-500' }
                    ];
                  }
                };
                const topAttrs = getTopAttrs();

                return (
                  <motion.div
                    id={`player-${player.id}-card`}
                    key={player.id}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className={`h-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer group flex flex-col ${
                      isIntegrityHighlighted ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-[#020713]' : ''
                    }`}
                    style={{
                      background: '#1a1a2e'
                    }}
                    onClick={() => onSelectPlayer(player)}
                  >
                    {/* Photo area with gradient fade */}
                    <div className="relative w-full aspect-[3/4] overflow-hidden">
                      <img 
                        src={player.photoUrl} 
                        alt={player.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      {/* Bottom gradient fade into dark card */}
                      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/60 to-transparent" />
                      {/* Top subtle fade for badges */}
                      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />

                      {/* Position badge - top left */}
                      <div className="absolute top-3 left-3">
                        <span className={`text-[11px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-md border ${posColor}`}>
                          {shortPos}
                        </span>
                      </div>
                      {isIntegrityHighlighted && (
                        <div className="absolute top-3 right-16">
                          <span className="rounded-md border border-amber-200 bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-900">
                            Review
                          </span>
                        </div>
                      )}

                      {/* Jersey number - top right */}
                      <div className="absolute top-3 right-3">
                        <span className="text-[15px] font-black text-white/90 drop-shadow-md tracking-wide">
                          #{player.number}
                        </span>
                      </div>

                      {/* OVR Rating - bottom left, large */}
                      <div className="absolute bottom-3 left-3">
                        <div className="flex items-end gap-1">
                          <span className="text-[38px] font-black text-white leading-none drop-shadow-lg tracking-tighter">{ovr}</span>
                          <span className="text-[12px] font-black text-amber-400 uppercase tracking-widest mb-1">OVR</span>
                        </div>
                      </div>

                      {/* Player name - bottom */}
                      <div className="absolute bottom-3 right-3 text-right max-w-[60%]">
                        <h4 className="text-[13px] font-black text-white leading-tight drop-shadow-lg">
                          {player.name.split(' ').map((part, i) => (
                            <span key={i} className="block">{part}</span>
                          ))}
                        </h4>
                      </div>
                    </div>

                    {/* Stats row - GP / G / A */}
                    <div className="px-3.5 pt-3 pb-1 flex items-center justify-between bg-[#1a1a2e]">
                      <div className="flex-1 text-center">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">GP</div>
                        <div className="text-sm font-black text-white mt-0.5">{player.gamesPlayed}</div>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="flex-1 text-center">
                        <div className="text-[9px] font-black text-rose-400/60 uppercase tracking-widest">G</div>
                        <div className="text-sm font-black text-white mt-0.5">{player.points}</div>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="flex-1 text-center">
                        <div className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest">A</div>
                        <div className="text-sm font-black text-white mt-0.5">{player.assists}</div>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="px-3.5"><div className="border-b border-white/10" /></div>

                    {/* Attribute bars section - 4 max */}
                    <div className="px-3.5 py-2 flex flex-col gap-1 bg-[#1a1a2e]">
                      {topAttrs.map((attr) => (
                        <div key={attr.label} className="flex items-center gap-2">
                          <span className="text-[8px] font-black text-slate-400 w-6 text-right tracking-wider">{attr.label}</span>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${attr.color} rounded-full transition-all duration-500`}
                              style={{ width: `${attr.value}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-white/60 w-6 text-right tabular-nums">{attr.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Traits + age footer */}
                    <div className="mt-auto min-h-10 px-3.5 pb-3 flex items-end justify-between gap-2 bg-[#1a1a2e]">
                      <div className="flex flex-wrap gap-1 max-w-[60%]">
                        {player.specialtyTraits && player.specialtyTraits.length > 0 ? (
                          player.specialtyTraits.slice(0, 2).map(trait => (
                            <span key={trait} className="text-[10px] font-bold bg-white/15 text-white/80 px-2 py-0.5 rounded border border-white/10">
                              {trait}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-medium text-white/25 italic">
                            {player.position === 'Forward' ? 'Attacker' : player.position === 'Midfielder' ? 'Midfielder' : player.position === 'Defender' ? 'Defender' : 'Goalkeeper'}
                          </span>
                        )}
                        {(player.yellowCards > 0 || player.redCards > 0) && (
                          <span className="text-[9px] font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            {player.yellowCards > 0 && <span>🟨{player.yellowCards}</span>}
                            {player.redCards > 0 && <span>🟥{player.redCards}</span>}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {player.age && <span className="text-[10px] font-bold text-white/50">{player.age} yrs</span>}
                        {player.height && <span className="text-[10px] font-bold text-white/50">{player.height} cm</span>}
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className={`${rosterGlassPanelClass} col-span-full flex flex-col items-center justify-center space-y-3 py-12 text-center`}>
              <AlertCircle size={32} className="text-slate-300 animate-bounce" />
              <h4 className="font-semibold text-slate-100">No members match criteria</h4>
              <p className="text-slate-400 text-xs">Try clearing search filters or add a new athlete register!</p>
            </div>
          )}
        </div>}

        {activeSection === 'payments' && (
          <SquadPaymentsPanel
            players={players}
            entries={paymentLedger}
            onAddEntry={onAddPaymentLedgerEntry}
            onAddBulkEntries={onAddBulkPaymentLedgerEntries}
            onVoidEntry={onVoidPaymentLedgerEntry}
          />
        )}
      </div>

      {activeSection === 'players' && showCompareWidget && (
        <PlayerComparer 
          players={players}
          selectedCompareIds={selectedCompareIds}
          onToggleCompare={handleToggleCompare}
          onClearCompare={handleClearCompare}
        />
      )}

    </div>
  );
}
