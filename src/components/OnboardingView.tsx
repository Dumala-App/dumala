import React, { useState } from 'react';
import { Shield, User, ArrowRight, CheckCircle, Flag, Trophy, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TeamInfo, Player } from '../types';

interface OnboardingViewProps {
  onComplete: (team: TeamInfo, headCoach: Player) => void;
}

export default function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Form State - Team
  const [teamName, setTeamName] = useState('');
  const [stadium, setStadium] = useState('');
  const [league, setLeague] = useState('');
  const [founded, setFounded] = useState(new Date().getFullYear().toString());

  // Form State - Manager / Coach
  const [mgrName, setMgrName] = useState('');
  const [mgrPosition, setMgrPosition] = useState('Manager / Coach');
  const [mgrNumber, setMgrNumber] = useState('');
  const [mgrBio, setMgrBio] = useState('');
  const [mgrPhoto, setMgrPhoto] = useState('');

  const handleNext = () => setStep(2);

  const generateTeam = () => {
    if (!teamName || !mgrName) return;

    const tInf: TeamInfo = {
      name: teamName,
      founded: founded || new Date().getFullYear().toString(),
      stadium: stadium || 'Home Ground',
      coach: mgrName,
      league: league || 'Friendly Division',
      logoColor: 'from-blue-600 to-indigo-800'
    };

    const cPlayer: Player = {
      id: crypto.randomUUID(),
      name: mgrName,
      number: mgrNumber ? parseInt(mgrNumber) : 99,
      position: mgrPosition,
      photoUrl: mgrPhoto || "https://images.unsplash.com/photo-1544717297-ea0e52a269c7?w=150&auto=format&fit=crop&q=80",
      bio: mgrBio || 'Team Manager & Core Organizer.',
      gamesPlayed: 0,
      points: 0,
      assists: 0,
      cleanSheetsOrRebounds: 0,
      minutesPlayed: 0,
      mvpAwards: 0,
      yellowCards: 0,
      redCards: 0,
      baseAttributes: {
        pace: 60,
        stamina: 60,
        agility: 65,
        strength: 60,
        firstTouch: 65,
        shortPassing: 75
      },
      positionAttributes: {},
      registrationStatus: 'Active'
    };

    onComplete(tInf, cPlayer);
  };

  return (
    <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-blue-500/30 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.24),transparent_28rem),radial-gradient(circle_at_85%_85%,rgba(6,182,212,0.12),transparent_26rem)]" />
      
      <div className="w-full max-w-xl relative z-10">
        {/* Header Block */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-300 text-slate-950 font-display font-black text-3xl shadow-xl shadow-blue-500/20 mb-6">
            S
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight mb-3">
            Build your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">team hub</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Set up the essentials now. You can manage your roster, tactics, schedule, training, and league from one place.
          </p>
        </div>

        {/* Dynamic Entry Form */}
        <div className="bg-[#0c1728]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl shadow-black/30 relative overflow-hidden">
          
          <div className="flex gap-2 mb-8">
            <div className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${step >= 1 ? 'bg-blue-400' : 'bg-slate-800'}`} />
            <div className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${step >= 2 ? 'bg-blue-400' : 'bg-slate-800'}`} />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
                  <Shield size={22} className="text-indigo-400" />
                  <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider">Club Identity</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Official Team Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Apex Rangers FC"
                      className="w-full bg-[#060b13] border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold placeholder:font-normal placeholder-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1.5 flex items-center gap-1.5"><MapPin size={12}/> Home Ground</label>
                      <input 
                        type="text" 
                        value={stadium}
                        onChange={(e) => setStadium(e.target.value)}
                        placeholder="e.g. Metro Sports Park"
                        className="w-full bg-[#060b13] border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1.5 flex items-center gap-1.5"><Flag size={12}/> League / Division</label>
                      <input 
                        type="text" 
                        value={league}
                        onChange={(e) => setLeague(e.target.value)}
                        placeholder="e.g. Regional Premier"
                        className="w-full bg-[#060b13] border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-600"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Founded Year</label>
                    <input 
                      type="number" 
                      value={founded}
                      onChange={(e) => setFounded(e.target.value)}
                      className="w-full md:w-1/2 bg-[#060b13] border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 text-right">
                  <button 
                    type="button"
                    onClick={handleNext}
                    disabled={!teamName.trim()}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-sm px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    Confirm Identity <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
                  <User size={22} className="text-amber-400" />
                  <div>
                    <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider">Manager Profile</h2>
                    <p className="text-[11px] text-slate-400 mt-1">You will be added to the roster as the first member.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Photo Custom Upload Row */}
                  <div className="flex items-center gap-4 bg-[#0a111e] p-4 rounded-2xl border border-slate-800">
                    <div className="relative shrink-0">
                      <img 
                        src={mgrPhoto || "https://images.unsplash.com/photo-1544717297-ea0e52a269c7?w=150&auto=format&fit=crop&q=80"} 
                        alt="Profile Preview" 
                        className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1">YOUR PROFILE PHOTO</label>
                      <input 
                        id="onboarding-mgr-photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setMgrPhoto(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('onboarding-mgr-photo')?.click()}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-705 transition-all text-[11px] uppercase tracking-wider"
                      >
                        Choose Custom Picture
                      </button>
                      <p className="text-[9px] text-slate-500 mt-1">Supports PNG, JPG (maximum 5MB size limit)</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Your Full Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={mgrName}
                      onChange={(e) => setMgrName(e.target.value)}
                      placeholder="e.g. Alex Sterling"
                      className="w-full bg-[#060b13] border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold placeholder:font-normal placeholder-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Primary Role</label>
                      <select 
                        value={mgrPosition}
                        onChange={(e) => setMgrPosition(e.target.value)}
                        className="w-full bg-[#060b13] border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                      >
                        <option value="Manager / Coach">Manager / Coach</option>
                        <option value="Player-Manager">Player-Manager</option>
                        <option value="Midfielder">Midfielder</option>
                        <option value="Forward">Forward</option>
                        <option value="Defender">Defender</option>
                        <option value="Goalkeeper">Goalkeeper</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Kit Number (Optional)</label>
                      <input 
                        type="number" 
                        value={mgrNumber}
                        onChange={(e) => setMgrNumber(e.target.value)}
                        placeholder="--"
                        className="w-full bg-[#060b13] border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono placeholder-slate-600"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Brief Bio / Playing Style</label>
                    <textarea 
                      value={mgrBio}
                      onChange={(e) => setMgrBio(e.target.value)}
                      placeholder="Tactical philosophy or your playing background..."
                      rows={3}
                      className="w-full bg-[#060b13] border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none placeholder-slate-600"
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors px-4 py-2"
                  >
                    Back
                  </button>
                  <button 
                    type="button"
                    onClick={generateTeam}
                    disabled={!mgrName.trim()}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-400 to-cyan-300 text-slate-950 font-black text-sm px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    Enter Workspace <CheckCircle size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
