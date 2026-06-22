import React, { useState } from 'react';
import { Announcement } from '../types';
import { Megaphone, MessageSquare, Plus, Bell, Info, ShieldAlert, BookOpen, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  onAddAnnouncement: (newAnn: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
}

type AnnouncementCategory = Announcement['category'];

const ANNOUNCEMENT_CATEGORIES: readonly AnnouncementCategory[] = ['Urgent', 'Matchday', 'Training', 'Social'];

const parseAnnouncementCategory = (value: string): AnnouncementCategory => (
  ANNOUNCEMENT_CATEGORIES.includes(value as AnnouncementCategory) ? value as AnnouncementCategory : 'Urgent'
);

export default function AnnouncementsView({ announcements, onAddAnnouncement, onDeleteAnnouncement }: AnnouncementsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [realCategory, setRealCategory] = useState<AnnouncementCategory>("Urgent");
  const [author, setAuthor] = useState("Marcus Sterling (Coach)");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnn: Announcement = {
      id: "a_" + Date.now(),
      title: title.trim(),
      content: content.trim(),
      date: new Date().toISOString().split('T')[0],
      category: realCategory,
      author: author.trim()
    };

    onAddAnnouncement(newAnn);

    setTitle("");
    setContent("");
    setRealCategory("Urgent");
    setIsAdding(false);
  };

  return (
    <div id="announcements-view-container" className="space-y-6">
      
      {/* Title Header Panel */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-md shadow-slate-100/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center">
            <Megaphone size={18} className="animate-bounce" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-lg">Team Bulletin Board</h3>
            <p className="text-slate-400 text-xs">Official communications and game-day alerts for all squad members.</p>
          </div>
        </div>

        <button
          id="toggle-announcement-form-btn"
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 border border-indigo-650/10"
        >
          {isAdding ? <Plus size={14} className="rotate-45" /> : <Plus size={14} />}
          {isAdding ? 'Cancel Post' : 'Post Announcement'}
        </button>
      </div>

      {/* Write Announcement Form */}
      {isAdding && (
        <motion.div
          id="add-announcement-form-container"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white p-6 rounded-2xl border border-slate-250 shadow-md shadow-slate-100/35 space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Megaphone className="text-indigo-600" size={18} />
            <h4 className="font-display font-semibold text-slate-800">Draft Bulletin Notice</h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Headline Notice *</label>
                <input 
                  id="ann-title-input"
                  type="text" 
                  required 
                  placeholder="e.g. Venue Change: Match vs Vanguard"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Importance Category *</label>
                <select
                  id="ann-category-select"
                  value={realCategory}
                  onChange={e => setRealCategory(parseAnnouncementCategory(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Urgent">⚠️ Urgent Action Required</option>
                  <option value="Matchday">⚽ Match Day details</option>
                  <option value="Training">🏃 Training Session info</option>
                  <option value="Social">🍻 Social Events</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 font-medium">Author Name / Role *</label>
                <input 
                  id="ann-author-input"
                  type="text" 
                  required 
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Body Content *</label>
                <textarea 
                  id="ann-content-input"
                  required
                  placeholder="Detailed directions, timing changes, setup arrangements, kits..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-50 pt-3">
              <button 
                id="cancel-add-ann-btn"
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button 
                id="submit-ann-btn"
                type="submit" 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
              >
                Publish Notice
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Announcements List */}
      <div id="announcement-bulletins-list" className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white text-center py-12 rounded-2xl border border-slate-100 flex flex-col items-center justify-center space-y-3">
            <Bell size={32} className="text-slate-300 animate-wiggle" />
            <h4 className="font-semibold text-slate-700">Notice Bulletin empty</h4>
            <p className="text-slate-400 text-xs text-center px-6">Any coach updates or schedule changes will highlight here.</p>
          </div>
        ) : (
          announcements.map((ann) => {
            const isUrgent = ann.category === 'Urgent';
            const isMatchday = ann.category === 'Matchday';
            const isTraining = ann.category === 'Training';

            return (
              <motion.div
                id={`ann-card-${ann.id}`}
                key={ann.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border p-5 shadow-md shadow-slate-100/30 hover:shadow-lg transition-all relative overflow-hidden ${
                  isUrgent ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200/60'
                }`}
              >
                {/* Left accent bar based on category */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  isUrgent ? 'bg-rose-500' :
                  isMatchday ? 'bg-blue-500' :
                  isTraining ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`} />

                <div className="flex justify-between items-start pl-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span id={`ann-${ann.id}-cat-badge`} className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full ${
                        isUrgent ? 'bg-rose-100 text-rose-800' :
                        isMatchday ? 'bg-blue-100 text-blue-800' :
                        isTraining ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ann.category}
                      </span>
                      <span id={`ann-${ann.id}-date`} className="text-slate-400 text-xs">
                        Posted: {ann.date}
                      </span>
                    </div>

                    <h4 id={`ann-${ann.id}-title`} className="font-display font-bold text-slate-800 text-base md:text-lg pt-1">
                      {ann.title}
                    </h4>
                  </div>

                  <button
                    id={`delete-ann-btn-${ann.id}`}
                    onClick={() => onDeleteAnnouncement(ann.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove Bulletin"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-3.5 pl-2">
                  <p id={`ann-${ann.id}-content`} className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {ann.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 pl-2 border-t border-slate-100/50 flex justify-between items-center text-xs text-slate-400">
                  <span id={`ann-${ann.id}-author`} className="font-semibold text-slate-500 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                      {ann.author.charAt(0).toUpperCase()}
                    </span>
                    {ann.author}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Info size={12} className="text-slate-400" /> Only Coaches and Admins can delete notices
                  </div>
                </div>

              </motion.div>
            );
          })
        )}
      </div>

    </div>
  );
}
