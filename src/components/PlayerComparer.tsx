import React from 'react';
import { Player } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Legend, Tooltip 
} from 'recharts';
import { ArrowLeftRight, X, Sparkles, Award, Shield, Zap, Flame } from 'lucide-react';

interface PlayerComparerProps {
  players: Player[];
  selectedCompareIds: string[];
  onToggleCompare: (playerId: string) => void;
  onClearCompare: () => void;
}

export default function PlayerComparer({ 
  players, 
  selectedCompareIds, 
  onToggleCompare, 
  onClearCompare 
}: PlayerComparerProps) {

  // Retrieve the selected player objects
  const player1 = players.find(p => p.id === selectedCompareIds[0]) || null;
  const player2 = players.find(p => p.id === selectedCompareIds[1]) || null;

  // Handler for select dropdowns
  const handleSelectP1 = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      if (player1) onToggleCompare(player1.id);
      return;
    }
    // If player1 is already selected, swap it
    if (player1) onToggleCompare(player1.id);
    onToggleCompare(id);
  };

  const handleSelectP2 = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      if (player2) onToggleCompare(player2.id);
      return;
    }
    // If player2 is already selected, swap it
    if (player2) onToggleCompare(player2.id);
    onToggleCompare(id);
  };

  // Helper calculating dynamic player OVR
  const calculateOVR = (player: Player) => {
    const { speed, shooting, passing, dribbling, defending, physicalness } = player.attributes;
    return Math.round((speed + shooting + passing + dribbling + defending + physicalness) / 6);
  };

  // Construct Radar Chart Data
  const radarData = [
    {
      attribute: 'Pace',
      [player1?.name || 'Player 1']: player1?.attributes.speed || 0,
      [player2?.name || 'Player 2']: player2?.attributes.speed || 0,
    },
    {
      attribute: 'Shooting',
      [player1?.name || 'Player 1']: player1?.attributes.shooting || 0,
      [player2?.name || 'Player 2']: player2?.attributes.shooting || 0,
    },
    {
      attribute: 'Passing',
      [player1?.name || 'Player 1']: player1?.attributes.passing || 0,
      [player2?.name || 'Player 2']: player2?.attributes.passing || 0,
    },
    {
      attribute: 'Dribbling',
      [player1?.name || 'Player 1']: player1?.attributes.dribbling || 0,
      [player2?.name || 'Player 2']: player2?.attributes.dribbling || 0,
    },
    {
      attribute: 'Defending',
      [player1?.name || 'Player 1']: player1?.attributes.defending || 0,
      [player2?.name || 'Player 2']: player2?.attributes.defending || 0,
    },
    {
      attribute: 'Physical',
      [player1?.name || 'Player 1']: player1?.attributes.physicalness || 0,
      [player2?.name || 'Player 2']: player2?.attributes.physicalness || 0,
    },
  ];

  // Dynamic tactical analysis generator
  const getTacticalAnalysis = () => {
    if (!player1 || !player2) return "Select two players to initiate side-by-side tactical telemetry and analytical matching.";

    const ovr1 = calculateOVR(player1);
    const ovr2 = calculateOVR(player2);

    const strongerPlayer = ovr1 > ovr2 ? player1 : ovr2 > ovr1 ? player2 : null;
    const sameOvr = ovr1 === ovr2;

    // Attribute comparison definitions
    const attrs = [
      { name: 'Pace', p1: player1.attributes.speed, p2: player2.attributes.speed },
      { name: 'Shooting', p1: player1.attributes.shooting, p2: player2.attributes.shooting },
      { name: 'Passing', p1: player1.attributes.passing, p2: player2.attributes.passing },
      { name: 'Dribbling', p1: player1.attributes.dribbling, p2: player2.attributes.dribbling },
      { name: 'Defending', p1: player1.attributes.defending, p2: player2.attributes.defending },
      { name: 'Physical', p1: player1.attributes.physicalness, p2: player2.attributes.physicalness },
    ];

    const p1Best = attrs.reduce((prev, curr) => curr.p1 > prev.p1 ? curr : prev, attrs[0]);
    const p2Best = attrs.reduce((prev, curr) => curr.p2 > prev.p2 ? curr : prev, attrs[0]);

    let analysisString = "";

    if (sameOvr) {
      analysisString = `Both athletes carry an identical Overall Index of ${ovr1}. However, their tactical deployment differs: ${player1.name}'s peak parameter is ${p1Best.name} (${p1Best.p1}/99), while ${player2.name} functions optimally through high-tier ${p2Best.name} (${p2Best.p2}/99). `;
    } else if (strongerPlayer) {
      const weakerPlayer = strongerPlayer === player1 ? player2 : player1;
      const difference = Math.abs(ovr1 - ovr2);
      analysisString = `${strongerPlayer.name} controls the overall performance tier with an OVR margin of +${difference} (${calculateOVR(strongerPlayer)} vs ${calculateOVR(weakerPlayer)}). `;
    }

    // Identify specific attribute domains
    const paceDiff = player1.attributes.speed - player2.attributes.speed;
    const shootDiff = player1.attributes.shooting - player2.attributes.shooting;
    const defenseDiff = player1.attributes.defending - player2.attributes.defending;

    if (Math.abs(paceDiff) > 10) {
      const faster = paceDiff > 0 ? player1 : player2;
      analysisString += `Specifically, ${faster.name} has a distinct pace advantage (+${Math.abs(paceDiff)} Speed), establishing strong counter-attacking capacity. `;
    }

    if (Math.abs(shootDiff) > 12) {
      const sharper = shootDiff > 0 ? player1 : player2;
      analysisString += `${sharper.name} demonstrates sharper ball striking (+${Math.abs(shootDiff)} Shooting) to act as a primary scoring threat. `;
    }

    if (Math.abs(defenseDiff) > 12) {
      const defender = defenseDiff > 0 ? player1 : player2;
      analysisString += `In shielding scenarios, ${defender.name} excels as a defensive anchor (+${Math.abs(defenseDiff)} Defending). `;
    }

    return analysisString || `Both players bring balanced athletic work-rates, with minimal statistical variance across primary metrics. Ideal for fluid team interchange.`;
  };

  const p1Ovr = player1 ? calculateOVR(player1) : 0;
  const p2Ovr = player2 ? calculateOVR(player2) : 0;

  // Helper to determine badge background styling
  const getPositionStyle = (pos: string) => {
    switch (pos) {
      case 'Forward': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Midfielder': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Defender': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div 
      id="player-comparison-section" 
      className="bg-white rounded-2xl border border-slate-200/60 p-5.5 shadow-sm space-y-6"
    >
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest">TACTICAL MATRIX</span>
            <span className="text-slate-400 text-xs font-mono">Statistical Matchup</span>
          </div>
          <h3 className="text-base font-display font-black text-slate-800 tracking-tight flex items-center gap-1.5 mt-1">
            <ArrowLeftRight size={16} className="text-indigo-600 shrink-0" />
            <span>Compare Squad Athletes</span>
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Evaluate two team members side-by-side. Inspect technical attributes, overall rating indices, and season contribution scores.
          </p>
        </div>
        
        {selectedCompareIds.length > 0 && (
          <button
            id="clear-comparison-btn"
            onClick={onClearCompare}
            className="self-start sm:self-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <X size={12} />
            <span>Reset Matchup</span>
          </button>
        )}
      </div>

      {/* Selectors and Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Columns or Selectors */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Player 1 Selection */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-150/60 space-y-3.5">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Primary Athlete</label>
              <select
                id="select-player-1-dropdown"
                value={player1?.id || ""}
                onChange={handleSelectP1}
                className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Athlete --</option>
                {players
                  .filter(p => p.id !== player2?.id)
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.number} - {p.name} ({p.position})
                    </option>
                  ))
                }
              </select>
            </div>

            {player1 ? (
              <div id="compare-player-1-card" className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-start gap-3.5 relative">
                <img 
                  src={player1.photoUrl} 
                  alt={player1.name} 
                  className="w-13 h-13 rounded-full object-cover border border-slate-200 shrink-0 shadow-inner"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-black text-[11px] bg-slate-900 text-amber-400 px-1.5 py-0.2 rounded leading-none">
                      #{player1.number}
                    </span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border leading-none ${getPositionStyle(player1.position)}`}>
                      {player1.position}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-slate-800 text-sm truncate leading-none">{player1.name}</h4>
                  <div className="grid grid-cols-3 gap-1 border-t border-slate-100 pt-2 text-[10px] text-slate-400 font-medium">
                    <div>
                      <span>Games</span>
                      <strong className="block text-slate-700 font-mono mt-0.5">{player1.gamesPlayed}</strong>
                    </div>
                    <div>
                      <span className="text-indigo-500">Goals</span>
                      <strong className="block text-indigo-600 font-mono mt-0.5">{player1.points}</strong>
                    </div>
                    <div>
                      <span>Assists</span>
                      <strong className="block text-slate-700 font-mono mt-0.5">{player1.assists}</strong>
                    </div>
                  </div>
                </div>
                {/* Overall Rating Pin */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-black text-amber-400 text-xs shadow-sm">
                  {p1Ovr}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 border border-slate-100/80 shadow-sm text-center text-slate-400 text-xs border-dashed flex flex-col items-center justify-center py-8">
                <Award size={20} className="text-slate-300 stroke-1.5 mb-1.5 animate-pulse" />
                <span>No selection made</span>
                <span className="text-[10px] text-slate-300 mt-0.5">Click 'Compare' on a player card or select here</span>
              </div>
            )}
          </div>

          {/* Player 2 Selection */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-150/60 space-y-3.5">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Opposing Athlete / Matchup</label>
              <select
                id="select-player-2-dropdown"
                value={player2?.id || ""}
                onChange={handleSelectP2}
                className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Athlete --</option>
                {players
                  .filter(p => p.id !== player1?.id)
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.number} - {p.name} ({p.position})
                    </option>
                  ))
                }
              </select>
            </div>

            {player2 ? (
              <div id="compare-player-2-card" className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-start gap-3.5 relative">
                <img 
                  src={player2.photoUrl} 
                  alt={player2.name} 
                  className="w-13 h-13 rounded-full object-cover border border-slate-200 shrink-0 shadow-inner"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-black text-[11px] bg-slate-900 text-amber-400 px-1.5 py-0.2 rounded leading-none">
                      #{player2.number}
                    </span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border leading-none ${getPositionStyle(player2.position)}`}>
                      {player2.position}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-slate-800 text-sm truncate leading-none">{player2.name}</h4>
                  <div className="grid grid-cols-3 gap-1 border-t border-slate-100 pt-2 text-[10px] text-slate-400 font-medium">
                    <div>
                      <span>Games</span>
                      <strong className="block text-slate-700 font-mono mt-0.5">{player2.gamesPlayed}</strong>
                    </div>
                    <div>
                      <span className="text-indigo-500">Goals</span>
                      <strong className="block text-indigo-600 font-mono mt-0.5">{player2.points}</strong>
                    </div>
                    <div>
                      <span>Assists</span>
                      <strong className="block text-slate-700 font-mono mt-0.5">{player2.assists}</strong>
                    </div>
                  </div>
                </div>
                {/* Overall Rating Pin */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-black text-amber-400 text-xs shadow-sm">
                  {p2Ovr}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 border border-slate-100/80 shadow-sm text-center text-slate-400 text-xs border-dashed flex flex-col items-center justify-center py-8">
                <Award size={20} className="text-slate-300 stroke-1.5 mb-1.5 animate-pulse" />
                <span>No selection made</span>
                <span className="text-[10px] text-slate-300 mt-0.5">Click 'Compare' on a player card or select here</span>
              </div>
            )}
          </div>

          {/* Breakdown Stats match-bars */}
          {player1 && player2 && (
            <div id="comparison-attribute-bars" className="md:col-span-2 space-y-4 pt-1 bg-white p-4.5 rounded-xl border border-slate-200">
              <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Flame size={13} className="text-indigo-600 animate-pulse" />
                <span>Attribute Matchups</span>
              </h4>
              
              <div className="space-y-4">
                {[
                  { label: "Pace / Speed", key: 'speed', icon: "⚡" },
                  { label: "Shooting", key: 'shooting', icon: "🎯" },
                  { label: "Passing / Vision", key: 'passing', icon: "🪄" },
                  { label: "Dribbling / Control", key: 'dribbling', icon: "🕺" },
                  { label: "Defending / Guard", key: 'defending', icon: "🧱" },
                  { label: "Physical / Stamina", key: 'physicalness', icon: "💪" },
                ].map((item) => {
                  const val1 = player1.attributes[item.key as keyof Player['attributes']];
                  const val2 = player2.attributes[item.key as keyof Player['attributes']];
                  const p1Higher = val1 > val2;
                  const p2Higher = val2 > val1;

                  return (
                    <div key={item.key} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className={`font-semibold  ${p1Higher ? 'text-indigo-650' : 'text-slate-500'}`}>
                          {p1Higher ? '🏆 ' : ''}{val1}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1 font-semibold">
                          <span>{item.icon}</span>
                          <span className="text-[10px] text-slate-400">{item.label}</span>
                        </span>
                        <span className={`font-semibold  ${p2Higher ? 'text-indigo-650' : 'text-slate-500'}`}>
                          {val2}{p2Higher ? ' 🏆' : ''}
                        </span>
                      </div>

                      {/* Visual matchup layout bar */}
                      <div className="h-2.5 bg-slate-100 rounded-full flex overflow-hidden">
                        {/* Player 1 Share (left aligned) */}
                        <div 
                          className={`h-full transition-all duration-500 rounded-l-full bg-indigo-500 flex justify-end pr-1 border-r border-white/20`}
                          style={{ width: `${(val1 / (val1 + val2)) * 100}%` }}
                        />
                        {/* Player 2 Share (right aligned) */}
                        <div 
                          className={`h-full transition-all duration-500 rounded-r-full bg-slate-800 flex justify-start pl-1`}
                          style={{ width: `${(val2 / (val1 + val2)) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Recharts Radar Chart */}
        <div className="lg:col-span-4 flex flex-col justify-between items-center bg-slate-50/50 rounded-xl border border-slate-150 p-4 h-full min-h-[340px]">
          <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider self-start">
            Radar Performance Polygon
          </span>
          
          {player1 || player2 ? (
            <div id="radar-container" className="w-full h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis 
                    dataKey="attribute" 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 99]} 
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                  />
                  
                  {player1 && (
                    <Radar
                      name={player1.name}
                      dataKey={player1.name}
                      stroke="#4f46e5"
                      fill="#4f46e5"
                      fillOpacity={0.35}
                    />
                  )}
                  
                  {player2 && (
                    <Radar
                      name={player2.name}
                      dataKey={player2.name}
                      stroke="#1e293b"
                      fill="#1e293b"
                      fillOpacity={0.3}
                    />
                  )}
                  
                  <Legend 
                    wrapperStyle={{ fontSize: 10, fontWeight: 700, color: '#334155' }} 
                    verticalAlign="bottom"
                    iconSize={8}
                    height={18}
                  />
                  <Tooltip wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-16 space-y-2">
              <Shield size={44} className="stroke-1 text-slate-200" />
              <p className="text-[10px] uppercase font-mono font-black text-slate-400">Telemetry Blank</p>
            </div>
          )}

          <div className="text-[10px] text-slate-400 text-center leading-relaxed mt-2 p-1 border-t border-slate-100 w-full font-mono">
            Radar boundaries configured at max OVR rating of 99 index points.
          </div>
        </div>

      </div>

      {/* Dynamic Summary analysis */}
      <div id="tactical-teammate-analysis-conclusion" className="bg-gradient-to-r from-slate-50 via-slate-100/40 to-slate-50 rounded-xl p-4 border border-slate-150 text-xs text-slate-700 flex items-start gap-3">
        <Sparkles size={16} className="text-indigo-600 mt-0.5 shrink-0 animate-pulse" />
        <div className="space-y-1">
          <div className="font-bold text-slate-800 uppercase tracking-widest text-[9px] font-mono">Coach Matchup Summary</div>
          <p className="leading-relaxed font-semibold text-slate-650">{getTacticalAnalysis()}</p>
        </div>
      </div>

    </div>
  );
}
