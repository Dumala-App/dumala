import React from 'react';
import { FlaskConical, Megaphone, Target, TrendingUp } from 'lucide-react';
import ChangelogList from './updates/ChangelogList';
import RoadmapSnapshot from './updates/RoadmapSnapshot';
import { productChangelogEntries } from './updates/changelog';

// The coach-facing Updates tab in League & Updates. The entries themselves live
// in ./updates/changelog and are also published publicly at #/devlog; only the
// framing around them (purpose, beta ask) is specific to signed-in coaches.

export default function UpdatesView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0f172a] text-white rounded-2xl p-6 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <img src="/Dumala_logo.png" alt="" className="w-[160px] h-[160px] object-contain" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/Dumala_logo.png" alt="Dumala" className="w-14 h-14 rounded-xl object-contain shrink-0" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest">Dev Notes</span>
                <span className="text-slate-400 text-xs font-mono">Updates &amp; Development Log</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">Dumala — Developer Updates &amp; Product Roadmap</h2>
              <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
                Stay informed about the purpose behind this app, current development status, and the vision for future features including the Football Player Rating &amp; Development System.
              </p>
            </div>
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
          <strong>Dumala</strong> was built to solve a real problem: football coaches and club managers at the grassroots, amateur, and academy levels spend far too much time juggling disconnected tools. Team data lives in spreadsheets, chat threads, notebooks, and memory — scattered, fragile, and hard to act on.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          This app consolidates the core operating loop of running a football team into one workspace. Roster management, match scheduling, result logging, training planning, tactical notes, discipline tracking, and MVP awards — all in a single interface designed specifically for the coach who wants to spend less time administering and more time coaching.
        </p>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
          <li>Replace fragmented spreadsheets and chat threads with a unified team dashboard</li>
          <li>Automate standings updates and player stat tracking from match results</li>
          <li>Plan training weeks with an 85-drill library and preset templates</li>
          <li>Track player availability, opponent intel, and tactical notes before fixtures</li>
          <li>Build a foundation for objective, data-driven player assessment and development</li>
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
        <RoadmapSnapshot />
      </div>

      {/* Product Changelog */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <TrendingUp size={18} className="text-emerald-600" />
          <div>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Product Changelog</h3>
            <p className="text-xs text-slate-500 mt-1">Dated development updates and roadmap history</p>
          </div>
        </div>

        <ChangelogList entries={productChangelogEntries} />
      </div>
    </div>
  );
}
