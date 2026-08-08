import React, { useMemo, useState } from 'react';
import { FaChevronDown, FaUserCircle } from 'react-icons/fa';
import { useProfile } from '../context/ProfileContext.jsx';

export const ProfileSwitcher = ({ compact = false }) => {
  const [open, setOpen] = useState(false);
  const { profiles, activeProfile, selectProfile } = useProfile();

  const activeLabel = useMemo(() => {
    if (!activeProfile) return 'Profile';
    return `${activeProfile.name}${activeProfile.isKids ? ' Kids' : ''}`;
  }, [activeProfile]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/90 backdrop-blur-md transition hover:bg-white/10 ${
          compact ? 'px-3 py-2' : 'px-4 py-2.5'
        }`}
        aria-expanded={open}
      >
        <FaUserCircle className="text-red-500" />
        <span className="max-w-[9rem] truncate">{activeLabel}</span>
        <FaChevronDown className={`text-xs transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#111318]/95 p-2 shadow-2xl backdrop-blur-xl">
            <div className="px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/45">
              Who&apos;s watching?
            </div>
            <div className="space-y-1">
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => {
                    selectProfile(profile.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                    activeProfile?.id === profile.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/75 hover:bg-white/5'
                  }`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: profile.accent }}
                  >
                    {profile.avatar}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{profile.name}</div>
                    <div className="text-xs uppercase tracking-[0.22em] text-white/40">
                      {profile.isKids ? 'Kids profile' : 'Standard profile'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
