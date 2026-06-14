import { NotebookPen, Megaphone, FlaskConical, Rocket, Brain, Target, TrendingUp, BarChart3, Hash } from 'lucide-react';

export default function UpdatesView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0f172a] text-white rounded-2xl p-6 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <NotebookPen size={180} className="stroke-[3]" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest">Dev Notes</span>
              <span className="text-slate-400 text-xs font-mono">Updates &amp; Development Log</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Developer Updates &amp; Product Roadmap</h2>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Stay informed about the purpose behind this app, current development status, and the vision for future features including the Football Player Rating &amp; Development System.
            </p>
          </div>
        </div>
      </div>

      {/* Purpose of the App */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Target size={18} className="text-indigo-600" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Purpose of the App</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong>Stack Team Manager</strong> was built to solve a real problem: football coaches and club managers at the grassroots, amateur, and academy levels spend far too much time juggling disconnected tools. Team data lives in spreadsheets, chat threads, notebooks, and memory — scattered, fragile, and hard to act on.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          This app consolidates the core operating loop of running a football team into one workspace. Roster management, match scheduling, result logging, training planning, tactical notes, discipline tracking, and MVP awards — all in a single interface designed specifically for the coach who wants to spend less time administering and more time coaching.
        </p>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
          <li>Replace fragmented spreadsheets and chat threads with a unified team dashboard</li>
          <li>Automate standings updates and player stat tracking from match results</li>
          <li>Plan training weeks with a 52-drill library and preset templates</li>
          <li>Track player availability, opponent intel, and tactical notes before fixtures</li>
          <li>Build a foundation for AI-assisted coaching and data-driven player development</li>
        </ul>
      </div>

      {/* Beta Phase & Feedback */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
          <FlaskConical size={18} className="text-amber-600" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Beta Phase — Your Feedback Matters</h3>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          This application is currently in <strong>active beta testing</strong>. It is functional and ready for real-world use, but it is not yet the finished product. Every feature you see today exists because of early feedback from coaches and club operators like you.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          Your feedback directly shapes what gets built next. If something feels clunky, if a workflow is missing, if you have an idea that would make your week easier — I want to hear about it. Use the feedback button in the top-right corner or reach out directly.
        </p>
        <div className="bg-white/60 border border-amber-300 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Megaphone size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>How to help:</strong> Use the app to manage your team for a full week. Try adding players, scheduling a match, logging a result, planning training, and checking the squad summary. Then share what worked, what didn't, and what you wish existed next.
            </p>
          </div>
        </div>
      </div>

      {/* Current Attribute System */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <BarChart3 size={18} className="text-indigo-600" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Current Player Rating System</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong>For now, all player attribute ratings are subjective</strong> — they are based solely on the coach's personal assessment and judgment. The sliders you see in the player profile (Pace, Stamina, Agility, Strength, First Touch, Short Passing, and position-specific attributes like Finishing or Tackling) are manually set by the coach.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          This is an intentional design choice for the beta phase. It allows coaches to quickly populate their squad with ratings that reflect their real-world knowledge of each player, without needing to run formal tests or drills during setup.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>Limitation:</strong> Subjective ratings can vary between coaches, are hard to compare across teams, and do not track objective development over time. The next phase of this product directly addresses this by introducing standardized, repeatable testing protocols.
          </p>
        </div>
      </div>

      {/* Future: FPRDS Product MVP v2.0 */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-lg border border-slate-700 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
          <Rocket size={18} className="text-emerald-400" />
          <h3 className="font-black text-white text-sm uppercase tracking-wider">Coming Soon: Football Player Rating &amp; Development System (FPRDS)</h3>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Product MVP — Version 2.0</p>
            <h4 className="text-lg font-black">Product Vision</h4>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">
              The Football Player Rating &amp; Development System (FPRDS) is a data-driven assessment platform designed for football coaches, academies, clubs, and development programs.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">
              The system allows coaches to conduct standardized football drills during training sessions, record results directly from a mobile device, and automatically generate FIFA/eFootball-style player ratings based on <strong>objective measurements</strong> rather than subjective opinions.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">
              The platform focuses on player development by identifying weaknesses and recommending targeted drills to improve specific attributes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">Primary Goals</h5>
              <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                <li>Create objective player ratings</li>
                <li>Standardize player evaluations</li>
                <li>Track player development over time</li>
                <li>Recommend improvement programs</li>
                <li>Help coaches make position-based decisions</li>
                <li>Generate FIFA-style player cards</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">Problems Solved</h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                Traditional coaching evaluations often rely on subjective observations. This system converts those opinions into measurable, repeatable, and trackable data.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">Assessment Philosophy</h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every player rating must be generated from: <strong>standardized drills, repeatable testing procedures, objective measurements,</strong> and <strong>position-specific calculations.</strong> The same player should receive similar ratings regardless of which coach performs the assessment.
            </p>
          </div>
        </div>
      </div>

      {/* FPRDS Scoring & Ranking Formula */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Hash size={18} className="text-indigo-600" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">FPRDS Scoring &amp; Ranking Formula System</h3>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          How raw drill results become 0–100 attribute scores. Every attribute score in FPRDS is generated in <strong>three steps</strong>: raw result → benchmark conversion → linear interpolation.
        </p>

        {/* Step 1 */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded">Step 1</span>
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Age Group Classification</h4>
          </div>
          <p className="text-xs text-slate-600">Before any score is calculated, the player is assigned to an age group. All benchmark tables are age-grouped.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse mt-2">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-2 border border-slate-200 font-bold text-slate-700">Age Group</th>
                  <th className="text-left p-2 border border-slate-200 font-bold text-slate-700">Age Range</th>
                  <th className="text-left p-2 border border-slate-200 font-bold text-slate-700">Label</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-200 font-mono text-slate-700">U12</td>
                  <td className="p-2 border border-slate-200 text-slate-600">10–12</td>
                  <td className="p-2 border border-slate-200 text-slate-600">Youth — Junior</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200 font-mono text-slate-700">U15</td>
                  <td className="p-2 border border-slate-200 text-slate-600">13–15</td>
                  <td className="p-2 border border-slate-200 text-slate-600">Youth — Intermediate</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200 font-mono text-slate-700">U18</td>
                  <td className="p-2 border border-slate-200 text-slate-600">16–18</td>
                  <td className="p-2 border border-slate-200 text-slate-600">Youth — Senior</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200 font-mono text-slate-700">Adult</td>
                  <td className="p-2 border border-slate-200 text-slate-600">18+</td>
                  <td className="p-2 border border-slate-200 text-slate-600">Open / Amateur</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 italic">For mixed environments, always classify by the player's age at the time of assessment. A player moving between groups mid-season will have their historical scores benchmarked against the group they were in at assessment date.</p>
        </div>

        {/* Step 2 */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded">Step 2</span>
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Benchmark Tables</h4>
          </div>
          <p className="text-xs text-slate-600">Each drill has a benchmark table with <strong>5 tiers</strong> mapping to score ranges:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse mt-2">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-2 border border-slate-200 font-bold text-slate-700">Tier</th>
                  <th className="text-left p-2 border border-slate-200 font-bold text-slate-700">Score Range</th>
                  <th className="text-left p-2 border border-slate-200 font-bold text-slate-700">Label</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-200"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Elite</span></td>
                  <td className="p-2 border border-slate-200 font-mono text-slate-700">90–99</td>
                  <td className="p-2 border border-slate-200 text-slate-600">Top-level performer</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">Advanced</span></td>
                  <td className="p-2 border border-slate-200 font-mono text-slate-700">75–89</td>
                  <td className="p-2 border border-slate-200 text-slate-600">Above average</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200"><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">Developing</span></td>
                  <td className="p-2 border border-slate-200 font-mono text-slate-700">55–74</td>
                  <td className="p-2 border border-slate-200 text-slate-600">Average / on track</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold">Below Avg</span></td>
                  <td className="p-2 border border-slate-200 font-mono text-slate-700">35–54</td>
                  <td className="p-2 border border-slate-200 text-slate-600">Needs improvement</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">Beginner</span></td>
                  <td className="p-2 border border-slate-200 font-mono text-slate-700">10–34</td>
                  <td className="p-2 border border-slate-200 text-slate-600">Significant gap</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 italic">Scores below 10 are possible only in extreme cases. No score is ever 0 unless a drill is not attempted.</p>
        </div>

        {/* Step 3 */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded">Step 3</span>
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Linear Interpolation Formula</h4>
          </div>
          <p className="text-xs text-slate-600">Once the benchmark tier is identified, the exact score within that tier is calculated using:</p>
          <div className="bg-slate-900 text-emerald-300 p-3 rounded-lg font-mono text-xs overflow-x-auto mt-2">
            Score = Tier_Min + ((Best_In_Tier - Raw_Result) / (Best_In_Tier - Worst_In_Tier)) × (Tier_Max - Tier_Min)
          </div>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
            <li><strong>Time-based drills</strong> (lower = better): Best_In_Tier is the fastest time in the tier</li>
            <li><strong>Distance/count-based drills</strong> (higher = better): Best_In_Tier is the highest value in the tier</li>
          </ul>
        </div>

        {/* Example */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-indigo-600" />
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Worked Example — 30m Sprint (Time-Based)</h4>
          </div>
          <p className="text-xs text-slate-700">
            Player records <strong>4.35 seconds</strong>. Age group: <strong>Adult</strong>.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-indigo-100/50">
                  <th className="text-left p-2 border border-indigo-200 font-bold text-slate-700">Tier</th>
                  <th className="text-left p-2 border border-indigo-200 font-bold text-slate-700">Time Range</th>
                  <th className="text-left p-2 border border-indigo-200 font-bold text-slate-700">Score Range</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-indigo-100 text-slate-600">Elite</td>
                  <td className="p-2 border border-indigo-100 font-mono text-slate-600">&lt; 3.90s</td>
                  <td className="p-2 border border-indigo-100 font-mono text-slate-600">90–99</td>
                </tr>
                <tr>
                  <td className="p-2 border border-indigo-100 text-slate-600">Advanced</td>
                  <td className="p-2 border border-indigo-100 font-mono text-slate-600">3.90s – 4.19s</td>
                  <td className="p-2 border border-indigo-100 font-mono text-slate-600">75–89</td>
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-2 border border-indigo-100 font-bold text-amber-700">Developing</td>
                  <td className="p-2 border border-indigo-100 font-mono font-bold text-amber-700">4.20s – 4.59s</td>
                  <td className="p-2 border border-indigo-100 font-mono font-bold text-amber-700">55–74</td>
                </tr>
                <tr>
                  <td className="p-2 border border-indigo-100 text-slate-600">Below Avg</td>
                  <td className="p-2 border border-indigo-100 font-mono text-slate-600">4.60s – 4.99s</td>
                  <td className="p-2 border border-indigo-100 font-mono text-slate-600">35–54</td>
                </tr>
                <tr>
                  <td className="p-2 border border-indigo-100 text-slate-600">Beginner</td>
                  <td className="p-2 border border-indigo-100 font-mono text-slate-600">5.00s+</td>
                  <td className="p-2 border border-indigo-100 font-mono text-slate-600">10–34</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-700">
            Player falls in <strong>Developing</strong> tier (4.20s – 4.59s → score range 55–74).
          </p>
          <div className="bg-white border border-indigo-200 rounded-lg p-3 font-mono text-xs text-slate-700 space-y-1">
            <div>Score = 55 + ((4.59 - 4.35) / (4.59 - 4.20)) × (74 - 55)</div>
            <div>Score = 55 + (0.24 / 0.39) × 19</div>
            <div>Score = 55 + 0.615 × 19</div>
            <div>Score = 55 + 11.7</div>
            <div className="text-indigo-700 font-bold pt-1 border-t border-indigo-100 mt-1">30m Sprint Sub-Score = 67</div>
          </div>
        </div>
      </div>

      {/* Future AI Assistant */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Brain size={18} className="text-purple-600" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Future: AI Assistant for Coaches</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Beyond objective ratings, a planned AI assistant layer will help coaches make faster, smarter decisions by analyzing the data already captured in the platform.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: 'Game Analysis', desc: 'AI evaluates recent match results and training loads to summarize team performance trends.' },
            { title: 'Drill Recommendations', desc: 'Automatically suggests specific drills from the 52-drill library to address identified squad weaknesses.' },
            { title: 'Pre-Match Briefings', desc: 'Generates automated tactical focus points and opponent preparation checklists based on historical data.' },
            { title: 'Development Flags', desc: 'AI-generated alerts when a player shows unusual progress, regression, or readiness for advancement.' }
          ].map(item => (
            <div key={item.title} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <h5 className="text-[11px] font-black text-slate-800 mb-1">{item.title}</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <TrendingUp size={18} className="text-emerald-600" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Development Timeline (At a Glance)</h3>
        </div>
        <div className="space-y-4">
          {[
            { phase: 'Now (Beta)', label: 'Current Phase', desc: 'Subjective coach-driven ratings. Local-first team management. Feedback-driven iteration.', color: 'border-amber-400 bg-amber-50' },
            { phase: 'Phase 1', label: 'Stabilization', desc: 'Polish core workflows. Improve data integrity. Accessibility and mobile responsiveness.', color: 'border-blue-400 bg-blue-50' },
            { phase: 'Phase 2', label: 'SaaS Foundation', desc: 'Cloud persistence. User authentication. Multi-user team accounts and role-based collaboration.', color: 'border-indigo-400 bg-indigo-50' },
            { phase: 'Phase 3', label: 'FPRDS Launch', desc: 'Objective ratings via standardized drills. Benchmark tables. Linear interpolation scoring. FIFA-style player cards.', color: 'border-emerald-400 bg-emerald-50' },
            { phase: 'Phase 4', label: 'AI Assistant', desc: 'Game analysis. Drill recommendations. Pre-match briefings. Development tracking and alerts.', color: 'border-purple-400 bg-purple-50' }
          ].map((item, i) => (
            <div key={item.phase} className={`border-l-4 ${item.color} rounded-r-xl p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.phase}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{item.label}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center pb-4">
        <p className="text-[10px] text-slate-400">
          Stack Team Manager — Beta Version · Built for coaches, shaped by feedback · Thank you for testing
        </p>
      </div>
    </div>
  );
}
