import React, { useState } from 'react';
import { Shield, User, ArrowRight, CheckCircle, Flag, Trophy, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TeamInfo, StaffMember } from '../types';
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

interface OnboardingViewProps {
  onComplete: (team: TeamInfo, headCoach: StaffMember) => void;
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

    const headCoach: StaffMember = {
      id: crypto.randomUUID(),
      name: mgrName,
      role: mgrPosition,
      photoUrl: mgrPhoto || "https://images.unsplash.com/photo-1544717297-ea0e52a269c7?w=150&auto=format&fit=crop&q=80",
      bio: mgrBio || 'Team Manager & Core Organizer.',
      status: 'Active'
    };

    onComplete(tInf, headCoach);
  };

  return (
    <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-blue-500/30 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.24),transparent_28rem),radial-gradient(circle_at_85%_85%,rgba(6,182,212,0.12),transparent_26rem)]" />
      
      <div className="w-full max-w-xl relative z-10">
        {/* Header Block */}
        <div className="text-center mb-10">
          <img
            src="/Dumala_logo.png"
            alt="Dumala"
            className="inline-block w-80 h-80 rounded-2xl object-contain mb-1"
          />
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
                    <Label className="mb-1.5 block text-slate-400">Official Team Name <span className="text-rose-500">*</span></Label>
                    <Input
                      type="text" 
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Apex Rangers FC"
                      className="h-11 rounded-xl border-slate-800 bg-[#060b13] px-4 font-semibold text-slate-100 placeholder:font-normal placeholder:text-slate-600 focus-visible:ring-indigo-500/40"
                    />
                  </div>

                  <div>
                    <div>
                      <Label className="mb-1.5 flex items-center gap-1.5 text-slate-400"><MapPin size={12}/> Home Ground</Label>
                      <Input
                        type="text" 
                        value={stadium}
                        onChange={(e) => setStadium(e.target.value)}
                        placeholder="e.g. Metro Sports Park"
                        className="h-11 rounded-xl border-slate-800 bg-[#060b13] px-4 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500/40"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 flex items-center gap-1.5 text-slate-400"><Flag size={12}/> League / Division</Label>
                      <Input
                        type="text" 
                        value={league}
                        onChange={(e) => setLeague(e.target.value)}
                        placeholder="e.g. Regional Premier"
                        className="h-11 rounded-xl border-slate-800 bg-[#060b13] px-4 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500/40"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-1.5 block text-slate-400">Founded Year</Label>
                    <Input
                      type="number" 
                      value={founded}
                      onChange={(e) => setFounded(e.target.value)}
                      className="h-11 w-full rounded-xl border-slate-800 bg-[#060b13] px-4 font-mono text-slate-100 focus-visible:ring-indigo-500/40 md:w-1/2"
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 text-right">
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!teamName.trim()}
                    size="lg"
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-sm text-white hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
                  >
                    Confirm Identity <ArrowRight size={16} />
                  </Button>
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
                    <p className="text-[11px] text-slate-400 mt-1">You will be added to the staff directory as the first club member.</p>
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
                      <Label className="mb-1 block text-slate-400">Your Profile Photo</Label>
                      <Input
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
                      <Button
                        type="button"
                        onClick={() => document.getElementById('onboarding-mgr-photo')?.click()}
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-700 bg-slate-800 text-[11px] uppercase tracking-wider text-slate-200 hover:bg-slate-700 hover:text-white"
                      >
                        Choose Custom Picture
                      </Button>
                      <p className="text-[9px] text-slate-500 mt-1">Supports PNG, JPG (maximum 5MB size limit)</p>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-slate-400">Your Full Name <span className="text-rose-500">*</span></Label>
                    <Input
                      type="text" 
                      value={mgrName}
                      onChange={(e) => setMgrName(e.target.value)}
                      placeholder="e.g. Alex Sterling"
                      className="h-11 rounded-xl border-slate-800 bg-[#060b13] px-4 font-semibold text-slate-100 placeholder:font-normal placeholder:text-slate-600 focus-visible:ring-indigo-500/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1.5 block text-slate-400">Primary Role</Label>
                      <Select
                        value={mgrPosition}
                        onValueChange={setMgrPosition}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-slate-800 bg-[#060b13] px-4 text-slate-100 focus:ring-indigo-500/40">
                          <SelectValue placeholder="Choose role" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-800 bg-[#060b13] text-slate-100">
                          <SelectItem value="Manager / Coach" className="focus:bg-slate-800 focus:text-white">Manager / Coach</SelectItem>
                          <SelectItem value="Head Coach" className="focus:bg-slate-800 focus:text-white">Head Coach</SelectItem>
                          <SelectItem value="Assistant Coach" className="focus:bg-slate-800 focus:text-white">Assistant Coach</SelectItem>
                          <SelectItem value="Manager" className="focus:bg-slate-800 focus:text-white">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-1.5 block text-slate-400">Brief Bio / Playing Style</Label>
                    <Textarea
                      value={mgrBio}
                      onChange={(e) => setMgrBio(e.target.value)}
                      placeholder="Tactical philosophy or your playing background..."
                      rows={3}
                      className="resize-none rounded-xl border-slate-800 bg-[#060b13] px-4 py-3 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500/40"
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex justify-between items-center">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="ghost"
                    className="px-4 py-2 text-xs uppercase tracking-wider text-slate-400 hover:bg-white/5 hover:text-white"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={generateTeam}
                    disabled={!mgrName.trim()}
                    size="lg"
                    className="rounded-xl bg-gradient-to-r from-blue-400 to-cyan-300 text-sm font-black text-slate-950 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
                  >
                    Enter Workspace <CheckCircle size={16} />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
