import React, { useRef, useState } from 'react';
import { Briefcase, Calendar, Edit2, Mail, Phone, Save, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { StaffMember } from '../types';
import { STAFF_POSITIONS } from '../types';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

interface StaffProfileModalProps {
  staff: StaffMember;
  onClose: () => void;
  onUpdate: (staff: StaffMember) => void;
  onRemove: (staffId: string) => void;
}

export default function StaffProfileModal({ staff, onClose, onUpdate, onRemove }: StaffProfileModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [name, setName] = useState(staff.name);
  const [role, setRole] = useState(staff.role);
  const [bio, setBio] = useState(staff.bio);
  const [photoUrl, setPhotoUrl] = useState(staff.photoUrl);
  const [email, setEmail] = useState(staff.email ?? '');
  const [phone, setPhone] = useState(staff.phone ?? '');
  const [since, setSince] = useState(staff.since ?? '');
  const [status, setStatus] = useState(staff.status);
  const [nameError, setNameError] = useState('');
  useDialogAccessibility(dialogRef, true, onClose);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Staff name is required.');
      dialogRef.current?.querySelector<HTMLInputElement>('#edit-staff-name')?.focus();
      return;
    }

    onUpdate({
      ...staff,
      name: trimmedName,
      role: role.trim() || 'Staff',
      bio,
      photoUrl,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      since: since.trim() || undefined,
      status
    });
    setNameError('');
    setIsEditing(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-profile-title"
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
      >
        <header className="bg-[#07111f] px-5 py-5 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close staff profile"
            className="absolute right-4 top-4 rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-4 pr-10">
            <img src={photoUrl} alt={name} className="h-20 w-20 rounded-lg border border-white/15 object-cover" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-amber-300">Management & Staff</p>
              <h2 id="staff-profile-title" className="truncate font-display text-2xl font-black">{name}</h2>
              <p className="mt-1 text-sm font-bold text-slate-300">{role}</p>
            </div>
          </div>
        </header>

        <div className="space-y-5 p-5">
          {isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-700">
                Full name
                <input
                  id="edit-staff-name"
                  value={name}
                  onChange={event => {
                    setName(event.target.value);
                    setNameError('');
                  }}
                  aria-invalid={Boolean(nameError)}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm"
                />
                {nameError && <span className="mt-1 block text-xs text-rose-700">{nameError}</span>}
              </label>
              <label className="text-xs font-bold text-slate-700">
                Role
                <select value={role} onChange={event => setRole(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm">
                  {STAFF_POSITIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  {!STAFF_POSITIONS.includes(role) && <option value={role}>{role}</option>}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-700">
                Email
                <input type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm" />
              </label>
              <label className="text-xs font-bold text-slate-700">
                Phone
                <input value={phone} onChange={event => setPhone(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm" />
              </label>
              <label className="text-xs font-bold text-slate-700">
                With club since
                <input value={since} onChange={event => setSince(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm" />
              </label>
              <label className="text-xs font-bold text-slate-700">
                Status
                <select value={status} onChange={event => setStatus(event.target.value as StaffMember['status'])} className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-700 sm:col-span-2">
                Photo URL
                <input value={photoUrl} onChange={event => setPhotoUrl(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm" />
              </label>
              <label className="text-xs font-bold text-slate-700 sm:col-span-2">
                Biography
                <textarea value={bio} onChange={event => setBio(event.target.value)} rows={5} className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm" />
              </label>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium leading-relaxed text-slate-600">{bio || 'No biography has been added.'}</p>
              <dl className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div className="flex items-center gap-2"><Briefcase size={15} className="text-slate-400" /><span className="text-xs font-bold text-slate-700">{role}</span></div>
                <div className="flex items-center gap-2"><Mail size={15} className="text-slate-400" /><span className="text-xs text-slate-600">{email || 'No email'}</span></div>
                <div className="flex items-center gap-2"><Phone size={15} className="text-slate-400" /><span className="text-xs text-slate-600">{phone || 'No phone'}</span></div>
                <div className="flex items-center gap-2"><Calendar size={15} className="text-slate-400" /><span className="text-xs text-slate-600">{since ? `Since ${since}` : 'Start date not set'}</span></div>
              </dl>
            </>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            {isEditing ? (
              <button type="button" onClick={handleSave} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-xs font-bold text-white"><Save size={14} /> Save staff</button>
            ) : (
              <button type="button" onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"><Edit2 size={14} /> Edit staff</button>
            )}
            <button type="button" onClick={() => setShowRemoveConfirm(true)} className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700"><Trash2 size={14} /> Remove staff</button>
          </div>

          {showRemoveConfirm && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-4" role="alert">
              <h3 className="text-sm font-black text-rose-950">Remove {staff.name}?</h3>
              <p className="mt-1 text-xs text-rose-800">This permanently removes this staff profile from the browser workspace.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => onRemove(staff.id)} className="rounded-md bg-rose-700 px-3 py-2 text-xs font-bold text-white">Confirm removal</button>
                <button type="button" onClick={() => setShowRemoveConfirm(false)} className="rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
