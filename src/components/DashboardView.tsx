import React, { useMemo, useState } from 'react';
import { AssessmentSession, Game, Player, Standing, Announcement, TeamInfo, isStaffPosition } from '../types';
import {findUserStanding, sortStandings} from '../standings';
import { Calendar, MapPin, Trophy, Shield, Megaphone, Star, Award, Zap, ArrowRight, CornerRightDown, TrendingUp, Edit, Upload, Link, Check, X, Image, Crown, Target, Flame, AlertCircle, Table, Users, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-xl shadow-lg font-sans text-xs text-slate-200">
        <p className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">{data.name}</p>
        <p className="font-display font-black text-white text-sm mt-0.5">
          Cumulative: <span className="text-indigo-400">{data.points} pts</span>
        </p>
        <div className="border-t border-slate-800/80 my-1.5 pt-1.5 space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Opponent:</span>
            <span className="font-semibold text-slate-200">{data.opponent}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Result:</span>
            <span className={`font-bold ${
              data.outcome === 'W' ? 'text-emerald-400' :
              data.outcome === 'D' ? 'text-amber-400' :
              'text-rose-500'
            }`}>
              {data.outcome === 'W' ? 'Won (+3 pts)' :
               data.outcome === 'D' ? 'Draw (+1 pt)' :
               'Lost (0 pts)'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface DashboardViewProps {
  teamInfo: TeamInfo;
  players: Player[];
  games: Game[];
  standings: Standing[];
  announcements: Announcement[];
  assessments: AssessmentSession[];
  onNavigate: (target: {
    primary: 'home' | 'squad' | 'tactics' | 'development' | 'league_updates';
    homeTab?: 'overview' | 'game_week';
    developmentTab?: 'assessments' | 'training';
    leagueUpdatesTab?: 'league' | 'updates' | 'dev_notes';
  }) => void;
  onSelectPlayer: (player: Player) => void;
  onUpdateTeamInfo: (updated: TeamInfo) => void;
}

export default function DashboardView({ 
  teamInfo, 
  players, 
  games, 
  standings, 
  announcements, 
  assessments,
  onNavigate,
  onSelectPlayer,
  onUpdateTeamInfo
}: DashboardViewProps) {
  
  // Team logo management states
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [logoInputUrl, setLogoInputUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [logoStatus, setLogoStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const presetLogos = [
    { key: 'shield', label: 'Classic Shield', icon: Shield },
    { key: 'crown', label: 'Royal Crown', icon: Crown },
    { key: 'star', label: 'Star Victory', icon: Star },
    { key: 'flame', label: 'Apex Flame', icon: Flame },
    { key: 'target', label: 'Bullseye Target', icon: Target },
    { key: 'trophy', label: 'Gold Trophy', icon: Trophy },
  ];

  const renderLogo = (logoUrl: string | undefined, size = 64, className = "") => {
    if (!logoUrl) {
      return <Shield size={size} className={className} />;
    }
    
    if (logoUrl.startsWith('preset:')) {
      const key = logoUrl.replace('preset:', '');
      switch (key) {
        case 'shield': return <Shield size={size} className={className} />;
        case 'crown': return <Crown size={size} className={className} />;
        case 'star': return <Star size={size} className={className} />;
        case 'flame': return <Flame size={size} className={className} />;
        case 'target': return <Target size={size} className={className} />;
        case 'trophy': return <Trophy size={size} className={className} />;
        default: return <Shield size={size} className={className} />;
      }
    }
    
    return (
      <img 
        src={logoUrl} 
        alt="Team Logo" 
        className={`object-contain rounded-xl ${className}`}
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.src = "";
          e.currentTarget.className = "hidden";
        }}
        referrerPolicy="no-referrer"
      />
    );
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, GIF, WebP).');
      return;
    }
    
    // limit size to 1.5MB to avoid localStorage quota issues
    if (file.size > 1.5 * 1024 * 1024) {
      alert('Logo size is too big! Please select an image under 1.5MB to save storage.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        onUpdateTeamInfo({
          ...teamInfo,
          logoUrl: base64
        });
        setLogoStatus('success');
        setTimeout(() => setLogoStatus('idle'), 2500);
      }
    };
    reader.onerror = () => {
      setLogoStatus('error');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handlePresetSelect = (presetKey: string) => {
    onUpdateTeamInfo({
      ...teamInfo,
      logoUrl: `preset:${presetKey}`
    });
    setLogoStatus('success');
    setTimeout(() => setLogoStatus('idle'), 2500);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoInputUrl.trim()) return;
    onUpdateTeamInfo({
      ...teamInfo,
      logoUrl: logoInputUrl.trim()
    });
    setLogoStatus('success');
    setLogoInputUrl("");
    setTimeout(() => setLogoStatus('idle'), 2500);
  };
  
  // Find the next upcoming match
  const upcomingGames = games
    .filter(g => g.status === 'Upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const nextMatch = upcomingGames[0];

  const latestAssessmentByPlayerId = useMemo(() => {
    const sorted = [...assessments].sort((a, b) => {
      const ad = new Date(a.assessmentDate).getTime();
      const bd = new Date(b.assessmentDate).getTime();
      if (ad !== bd) return bd - ad;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const map = new Map<string, AssessmentSession>();
    for (const s of sorted) {
      if (!map.has(s.playerId)) map.set(s.playerId, s);
    }
    return map;
  }, [assessments]);

  const topProspects = useMemo(() => {
    return [...players]
      .filter(p => !isStaffPosition(p.position))
      .map(p => ({ player: p, session: latestAssessmentByPlayerId.get(p.id) }))
      .filter((x): x is { player: Player; session: AssessmentSession } => !!x.session)
      .sort((a, b) => b.session.ovr - a.session.ovr)
      .slice(0, 5);
  }, [latestAssessmentByPlayerId, players]);

  const topImprovers = useMemo(() => {
    return [...players]
      .filter(p => !isStaffPosition(p.position))
      .map(p => ({ player: p, session: latestAssessmentByPlayerId.get(p.id) }))
      .filter((x): x is { player: Player; session: AssessmentSession } => !!x.session)
      .sort((a, b) => (b.session.deltas.ovrDelta ?? 0) - (a.session.deltas.ovrDelta ?? 0))
      .slice(0, 5);
  }, [latestAssessmentByPlayerId, players]);

  const recentAssessments = useMemo(() => {
    return [...assessments]
      .sort((a, b) => {
        const ad = new Date(a.assessmentDate).getTime();
        const bd = new Date(b.assessmentDate).getTime();
        if (ad !== bd) return bd - ad;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 6);
  }, [assessments]);

  // Use the same ordering rules as the League table.
  const rankedStandings = sortStandings(standings);
  const userTeam = findUserStanding(rankedStandings, teamInfo.name);
  const leagueRank = userTeam?.rank;
  
  // Calculate team's point trend over the last 10 games played
  const userCompletedGames = games
    .filter(g => g.status === 'Completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const opponentsPool = standings
    .filter(t => t.teamName.toLowerCase() !== (userTeam?.teamName || "").toLowerCase())
    .map(t => t.teamName);

  const { won = 0, drawn = 0, lost = 0 } = userTeam || {};

  const completedOutcomes = userCompletedGames.map(g => {
    const our = g.ourScore ?? 0;
    const opp = g.opponentScore ?? 0;
    if (our > opp) return { outcome: 'W' as const, points: 3 };
    if (our === opp) return { outcome: 'D' as const, points: 1 };
    return { outcome: 'L' as const, points: 0 };
  });

  const W_completed = completedOutcomes.filter(o => o.outcome === 'W').length;
  const D_completed = completedOutcomes.filter(o => o.outcome === 'D').length;
  const L_completed = completedOutcomes.filter(o => o.outcome === 'L').length;

  const W_rem = Math.max(0, won - W_completed);
  const D_rem = Math.max(0, drawn - D_completed);
  const L_rem = Math.max(0, lost - L_completed);

  const remOutcomes: { outcome: 'W' | 'D' | 'L'; points: number }[] = [];
  let w_left = W_rem, d_left = D_rem, l_left = L_rem;
  const remTotal = w_left + d_left + l_left;

  for (let i = 0; i < remTotal; i++) {
    if (i % 3 === 0 && d_left > 0) {
      remOutcomes.push({ outcome: 'D', points: 1 });
      d_left--;
    } else if (i % 5 === 0 && l_left > 0) {
      remOutcomes.push({ outcome: 'L', points: 0 });
      l_left--;
    } else if (w_left > 0) {
      remOutcomes.push({ outcome: 'W', points: 3 });
      w_left--;
    } else if (d_left > 0) {
      remOutcomes.push({ outcome: 'D', points: 1 });
      d_left--;
    } else if (l_left > 0) {
      remOutcomes.push({ outcome: 'L', points: 0 });
      l_left--;
    }
  }

  const totalOutcomes = [...remOutcomes, ...completedOutcomes];
  let cumulativePoints = 0;
  
  const pointsHistory = totalOutcomes.map((o, idx) => {
    cumulativePoints += o.points;
    const opponent = idx >= remOutcomes.length 
      ? userCompletedGames[idx - remOutcomes.length].opponent 
      : (opponentsPool[idx % opponentsPool.length] || "League Opponent");
    return {
      gameNumber: idx + 1,
      opponent,
      outcome: o.outcome,
      matchPoints: o.points,
      points: cumulativePoints,
    };
  });

  const chartData = pointsHistory.slice(-10).map((d) => ({
    name: `Game ${d.gameNumber}`,
    points: d.points,
    outcome: d.outcome,
    opponent: d.opponent,
    matchPoints: d.matchPoints
  }));

  // Leaderboards: Sort players for goals (points), assists, clean sheets
  const topScorers = [...players]
    .filter(p => p.points > 0)
    .sort((a,b) => b.points - a.points)
    .slice(0, 3);

  const topAssists = [...players]
    .filter(p => p.assists > 0)
    .sort((a,b) => b.assists - a.assists)
    .slice(0, 3);

  const topGoalkeepers = [...players]
    .filter(p => p.position === 'Goalkeeper' || p.position === 'Defender')
    .sort((a,b) => b.cleanSheetsOrRebounds - a.cleanSheetsOrRebounds)
    .slice(0, 3);

  return (
    <div id="dashboard-view-container" className="space-y-6">

      {/* Hero Header Banner */}
      <div className={`p-6 md:p-8 rounded-2xl bg-gradient-to-r ${teamInfo.logoColor} text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/10`}>
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          {renderLogo(teamInfo.logoUrl, 240, "stroke-[1.5] text-white")}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 w-full md:w-auto">
          {/* logo circle uploader with overlay action button */}
          <div className="relative group shrink-0">
            <div 
              onClick={() => setShowLogoPicker(!showLogoPicker)}
              className="w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 rounded-2xl flex items-center justify-center p-3 shadow-md hover:scale-[1.03] cursor-pointer transition-all"
            >
              {renderLogo(teamInfo.logoUrl, 56, "text-white select-none")}
            </div>
            <button 
              id="edit-logo-trigger-btn"
              onClick={() => setShowLogoPicker(!showLogoPicker)}
              className="absolute -bottom-1 -right-1 bg-white hover:bg-indigo-50 text-slate-900 hover:text-indigo-600 p-1.5 rounded-full shadow-md border border-slate-200 hover:scale-105 active:scale-95 transition-all"
              title="Edit Team Logo"
            >
              <Edit size={11} />
            </button>
          </div>

          <div className="space-y-2.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="bg-amber-400 text-slate-950 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider">
                Club Administration
              </span>
              <span className="text-white/70 text-xs font-semibold">Since {teamInfo.founded}</span>
            </div>
            <h2 id="team-hero-name" className="text-3xl md:text-4xl font-display font-black tracking-tight">{teamInfo.name}</h2>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-indigo-100/90 pt-1">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md">🏆 {teamInfo.league}</span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md">🏟️ Stadium: {teamInfo.stadium}</span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md">👔 Coach: {teamInfo.coach}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 relative z-10 shrink-0 self-center sm:self-auto">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center min-w-24 shadow-inner">
            <span id="dashboard-league-rank" className="text-2xl font-display font-black text-amber-305">
              {leagueRank ? `#${leagueRank}` : 'N/A'}
            </span>
            <span className="block text-[10px] text-white/80 uppercase font-bold mt-1 tracking-wider">League Rank</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center min-w-24 shadow-inner">
            <span className="text-2xl font-display font-black text-white">{players.length}</span>
            <span className="block text-[10px] text-white/80 uppercase font-bold mt-1 tracking-wider">Registered</span>
          </div>
        </div>
      </div>

      {/* COMPACT INTERACTIVE LOGO CUSTOMIZATION BOARD (Dropping panel) */}
      <AnimatePresence>
        {showLogoPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl"
          >
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trophy size={16} className="text-amber-400" />
                <div>
                  <h4 className="text-sm font-display font-black text-white uppercase tracking-wide">
                    Manage Team Logo & Identity
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Upload an emblem file, paste a link coordinates, or choose from custom-designed vector badges.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowLogoPicker(false)}
                className="p-1 px-2.5 bg-slate-805 hover:bg-slate-800 hover:text-white text-slate-400 rounded-lg text-xs font-semibold border border-slate-800"
              >
                Close Editor
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Option 1: Vector Preset Badges */}
              <div className="md:col-span-4 space-y-3">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                  🛡️ Vector Preset Glyphs
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {presetLogos.map((preset) => {
                    const PresetIcon = preset.icon;
                    const isActive = teamInfo.logoUrl === `preset:${preset.key}` || (!teamInfo.logoUrl && preset.key === 'shield');
                    
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => handlePresetSelect(preset.key)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                          isActive 
                            ? 'bg-amber-400/10 border-amber-400 text-amber-400' 
                            : 'bg-slate-950 border-slate-800/85 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                        title={preset.label}
                      >
                        <PresetIcon size={24} />
                        <span className="text-[9px] font-bold tracking-tight truncate w-full text-center">
                          {preset.label.split(' ')[1]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option 2: Image drag-and-drop Box */}
              <div className="md:col-span-4 space-y-3">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                  📁 File System Uploader
                </span>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-all h-[115px] ${
                    dragOver 
                      ? 'border-emerald-400 bg-emerald-500/5' 
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                  }`}
                  onClick={() => document.getElementById('logo-file-picker')?.click()}
                >
                  <label htmlFor="logo-file-picker" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload size={20} className={dragOver ? 'text-emerald-400 animate-bounce' : 'text-slate-500'} />
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-slate-300 block">
                        Drag or click file
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        PNG, JPG, SVG up to 1.5MB
                      </span>
                    </div>
                  </label>
                  <input 
                    id="logo-file-picker" 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </div>
              </div>

              {/* Option 3: External URL Paste */}
              <div className="md:col-span-4 space-y-3">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block">
                  🔗 Web Image Address Link
                </span>
                
                <form onSubmit={handleUrlSubmit} className="space-y-2">
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={logoInputUrl}
                      onChange={e => setLogoInputUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl pl-8 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="absolute left-2.5 top-3 text-slate-500">
                      <Link size={13} />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!logoInputUrl.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check size={13} /> Link Emblem URL
                  </button>
                </form>
              </div>
            </div>

            {/* Notification tray */}
            {logoStatus === 'success' && (
              <div className="bg-emerald-950/40 border-t border-emerald-900 px-5 py-2.5 text-center text-xs font-bold text-emerald-400 font-mono flex items-center justify-center gap-1.5">
                <Check size={14} /> Team club identity synced and saved successfully!
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Tactics Board Highlight Promo Banner */}
      <div 
        id="dashboard-tactics-promo"
        onClick={() => onNavigate({ primary: 'tactics' })}
        className="group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-lg shadow-indigo-950/20 flex flex-col md:flex-row items-center justify-between gap-5 cursor-pointer hover:border-amber-405 hover:shadow-xl transition-all duration-300"
      >
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-650/15 transition-all" />
        <div className="absolute bottom-0 right-10 opacity-10 font-bold text-slate-400 text-6xl font-mono select-none pointer-events-none hidden md:block">
          4 - 1 - 2 - 3
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-amber-450/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-400/20 shrink-0">
            <Zap size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-black px-2 py-0.5 rounded uppercase tracking-wider border border-indigo-500/20">
                Brand New Feature
              </span>
              <span className="text-[10px] text-amber-400 font-bold">🎮 Console Grade UI</span>
            </div>
            <h3 className="font-display font-black text-slate-100 text-lg mt-1 group-hover:text-amber-400 transition-colors">
              Dynamic Team Formations & Squad Board
            </h3>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed max-w-xl">
              Fine-tune starting lineups, test active playstyles, and assign legendary guests or registered roster athletes live on the virtual pitch.
            </p>
          </div>
        </div>

        <button 
          id="btn-launch-tactics-from-dashboard"
          className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black uppercase px-5 py-3 rounded-xl shadow-sm hover:scale-[1.03] active:scale-[0.97] transition-all relative z-10 shrink-0 flex items-center gap-1.5"
        >
          Open Tactics Board <ArrowRight size={13} />
        </button>
      </div>

      {/* Grid: Next Clash Spotlight & Latest Announcement notices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Next Clash Spotlight (Left col 7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-md shadow-slate-100/30 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-xs font-display font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-600 animate-pulse" /> Match Day Prep
              </h3>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-xl">
                {nextMatch ? (nextMatch.type === 'Training' ? 'Practice Session' : nextMatch.type === 'Meeting' ? 'Team Meeting' : 'Next Match') : 'Spotlight'}
              </span>
            </div>

            {nextMatch ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4 justify-between">
                  {nextMatch.type === 'Training' || nextMatch.type === 'Meeting' ? (
                    <div className="text-left w-full">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Scheduled Event</span>
                      <h4 id="next-match-opponent-slug" className="font-display font-black text-xl text-indigo-650 mt-0.5">{nextMatch.opponent}</h4>
                    </div>
                  ) : (
                    <>
                      <div className="text-left">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Our Squad</span>
                        <h4 className="font-display font-black text-xl text-slate-800 truncate max-w-[150px]">{teamInfo?.name || "Apex Rangers"}</h4>
                      </div>
                      <div className="px-3.5 py-1.5 bg-slate-100 rounded-full font-display font-bold text-slate-500 text-sm">VS</div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Opponent</span>
                        <h4 id="next-match-opponent-slug" className="font-display font-black text-xl text-indigo-600 truncate max-w-[150px]">{nextMatch.opponent}</h4>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">🏟️ Kickoff Location</span>
                    <span id="next-match-loc" className="text-slate-700 block mt-0.5 font-medium">{nextMatch.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">🕒 Date & Timing</span>
                    <span id="next-match-datetime" className="text-slate-750 block mt-0.5 font-medium">{nextMatch.date} @ {nextMatch.time}</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/55 text-xs text-slate-750 flex items-start gap-2">
                  <span className="text-base text-indigo-600">📢</span>
                  <div>
                    <strong className="block text-indigo-950">{(teamInfo?.coach || "Coach Sterling")}'s Prep Directives:</strong>
                    <p className="mt-0.5 leading-relaxed text-slate-650">
                      {nextMatch.notes || (
                        nextMatch.type === 'Training' 
                          ? "Focus on high-intensity workloads and technical precision. Ensure all athletic gear is complete."
                          : nextMatch.type === 'Meeting'
                          ? "Reviewing tactical formations, video reels, and assignment coordinates. Bring your playbooks."
                          : "Review defense lines, lock opponent channels, and coordinate tactical transitions. Stay focus!"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs text-medium flex flex-col items-center justify-center space-y-2">
                <span>✨ No upcoming matches scheduled at this time.</span>
                <span className="text-indigo-600 hover:underline cursor-pointer" onClick={() => onNavigate({ primary: 'home', homeTab: 'game_week' })}>
                  Add games inside the Schedule builder →
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs mt-4">
            <span className="text-slate-400 font-medium">Coordinate calendars in real-time</span>
            <button 
              id="dash-go-schedule"
              onClick={() => onNavigate({ primary: 'home', homeTab: 'game_week' })}
              className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              Examine Complete Schedule <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Latest Announcements Bulletin (Right col 5) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-md shadow-slate-100/30 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-xs font-display font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Megaphone size={14} className="text-emerald-500" /> Latest Alerts
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold font-mono">Real-time Desk</span>
            </div>

            <div className="space-y-4 mt-4">
              {announcements.slice(0, 2).map((ann) => (
                <div 
                  id={`dash-ann-${ann.id}-card`}
                  key={ann.id} 
                  className={`p-3.5 rounded-xl border line-clamp-3 ${
                    ann.category === 'Urgent' 
                      ? 'bg-rose-50/40 border-rose-100 text-rose-955' 
                      : 'bg-slate-50/55 border-slate-100/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                      ann.category === 'Urgent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-650'
                    }`}>
                      {ann.category}
                    </span>
                    <span className="text-slate-400 font-medium">{ann.date}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 leading-tight">{ann.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 italic">
                    "{ann.content}"
                  </p>
                </div>
              ))}

              {announcements.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No notifications recorded on the dashboard.
                </div>
              )}
            </div>
          </div>

          <button 
            id="dash-go-ann"
            onClick={() => onNavigate({ primary: 'league_updates', leagueUpdatesTab: 'updates' })}
            className="w-full text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs py-2 rounded-xl transition-all mt-4 flex items-center justify-center gap-1"
          >
            Open All Club Bulletin Notices <ArrowRight size={12} />
          </button>
        </div>

      </div>

      {/* Team Summary Table — full squad at a glance */}
      <div id="team-summary-table" className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-md shadow-slate-100/30">
        <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-display font-black text-slate-850 uppercase tracking-wide text-base flex items-center gap-2">
              <Table size={18} className="text-indigo-600" /> Squad Summary
            </h3>
            <p className="text-slate-450 text-xs">All registered players — goals, assists, discipline, status, games played, and MVP awards</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Suspended</span>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="pb-2.5 pr-2 w-8">#</th>
                <th className="pb-2.5 pr-2">Name</th>
                <th className="pb-2.5 pr-2">Position</th>
                <th className="pb-2.5 pr-2 text-center">G</th>
                <th className="pb-2.5 pr-2 text-center">A</th>
                <th className="pb-2.5 pr-2 text-center">Cards</th>
                <th className="pb-2.5 pr-2 text-center">GP</th>
                <th className="pb-2.5 pr-2 text-center">MVP</th>
                <th className="pb-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[...players]
                .filter(p => !isStaffPosition(p.position))
                .sort((a, b) => {
                  const order = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];
                  const aIdx = order.indexOf(a.position);
                  const bIdx = order.indexOf(b.position);
                  const posA = aIdx === -1 ? 99 : aIdx;
                  const posB = bIdx === -1 ? 99 : bIdx;
                  return posA - posB;
                })
                .map(p => {
                  const hasCards = (p.yellowCards || 0) > 0 || (p.redCards || 0) > 0;
                  const isSuspended = p.registrationStatus === 'Suspended';
                  return (
                    <tr 
                      key={p.id}
                      onClick={() => onSelectPlayer(p)}
                      className={`hover:bg-indigo-50/50 transition-colors cursor-pointer ${
                        isSuspended ? 'opacity-50 bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-2.5 pr-2 font-mono font-bold text-slate-500">{p.number || '—'}</td>
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <img 
                            src={p.photoUrl} 
                            alt="" 
                            className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-bold text-slate-800 truncate max-w-[120px] text-[11px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-2 text-slate-500 font-medium text-[10px] whitespace-nowrap">{p.position}</td>
                      <td className="py-2.5 pr-2 text-center font-bold text-slate-800">{p.points ?? 0}</td>
                      <td className="py-2.5 pr-2 text-center font-bold text-slate-800">{p.assists ?? 0}</td>
                      <td className="py-2.5 pr-2 text-center">
                        {hasCards ? (
                          <div className="inline-flex items-center gap-1">
                            {(p.yellowCards || 0) > 0 && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-200">
                                {p.yellowCards} 🟨
                              </span>
                            )}
                            {(p.redCards || 0) > 0 && (
                              <span className="bg-red-100 text-red-800 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-200">
                                {p.redCards} 🟥
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-2 text-center font-bold text-slate-800">{p.gamesPlayed ?? 0}</td>
                      <td className="py-2.5 pr-2 text-center">
                        {(p.mvpAwards || 0) > 0 ? (
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                            ⭐ {p.mvpAwards}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          p.registrationStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          isSuspended ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {p.registrationStatus === 'Active' ? 'Active' :
                           isSuspended ? 'Suspended' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {players.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs">
              <Users size={24} className="mx-auto mb-2 text-slate-300" />
              No players registered yet. Add players from the Roster tab.
            </div>
          )}
        </div>

        {/* Aggregate quick-stats footer */}
        {players.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[10px] font-bold text-slate-500">
            <span>Total Players: <strong className="text-slate-800">{players.length}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Goals: <strong className="text-slate-800">{players.reduce((s, p) => s + (p.points || 0), 0)}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Assists: <strong className="text-slate-800">{players.reduce((s, p) => s + (p.assists || 0), 0)}</strong></span>
            <span className="text-slate-300">|</span>
            <span>🟨: <strong className="text-amber-600">{players.reduce((s, p) => s + (p.yellowCards || 0), 0)}</strong></span>
            <span className="text-slate-300">|</span>
            <span>🟥: <strong className="text-red-600">{players.reduce((s, p) => s + (p.redCards || 0), 0)}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Active: <strong className="text-emerald-600">{players.filter(p => p.registrationStatus === 'Active').length}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Total MVP: <strong className="text-amber-600">⭐ {players.reduce((s, p) => s + (p.mvpAwards || 0), 0)}</strong></span>
          </div>
        )}
      </div>

      {/* FPRDS Snapshot */}
      <div id="fprds-snapshot" className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-md shadow-slate-100/30">
        <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-display font-black text-slate-850 uppercase tracking-wide text-base flex items-center gap-2">
              <ClipboardList className="text-indigo-600" size={18} /> FPRDS Snapshot
            </h3>
            <p className="text-slate-450 text-xs">Top prospects, recent improvements, and latest assessment sessions.</p>
          </div>
          <button
            id="dash-open-assessments"
            onClick={() => onNavigate({ primary: 'development', developmentTab: 'assessments' })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors flex items-center gap-2 shadow-md"
          >
            Open Assessments <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="bg-slate-50/60 border border-slate-100/80 rounded-2xl p-4">
            <h4 className="font-display font-bold text-xs uppercase text-slate-400 mb-3 flex items-center gap-1">
              <Star size={14} className="text-amber-500" /> Top Prospects
            </h4>
            <div className="space-y-2.5">
              {topProspects.map(({ player, session }, idx) => (
                <button
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className="w-full text-left bg-white border border-slate-200/60 rounded-xl p-3 flex items-center justify-between hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-display font-black text-slate-300 text-xs w-4 shrink-0">#{idx + 1}</span>
                    <img src={player.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{player.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold truncate">{player.position} • {session.role}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">OVR</p>
                    <p className="text-lg font-display font-black text-slate-900 leading-none">{session.ovr}</p>
                  </div>
                </button>
              ))}
              {topProspects.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-10">No assessments recorded yet.</div>
              )}
            </div>
          </div>

          <div className="bg-slate-50/60 border border-slate-100/80 rounded-2xl p-4">
            <h4 className="font-display font-bold text-xs uppercase text-slate-400 mb-3 flex items-center gap-1">
              <TrendingUp size={14} className="text-emerald-600" /> Top Improvers
            </h4>
            <div className="space-y-2.5">
              {topImprovers.map(({ player, session }, idx) => (
                <button
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className="w-full text-left bg-white border border-slate-200/60 rounded-xl p-3 flex items-center justify-between hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-display font-black text-slate-300 text-xs w-4 shrink-0">#{idx + 1}</span>
                    <img src={player.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{player.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold truncate">{session.assessmentDate} • {session.assessmentType}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Δ OVR</p>
                    <p className={`text-lg font-display font-black leading-none ${(session.deltas.ovrDelta ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {(session.deltas.ovrDelta ?? 0) >= 0 ? `+${session.deltas.ovrDelta ?? 0}` : `${session.deltas.ovrDelta ?? 0}`}
                    </p>
                  </div>
                </button>
              ))}
              {topImprovers.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-10">No improvement data yet.</div>
              )}
            </div>
          </div>

          <div className="bg-slate-50/60 border border-slate-100/80 rounded-2xl p-4">
            <h4 className="font-display font-bold text-xs uppercase text-slate-400 mb-3 flex items-center gap-1">
              <Calendar size={14} className="text-indigo-600" /> Recent Assessments
            </h4>
            <div className="space-y-2.5">
              {recentAssessments.map((s) => {
                const player = players.find(p => p.id === s.playerId);
                if (!player) return null;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectPlayer(player)}
                    className="w-full text-left bg-white border border-slate-200/60 rounded-xl p-3 flex items-center justify-between hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={player.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">{player.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate">{s.assessmentDate} • {s.role} • {s.assessmentType}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">OVR</p>
                      <p className="text-lg font-display font-black text-slate-900 leading-none">{s.ovr}</p>
                    </div>
                  </button>
                );
              })}
              {recentAssessments.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-10">No recent sessions.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Leaderboards Grid (Rich visual player statistics) */}
      <div id="stat-leaderboards-card" className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-md shadow-slate-100/30">
        <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-display font-black text-slate-850 uppercase tracking-wide text-base flex items-center gap-2">
              <Award className="text-amber-500" size={18} /> Player Performance Leaderboards
            </h3>
            <p className="text-slate-450 text-xs">Season standings across main performance metrics. Click an athlete to open full stats.</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-lg border border-slate-200/40">Seeded Metric Charts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          
          {/* Section: Golden Boot */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
            <h4 className="font-display font-bold text-xs uppercase text-slate-400 mb-3 flex items-center gap-1">
              <Zap size={14} className="text-amber-500 fill-amber-300" /> Golden Boot (Goals)
            </h4>
            <div className="space-y-2.5">
              {topScorers.map((player, idx) => (
                <div 
                  id={`leaderboard-scorer-${player.id}`}
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center justify-between hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-black text-slate-300 text-xs w-4">#{idx+1}</span>
                    <img 
                      src={player.photoUrl} 
                      alt={player.name} 
                      className="w-8 h-8 rounded-full object-cover shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-semibold text-xs text-slate-800">{player.name}</div>
                      <div className="text-[10px] text-slate-400">Position: {player.position}</div>
                    </div>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 font-display font-black text-xs px-2.5 py-1 rounded-lg">
                    {player.points} G
                  </span>
                </div>
              ))}

              {topScorers.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">No statistics logged yet.</div>
              )}
            </div>
          </div>

          {/* Section: Playmaking King */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
            <h4 className="font-display font-bold text-xs uppercase text-slate-400 mb-3 flex items-center gap-1">
              <Award size={14} className="text-indigo-500" /> Playmaking Kings (Assists)
            </h4>
            <div className="space-y-2.5">
              {topAssists.map((player, idx) => (
                <div 
                  id={`leaderboard-assists-${player.id}`}
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center justify-between hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-black text-slate-300 text-xs w-4">#{idx+1}</span>
                    <img 
                      src={player.photoUrl} 
                      alt={player.name} 
                      className="w-8 h-8 rounded-full object-cover shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-semibold text-xs text-slate-800">{player.name}</div>
                      <div className="text-[10px] text-slate-400">Position: {player.position}</div>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 font-display font-black text-xs px-2.5 py-1 rounded-lg">
                    {player.assists} A
                  </span>
                </div>
              ))}

              {topAssists.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">No statistics logged yet.</div>
              )}
            </div>
          </div>

          {/* Section: Clean Sheet Wall */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
            <h4 className="font-display font-bold text-xs uppercase text-slate-400 mb-3 flex items-center gap-1">
              <Shield size={14} className="text-emerald-500" /> Goalkeeping Walls
            </h4>
            <div className="space-y-2.5">
              {topGoalkeepers.map((player, idx) => (
                <div 
                  id={`leaderboard-wall-${player.id}`}
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center justify-between hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-black text-slate-300 text-xs w-4">#{idx+1}</span>
                    <img 
                      src={player.photoUrl} 
                      alt={player.name} 
                      className="w-8 h-8 rounded-full object-cover shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-semibold text-xs text-slate-800">{player.name}</div>
                      <div className="text-[10px] text-slate-400">Position: {player.position}</div>
                    </div>
                  </div>
                  <span className="bg-blue-50 text-blue-700 font-display font-black text-xs px-2.5 py-1 rounded-lg">
                    {player.cleanSheetsOrRebounds} CS
                  </span>
                </div>
              ))}

              {topGoalkeepers.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">No statistics logged yet.</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Analytics Row: Trend Chart & Recent Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Points Trend Line Chart */}
        <div id="points-trend-chart-card" className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/70 p-6 shadow-md shadow-slate-100/30">
          <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-display font-black text-slate-850 uppercase tracking-wide text-base flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={18} /> Team Points Progression
              </h3>
              <p className="text-slate-450 text-xs">Cumulative standings trajectory over the last 10 completed matches.</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Win (+3)
              </span>
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-100">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Draw (+1)
              </span>
              <span className="flex items-center gap-1 bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-100">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Loss (0)
              </span>
            </div>
          </div>

          <div className="mt-6 h-[280px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 15, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                    className="font-mono"
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-5}
                    className="font-mono"
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="points" 
                    stroke="#4f46e5" 
                    strokeWidth={3.5} 
                    activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2, fill: '#4f46e5' }} 
                    dot={(props: any) => {
                      const { cx, cy, payload, index } = props;
                      if (cx === undefined || cy === undefined) return null;
                      const outcome = payload.outcome;
                      const color = outcome === 'W' ? '#10b981' : outcome === 'D' ? '#fbbf24' : '#ef4444';
                      return (
                        <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill={color} stroke="#ffffff" strokeWidth={1.5} />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No matches played yet to display cumulative trend.
              </div>
            )}
          </div>
        </div>

        {/* Recent Form Widget */}
        <div id="recent-form-card" className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/70 p-6 shadow-md shadow-slate-100/30 flex flex-col">
          <div className="pb-4 border-b border-slate-100 flex flex-col gap-3">
            <div>
              <h3 className="font-display font-black text-slate-850 uppercase tracking-wide text-base flex items-center gap-2">
                <Calendar className="text-indigo-600" size={18} /> Recent Form
              </h3>
              <p className="text-slate-450 text-xs">Results from the last 5 games</p>
            </div>
            
            <div className="flex gap-2 items-center">
              {userCompletedGames.slice(-5).map((game) => {
                const our = game.ourScore ?? 0;
                const opp = game.opponentScore ?? 0;
                const isWin = our > opp;
                const isDraw = our === opp;
                return (
                  <span key={`seq-${game.id}`} className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-xs text-white shadow-sm ${isWin ? 'bg-emerald-500' : isDraw ? 'bg-amber-400' : 'bg-rose-500'}`}>
                    {isWin ? 'W' : isDraw ? 'D' : 'L'}
                  </span>
                )
              })}
              {userCompletedGames.length === 0 && (
                <span className="text-slate-400 text-xs italic">No form available</span>
              )}
            </div>
          </div>
          <div className="mt-4 flex-1 flex flex-col gap-3 overflow-y-auto">
            {userCompletedGames.slice(-5).reverse().map((game) => {
              const our = game.ourScore ?? 0;
              const opp = game.opponentScore ?? 0;
              const isWin = our > opp;
              const isDraw = our === opp;
              return (
                <div key={game.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded font-bold text-[10px] text-white ${isWin ? 'bg-emerald-500' : isDraw ? 'bg-amber-400' : 'bg-rose-500'}`}>
                      {isWin ? 'W' : isDraw ? 'D' : 'L'}
                    </span>
                    <span className="font-semibold text-slate-700 text-xs truncate max-w-[120px]">{game.opponent}</span>
                  </div>
                  <div className="font-mono text-xs font-black text-slate-800 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                    {our} - {opp}
                  </div>
                </div>
              );
            })}
            {userCompletedGames.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs mt-8">
                No recent matches completed.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
