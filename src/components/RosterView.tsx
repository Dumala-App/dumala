import React, { useRef, useState } from 'react';
import { Player, isStaffPosition, STAFF_POSITIONS, SPECIALTY_TRAITS, SpecialtyTrait } from '../types';
import { 
  UserPlus, Search, Shield, Plus, AlertCircle, Download, Upload,
  Award, ArrowLeftRight, Mail, Phone, Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import PlayerComparer from './PlayerComparer';
import { getPlayerPlaceholder, STAFF_PLACEHOLDER } from '../playerPlaceholders';

interface RosterViewProps {
  players: Player[];
  onAddPlayer: (newPlayer: Player) => void;
  onSelectPlayer: (player: Player) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<void>;
  onUpdatePlayer?: (player: Player) => void;
}

export default function RosterView({ players, onAddPlayer, onSelectPlayer, onExportBackup, onImportBackup, onUpdatePlayer }: RosterViewProps) {
  // Search & Basic Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPos, setFilterPos] = useState("All");

  // Comparison State
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [showCompareWidget, setShowCompareWidget] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    try {
      await onImportBackup(file);
      setBackupMessage('Backup restored successfully.');
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : 'The backup could not be restored.');
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
    if (!newPlayerName.trim() || !newPlayerNumber) return;

    const playerPhoto = newPlayerPhoto || getPlayerPlaceholder(newPlayerPos);

    const statsTemplate = {
      speed: Math.floor(Math.random() * 25) + 68,
      shooting: Math.floor(Math.random() * 30) + 55,
      passing: Math.floor(Math.random() * 30) + 58,
      dribbling: Math.floor(Math.random() * 30) + 55,
      defending: Math.floor(Math.random() * 45) + 38,
      physicalness: Math.floor(Math.random() * 25) + 63
    };

    const newPlayer: Player = {
      id: "p_" + Date.now(),
      name: newPlayerName,
      number: Number(newPlayerNumber),
      position: newPlayerPos,
      bio: newPlayerBio || `${newPlayerName} joined the roster. Highly motivated athlete.`,
      photoUrl: playerPhoto,
      age: newPlayerAge ? Number(newPlayerAge) : undefined,
      height: newPlayerHeight ? Number(newPlayerHeight) : undefined,
      weight: newPlayerWeight ? Number(newPlayerWeight) : undefined,
      specialtyTraits: newPlayerTraits.length > 0 ? newPlayerTraits : undefined,
      gamesPlayed: 0,
      points: 0,
      assists: 0,
      cleanSheetsOrRebounds: 0,
      minutesPlayed: 0,
      mvpAwards: 0,
      yellowCards: 0,
      redCards: 0,
      attributes: statsTemplate,
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

    const newStaff: Player = {
      id: "staff_" + Date.now(),
      name: newStaffName,
      number: 0,
      position: roleToSave,
      bio: newStaffBio || `${newStaffName} has joined the management and staff team as ${roleToSave}.`,
      photoUrl: newStaffPhoto || STAFF_PLACEHOLDER,
      email: newStaffEmail || undefined,
      phone: newStaffPhone || undefined,
      since: newStaffSince || undefined,
      gamesPlayed: 0,
      points: 0,
      assists: 0,
      cleanSheetsOrRebounds: 0,
      minutesPlayed: 0,
      mvpAwards: 0,
      yellowCards: 0,
      redCards: 0,
      attributes: {
        speed: 50,
        shooting: 50,
        passing: 50,
        dribbling: 50,
        defending: 50,
        physicalness: 50
      },
      registrationStatus: 'Active'
    };

    onAddPlayer(newStaff);

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
  const calculateOVR = (attrs: Player['attributes']) => {
    return Math.round(
      (attrs.speed + 
       attrs.shooting + 
       attrs.passing + 
       attrs.dribbling + 
       attrs.defending + 
       attrs.physicalness) / 6
    );
  };

  // Helper getting deterministic specialized badges
  const getSpecializedTag = (player: Player) => {
    const attrs = player.attributes;
    const highestAttr = Object.entries(attrs).reduce((prev, curr) => prev[1] > curr[1] ? prev : curr);
    
    switch (highestAttr[0]) {
      case 'speed': 
        return { label: "Speedster", icon: "⚡", style: "bg-blue-900/80 text-blue-200 border-blue-500/30" };
      case 'shooting': 
        return { label: "Sniper", icon: "🎯", style: "bg-rose-905 bg-rose-900/80 text-rose-200 border-rose-500/30" };
      case 'passing': 
        return { label: "Maestro", icon: "🪄", style: "bg-emerald-900/80 text-emerald-200 border-emerald-500/30" };
      case 'dribbling': 
        return { label: "Magician", icon: "🕺", style: "bg-amber-900/80 text-amber-200 border-amber-500/30" };
      case 'defending': 
        return { label: "Sentinel", icon: "🧱", style: "bg-purple-900/80 text-purple-200 border-purple-500/30" };
      default: 
        return { label: "Stamina Tank", icon: "💪", style: "bg-slate-900/80 text-slate-200 border-slate-500/30" };
    }
  };

  // Filter roster
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          player.number.toString().includes(searchTerm);
    const matchesPosition = filterPos === "All" || player.position === filterPos;
    return matchesSearch && matchesPosition;
  });

  const staffMembers = filteredPlayers.filter(p => isStaffPosition(p.position));
  const activeRoster = filteredPlayers.filter(p => !isStaffPosition(p.position));

  return (
    <div id="roster-view-container" className="space-y-6">
      
      {/* Dynamic Header banner */}
      <div className="bg-[#0f172a] text-white rounded-2xl p-6 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
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
              Synthesize your squad metrics. View profiles, register new athletes, or download full-scope backups below.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Top Controls: Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4.5 rounded-2xl shadow-md shadow-slate-100/30 border border-slate-200/60 font-medium">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            <input 
              id="search-roster-input"
              type="text" 
              placeholder="Search athletic name or jersey code..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 text-slate-800 font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-2 hidden lg:inline">Filters:</span>
            {["All", "Forward", "Midfielder", "Defender", "Goalkeeper"].map((pos) => (
              <button
                id={`filter-pos-${pos.toLowerCase()}`}
                key={pos}
                onClick={() => setFilterPos(pos)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all border ${
                  filterPos === pos 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {pos}s
              </button>
            ))}

            <div className="h-4 border-l border-slate-200 mx-1 hidden md:block"></div>

            <button
              id="toggle-compare-widget-btn"
              onClick={() => setShowCompareWidget(!showCompareWidget)}
              className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5 border ${
                showCompareWidget
                  ? 'bg-indigo-50 hover:bg-indigo-100/80 text-indigo-750 border-indigo-200 font-extrabold'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title="Toggle Athlete Comparison Matchup Board"
            >
              <ArrowLeftRight size={12} className="stroke-[2.5]" />
              <span>{showCompareWidget ? 'Hide Compare' : 'Compare Tool'}</span>
            </button>

            <button
              id="btn-export-backup"
              onClick={onExportBackup}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
              title="Export team data to JSON backup file"
            >
              <Download size={12} className="stroke-[2.5]" />
              <span>Backup</span>
            </button>

            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => void handleImportFile(event.target.files?.[0])}
              aria-label="Restore team backup file"
            />
            <button
              id="btn-import-backup"
              onClick={() => importInputRef.current?.click()}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
              title="Restore team data from a JSON backup file"
            >
              <Upload size={12} className="stroke-[2.5]" />
              <span>Restore</span>
            </button>

          </div>
          {backupMessage && (
            <p className="mt-2 text-[10px] font-bold text-slate-600" role="status">
              {backupMessage}
            </p>
          )}
        </div>

        {/* Section Layouts */}
        <div id="management-staff-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-slate-800 text-lg uppercase tracking-wider flex items-center gap-2">
              <Shield className="text-amber-500" size={20} />
              Management & Staff
            </h3>
            <button 
              id="toggle-add-staff-form-btn"
              onClick={() => {
                setIsAddingStaff(!isAddingStaff);
                setIsAdding(false);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5 border border-amber-500/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isAddingStaff ? <Plus size={12} className="rotate-45" /> : <UserPlus size={12} />}
              <span>{isAddingStaff ? 'Cancel' : 'Add Staff'}</span>
            </button>
          </div>

          {/* Add Staff form */}
          {isAddingStaff && (
            <motion.div 
              id="add-staff-form-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-md shadow-slate-100/35 space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Shield className="text-amber-500" size={18} />
                <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider">Add Management or Staff Member</h3>
              </div>

              <form onSubmit={handleAddStaffSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4 flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="relative shrink-0">
                    <img 
                      src={newStaffPhoto || STAFF_PLACEHOLDER}
                      alt="Staff Preview" 
                      className="w-12 h-12 rounded-full object-cover object-top border border-slate-200"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">STAFF PHOTO</label>
                    <input 
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
                    <button
                      type="button"
                      onClick={() => document.getElementById('new-staff-photo')?.click()}
                      className="bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      Upload Custom Photo
                    </button>
                    {newStaffPhoto && (
                      <button
                        type="button"
                        onClick={() => setNewStaffPhoto('')}
                        className="text-[11px] text-rose-500 hover:underline ml-3"
                      >
                        Clear Image
                      </button>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name *</label>
                  <input 
                    id="new-staff-name-input"
                    type="text" 
                    required 
                    placeholder="e.g. Richard Hendricks"
                    value={newStaffName}
                    onChange={e => setNewStaffName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Role / Position *</label>
                  <select
                    id="new-staff-role-select"
                    value={newStaffRole}
                    onChange={e => setNewStaffRole(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="Founder">Founder</option>
                    <option value="Manager">Manager</option>
                    <option value="Coach">Coach</option>
                    <option value="Vice President">Vice President</option>
                    <option value="President">President</option>
                    <option value="Team Owner">Team Owner</option>
                    <option value="Director of Football">Director of Football</option>
                    <option value="Assistant Coach">Assistant Coach</option>
                    <option value="Staff">Staff</option>
                    <option value="Other">Other / Custom Title</option>
                  </select>
                </div>

                {newStaffRole === "Other" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Custom Role Title *</label>
                    <input 
                      id="custom-staff-role-input"
                      type="text" 
                      required 
                      placeholder="e.g. Treasurer"
                      value={customStaffRole}
                      onChange={e => setCustomStaffRole(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}

                <div className="md:col-span-4 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                    <input 
                      id="new-staff-email-input"
                      type="email"
                      placeholder="coach@club.com"
                      value={newStaffEmail}
                      onChange={e => setNewStaffEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone</label>
                    <input 
                      id="new-staff-phone-input"
                      type="text"
                      placeholder="+1 234 567 890"
                      value={newStaffPhone}
                      onChange={e => setNewStaffPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Since</label>
                    <input 
                      id="new-staff-since-input"
                      type="text"
                      placeholder="e.g. Jan 2025"
                      value={newStaffSince}
                      onChange={e => setNewStaffSince(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Short Bio Statement (Optional)</label>
                  <textarea 
                    id="new-staff-bio-input"
                    placeholder="Write a brief description of their background, philosophy, key responsibilities..."
                    value={newStaffBio}
                    onChange={e => setNewStaffBio(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="md:col-span-4 flex justify-end gap-2 p-1">
                  <button 
                    id="cancel-add-staff-btn"
                    type="button" 
                    onClick={() => setIsAddingStaff(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 text-xs font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    id="submit-add-staff-btn"
                    type="submit" 
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-md"
                  >
                    Add Staff Member
                  </button>
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
                    className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-sm transition-all flex flex-col justify-between group relative"
                  >
                    <div className="relative h-44 bg-slate-800 overflow-hidden">
                      <img 
                        src={staff.photoUrl} 
                        alt={staff.name}
                        onClick={() => onSelectPlayer(staff)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer opacity-80"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
                      
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-amber-500/90 backdrop-blur-md text-slate-950 border border-amber-400 text-[10px] uppercase font-black px-2 py-1 rounded-md tracking-wider">
                          {staff.position}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 text-white">
                        <h4 
                          onClick={() => onSelectPlayer(staff)}
                          className="font-display font-bold text-lg leading-tight truncate w-40 cursor-pointer hover:text-amber-400 transition-colors"
                        >
                          {staff.name}
                        </h4>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-2 bg-slate-950 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Staff Directory</span>
                        <button 
                          onClick={() => onSelectPlayer(staff)}
                          className="text-amber-400 font-bold hover:underline flex items-center gap-0.5 text-xs"
                        >
                          Profile &rarr;
                        </button>
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
            <div className="bg-slate-100 text-center py-8 rounded-2xl border border-slate-200/60 flex flex-col items-center justify-center space-y-2">
              <Shield size={24} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">No management or staff listed</h4>
              <p className="text-slate-400 text-[11px]">Click "Add Staff" above to register founders, directors, coaches, and more!</p>
            </div>
          )}
        </div>

        {/* Grid Layout of Upgraded Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-slate-800 text-lg uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="text-indigo-500" size={20} />
              Active Roster
            </h3>
            <button 
              id="toggle-add-player-form-btn"
              onClick={() => {
                setIsAdding(!isAdding);
                setIsAddingStaff(false);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5 border border-indigo-650/10"
            >
              {isAdding ? <Plus size={12} className="rotate-45" /> : <UserPlus size={12} />}
              <span>{isAdding ? 'Cancel' : 'Add Player'}</span>
            </button>
          </div>

          {/* Add Player Form (Expands inline) */}
          {isAdding && (
            <motion.div 
              id="add-player-fom-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-md shadow-slate-100/35 space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <UserPlus className="text-indigo-600" size={18} />
                <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider">Register New athlete</h3>
              </div>

              <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4 flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="relative shrink-0">
                    <img 
                      src={newPlayerPhoto || getPlayerPlaceholder(newPlayerPos)}
                      alt="Player Preview" 
                      className="w-12 h-12 rounded-full object-cover object-top border border-slate-200"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ATHLETE PHOTO</label>
                    <input 
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
                    <button
                      type="button"
                      onClick={() => document.getElementById('new-player-photo')?.click()}
                      className="bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      Upload Custom Photo
                    </button>
                    {newPlayerPhoto && (
                      <button
                        type="button"
                        onClick={() => setNewPlayerPhoto('')}
                        className="text-[11px] text-rose-500 hover:underline ml-3"
                      >
                        Clear Image
                      </button>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Athlete Name *</label>
                  <input 
                    id="new-player-name-input"
                    type="text" 
                    required 
                    placeholder="e.g. Liam Fitzpatrick"
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Squad Number *</label>
                  <input 
                    id="new-player-jersey-input"
                    type="number" 
                    required 
                    min="1" 
                    max="99" 
                    placeholder="e.g. 19"
                    value={newPlayerNumber}
                    onChange={e => setNewPlayerNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Position *</label>
                  <select
                    id="new-player-position-select"
                    value={newPlayerPos}
                    onChange={e => handlePositionChange(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Forward">Forward</option>
                    <option value="Midfielder">Midfielder</option>
                    <option value="Defender">Defender</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Age</label>
                  <input
                    id="new-player-age-input"
                    type="number"
                    min="10"
                    max="80"
                    placeholder="e.g. 24"
                    value={newPlayerAge}
                    onChange={e => setNewPlayerAge(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Height (cm)</label>
                  <input
                    id="new-player-height-input"
                    type="number"
                    min="100"
                    max="250"
                    placeholder="e.g. 180"
                    value={newPlayerHeight}
                    onChange={e => setNewPlayerHeight(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Weight (kg)</label>
                  <input
                    id="new-player-weight-input"
                    type="number"
                    min="30"
                    max="250"
                    placeholder="e.g. 75"
                    value={newPlayerWeight}
                    onChange={e => setNewPlayerWeight(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {newPlayerPos} Traits
                      </label>
                      <p className="mt-1 text-[10px] text-slate-400">Choose up to four traits for this player.</p>
                    </div>
                    <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-600">
                      {newPlayerTraits.length}/4 selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableTraits(newPlayerPos).map((trait) => {
                      const isSelected = newPlayerTraits.includes(trait.label);
                      const selectionLimitReached = newPlayerTraits.length >= 4 && !isSelected;

                      return (
                        <button
                          key={trait.label}
                          type="button"
                          aria-pressed={isSelected}
                          disabled={selectionLimitReached}
                          onClick={() => handleToggleTrait(trait.label)}
                          className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40'
                          }`}
                        >
                          <span className="mr-1">{trait.icon}</span>
                          {trait.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Short Bio Statement (Optional)</label>
                  <textarea 
                    id="new-player-bio-input"
                    placeholder="Write a brief synopsis of the player's background, past clubs, strengths..."
                    value={newPlayerBio}
                    onChange={e => setNewPlayerBio(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-4 flex justify-end gap-2 p-1">
                  <button 
                    id="cancel-add-player-btn"
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 text-xs font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    id="submit-add-player-btn"
                    type="submit" 
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
                  >
                    Register Athlete
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeRoster.length > 0 ? (
            <div id="roster-grid" className="grid grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeRoster.map((player) => {
                const ovr = calculateOVR(player.attributes);
                const attrs = player.attributes;

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
                      { label: 'DIV', value: attrs.speed, color: 'bg-sky-500' },
                      { label: 'HAN', value: attrs.defending, color: 'bg-yellow-500' },
                      { label: 'KIC', value: attrs.shooting, color: 'bg-rose-500' },
                      { label: 'REF', value: attrs.dribbling, color: 'bg-amber-500' }
                    ];
                  } else if (player.position === 'Defender') {
                    return [
                      { label: 'DEF', value: attrs.defending, color: 'bg-sky-500' },
                      { label: 'PHY', value: attrs.physicalness, color: 'bg-purple-500' },
                      { label: 'PAC', value: attrs.speed, color: 'bg-indigo-500' },
                      { label: 'PAS', value: attrs.passing, color: 'bg-emerald-500' }
                    ];
                  } else if (player.position === 'Midfielder') {
                    return [
                      { label: 'PAS', value: attrs.passing, color: 'bg-emerald-500' },
                      { label: 'DRI', value: attrs.dribbling, color: 'bg-amber-500' },
                      { label: 'SHO', value: attrs.shooting, color: 'bg-rose-500' },
                      { label: 'DEF', value: attrs.defending, color: 'bg-sky-500' }
                    ];
                  } else { // Forward
                    return [
                      { label: 'SHO', value: attrs.shooting, color: 'bg-rose-500' },
                      { label: 'PAC', value: attrs.speed, color: 'bg-indigo-500' },
                      { label: 'DRI', value: attrs.dribbling, color: 'bg-amber-500' },
                      { label: 'PHY', value: attrs.physicalness, color: 'bg-purple-500' }
                    ];
                  }
                };
                const topAttrs = getTopAttrs();

                return (
                  <motion.div
                    id={`player-${player.id}-card`}
                    key={player.id}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="h-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer group flex flex-col"
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
            <div className="col-span-full bg-white text-center py-12 rounded-2xl border border-slate-200/60 flex flex-col items-center justify-center space-y-3">
              <AlertCircle size={32} className="text-slate-300 animate-bounce" />
              <h4 className="font-semibold text-slate-700">No members match criteria</h4>
              <p className="text-slate-400 text-xs">Try clearing search filters or add a new athlete register!</p>
            </div>
          )}
        </div>
      </div>

      {showCompareWidget && (
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
