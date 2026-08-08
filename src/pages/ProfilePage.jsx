import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { updatePassword, updateProfile } from 'firebase/auth';
import { FaUserCircle, FaLock, FaPlus, FaTrash, FaEdit, FaChild, FaEyeSlash } from 'react-icons/fa';

const avatarOptions = ['N', 'F', 'K', 'A', 'V', 'M', 'S', 'T'];
const accentOptions = ['#E50914', '#7c3aed', '#22c55e', '#0ea5e9', '#f59e0b', '#ec4899'];

export const ProfilePage = () => {
  const { currentUser } = useAuth();
  const {
    profiles,
    activeProfile,
    activeProfileId,
    selectProfile,
    addProfile,
    updateProfile: updateSavedProfile,
    removeProfile,
    unlockKidsProfile,
    isKidsUnlocked,
    setParentPin,
    parentPin,
  } = useProfile();

  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('N');
  const [newProfileAccent, setNewProfileAccent] = useState('#E50914');
  const [newProfileKids, setNewProfileKids] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [activeEditName, setActiveEditName] = useState(activeProfile?.name || '');
  const [activeEditAvatar, setActiveEditAvatar] = useState(activeProfile?.avatar || 'N');
  const [activeEditAccent, setActiveEditAccent] = useState(activeProfile?.accent || '#E50914');
  const [username, setUsername] = useState(currentUser?.displayName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');

  const activeIsKidsLocked = activeProfile?.isKids && !isKidsUnlocked;

  const profileCountText = useMemo(() => `${profiles.length}/5 profiles in use`, [profiles.length]);

  const handleAddProfile = e => {
    e.preventDefault();
    const result = addProfile({
      name: newProfileName.trim() || 'New Profile',
      avatar: newProfileAvatar,
      accent: newProfileAccent,
      isKids: newProfileKids,
    });
    if (result?.ok) {
      setNewProfileName('');
      setNewProfileAvatar('N');
      setNewProfileAccent('#E50914');
      setNewProfileKids(false);
    }
  };

  const handleSaveActiveProfile = e => {
    e.preventDefault();
    if (!activeProfile) return;
    updateSavedProfile(activeProfile.id, {
      name: activeEditName.trim() || activeProfile.name,
      avatar: activeEditAvatar || activeProfile.avatar,
      accent: activeEditAccent,
      isKids: activeProfile.isKids,
    });
  };

  const handleParentPinSave = e => {
    e.preventDefault();
    if (setParentPin(pinInput)) {
      setPinInput('');
      setAccountMessage('Parent PIN updated.');
      setAccountError('');
    } else {
      setAccountError('Enter a valid 4-digit PIN.');
    }
  };

  const handleUnlockKids = e => {
    e.preventDefault();
    const result = unlockKidsProfile(pinInput);
    if (result.ok) {
      setAccountMessage('Kids profile unlocked for this session.');
      setAccountError('');
      setPinInput('');
    } else {
      setAccountError('Incorrect parent PIN.');
    }
  };

  const handlePasswordUpdate = async e => {
    e.preventDefault();
    setAccountError('');
    setAccountMessage('');

    if (!currentUser) {
      setAccountError('Log in first to update your account password.');
      return;
    }
    if (password !== confirmPassword) {
      setAccountError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setAccountError('Password must be at least 6 characters.');
      return;
    }

    try {
      await updatePassword(currentUser, password);
      setPassword('');
      setConfirmPassword('');
      setAccountMessage('Password updated successfully.');
    } catch (error) {
      console.error(error);
      setAccountError('Password update failed. Try logging out and back in first.');
    }
  };

  const handleUsernameUpdate = async e => {
    e.preventDefault();
    setAccountError('');
    setAccountMessage('');

    if (!currentUser) {
      setAccountError('Log in first to update your display name.');
      return;
    }

    try {
      await updateProfile(currentUser, { displayName: username.trim() });
      setAccountMessage('Display name updated successfully.');
    } catch (error) {
      console.error(error);
      setAccountError('Failed to update display name.');
    }
  };

  if (!activeProfile) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen px-4 pt-28 pb-20 sm:px-8 md:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="glass-card border border-white/10 bg-black/35 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/60">
                <FaUserCircle className="text-red-500" />
                Who&apos;s Watching?
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">Profiles & account</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/65">
                Manage up to five profiles, switch the active viewer, and keep the Kids profile
                protected with a parent PIN.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              <div className="font-semibold text-white">{profileCountText}</div>
              <div className="mt-1">
                Active profile: <span className="text-white">{activeProfile.name}</span>
              </div>
            </div>
          </div>
        </section>

        {activeIsKidsLocked && (
          <section className="rounded-3xl border border-yellow-400/25 bg-yellow-400/10 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-yellow-200">
                  <FaChild />
                  Kids profile locked
                </div>
                <h2 className="text-2xl font-bold">Enter the parent PIN to unlock viewing</h2>
                <p className="mt-1 text-sm text-yellow-50/70">
                  This unlock is session-based and keeps the Kids profile safe for a shared TV.
                </p>
              </div>
              <form onSubmit={handleUnlockKids} className="flex gap-2">
                <input
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                  className="w-28 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center tracking-[0.4em] text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-yellow-400 px-4 py-3 font-semibold text-black transition hover:bg-yellow-300"
                >
                  Unlock
                </button>
              </form>
            </div>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">All Profiles</h2>
                <div className="text-sm text-white/55">{profiles.length} / 5 used</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {profiles.map(profile => {
                  const active = profile.id === activeProfileId;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => selectProfile(profile.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? 'border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(228,9,20,0.18)]'
                          : 'border-white/10 bg-black/20 hover:bg-black/35'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black text-white"
                          style={{ background: profile.accent }}
                        >
                          {profile.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-lg font-semibold">{profile.name}</div>
                            {profile.isKids && <FaChild className="text-green-400" />}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.22em] text-white/45">
                            {profile.isKids ? 'Kids profile' : 'Standard profile'}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <FaEdit className="text-red-500" />
                <h2 className="text-xl font-bold">Edit Active Profile</h2>
              </div>
              <form onSubmit={handleSaveActiveProfile} className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm text-white/60">Name</span>
                  <input
                    value={activeEditName}
                    onChange={e => setActiveEditName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/60">Avatar</span>
                  <select
                    value={activeEditAvatar}
                    onChange={e => setActiveEditAvatar(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {avatarOptions.map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/60">Accent</span>
                  <select
                    value={activeEditAccent}
                    onChange={e => setActiveEditAccent(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {accentOptions.map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-red-600 px-5 py-3 font-semibold transition hover:bg-red-500"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <FaPlus className="text-red-500" />
                <h2 className="text-xl font-bold">Create Profile</h2>
              </div>
              <form onSubmit={handleAddProfile} className="space-y-4">
                <input
                  value={newProfileName}
                  onChange={e => setNewProfileName(e.target.value)}
                  placeholder="Profile name"
                  maxLength={18}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newProfileAvatar}
                    onChange={e => setNewProfileAvatar(e.target.value)}
                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {avatarOptions.map(value => (
                      <option key={value} value={value}>
                        Avatar {value}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newProfileAccent}
                    onChange={e => setNewProfileAccent(e.target.value)}
                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {accentOptions.map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={newProfileKids}
                    onChange={e => setNewProfileKids(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black/40 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm text-white/75">Create as Kids profile</span>
                </label>
                <button
                  type="submit"
                  disabled={profiles.length >= 5}
                  className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {profiles.length >= 5 ? 'Profile limit reached' : 'Add Profile'}
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <FaLock className="text-red-500" />
                <h2 className="text-xl font-bold">Parent PIN</h2>
              </div>
              <form onSubmit={handleParentPinSave} className="space-y-4">
                <div className="text-sm text-white/60">
                  Current PIN is set to <span className="text-white">{parentPin}</span>.
                </div>
                <input
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 tracking-[0.4em] text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-red-600 px-5 py-3 font-semibold transition hover:bg-red-500"
                >
                  Save Parent PIN
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <FaTrash className="text-red-500" />
                <h2 className="text-xl font-bold">Profile Actions</h2>
              </div>
              <p className="text-sm text-white/60">
                Use the current viewer profile as the active home, list, and history scope.
              </p>
              <button
                type="button"
                onClick={() => removeProfile(activeProfileId)}
                className="mt-4 rounded-xl border border-white/10 bg-black/25 px-5 py-3 font-semibold text-white transition hover:bg-black/40"
              >
                Delete Active Profile
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <FaEyeSlash className="text-red-500" />
                <h2 className="text-xl font-bold">Account</h2>
              </div>

              {currentUser ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                    Signed in as <span className="text-white">{currentUser.email}</span>
                  </div>

                  <form onSubmit={handleUsernameUpdate} className="space-y-3">
                    <input
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button className="rounded-xl bg-red-600 px-5 py-3 font-semibold transition hover:bg-red-500">
                      Update Display Name
                    </button>
                  </form>

                  <form onSubmit={handlePasswordUpdate} className="space-y-3">
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-white/90">
                      Update Password
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-sm text-white/60">
                  Sign in to sync your account password and display name across devices.
                </div>
              )}

              {(accountMessage || accountError) && (
                <div className="mt-4 space-y-2">
                  {accountMessage && (
                    <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                      {accountMessage}
                    </div>
                  )}
                  {accountError && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {accountError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
