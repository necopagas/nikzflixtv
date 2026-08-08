/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearActiveUnlock,
  createProfile,
  getActiveProfileId,
  isActiveProfileUnlocked,
  loadProfiles,
  migrateLegacyStorageToProfile,
  saveProfiles,
  setActiveProfileId,
  setActiveUnlock,
} from '../utils/profileStorage';

const ProfileContext = createContext(null);

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return ctx;
};

export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileState] = useState(null);
  const [isKidsUnlocked, setIsKidsUnlocked] = useState(false);
  const [parentPin, setParentPinState] = useState(
    localStorage.getItem('nikz_parent_pin_v1') || '1234'
  );

  useEffect(() => {
    const initialProfiles = loadProfiles();
    setProfiles(initialProfiles);

    const resolvedActiveId = getActiveProfileId(initialProfiles);
    setActiveProfileState(resolvedActiveId);
    if (resolvedActiveId) {
      migrateLegacyStorageToProfile(resolvedActiveId);
      setIsKidsUnlocked(isActiveProfileUnlocked(resolvedActiveId));
    }
  }, []);

  useEffect(() => {
    if (!profiles.length) return;
    saveProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    if (!activeProfileId) return;
    setActiveProfileId(activeProfileId);
    setIsKidsUnlocked(isActiveProfileUnlocked(activeProfileId));
  }, [activeProfileId]);

  const activeProfile = useMemo(
    () => profiles.find(profile => profile.id === activeProfileId) || profiles[0] || null,
    [profiles, activeProfileId]
  );

  const selectProfile = profileId => {
    const nextProfile = profiles.find(profile => profile.id === profileId);
    if (!nextProfile) return;
    setActiveProfileState(profileId);
    setActiveProfileId(profileId);
    setIsKidsUnlocked(isActiveProfileUnlocked(profileId));
    migrateLegacyStorageToProfile(profileId);
  };

  const addProfile = input => {
    if (profiles.length >= 5) {
      return { ok: false, reason: 'max-profiles' };
    }

    const nextProfile = createProfile(input);
    const nextProfiles = [...profiles, nextProfile].slice(0, 5);
    setProfiles(nextProfiles);
    setActiveProfileState(nextProfile.id);
    setActiveProfileId(nextProfile.id);
    migrateLegacyStorageToProfile(nextProfile.id);
    return { ok: true, profile: nextProfile };
  };

  const updateProfile = (profileId, updates) => {
    setProfiles(prev =>
      prev.map(profile =>
        profile.id === profileId
          ? {
              ...profile,
              ...updates,
              name: String(updates.name ?? profile.name).slice(0, 18),
              avatar: String(
                updates.avatar ?? profile.avatar ?? String(updates.name ?? profile.name).charAt(0)
              )
                .slice(0, 2)
                .toUpperCase(),
              isKids: Boolean(updates.isKids ?? profile.isKids),
            }
          : profile
      )
    );
  };

  const removeProfile = profileId => {
    if (profiles.length <= 1) return { ok: false, reason: 'minimum-profile' };
    const nextProfiles = profiles.filter(profile => profile.id !== profileId);
    setProfiles(nextProfiles);
    if (activeProfileId === profileId) {
      const fallback = nextProfiles[0]?.id || null;
      setActiveProfileState(fallback);
      if (fallback) {
        setActiveProfileId(fallback);
        setIsKidsUnlocked(isActiveProfileUnlocked(fallback));
      } else {
        clearActiveUnlock();
      }
    }
    return { ok: true };
  };

  const unlockKidsProfile = pin => {
    const targetProfile = activeProfile?.isKids ? activeProfile : null;
    if (!targetProfile) return { ok: true };

    const storedPin = localStorage.getItem('nikz_parent_pin_v1') || '1234';
    if (String(pin || '').trim() !== storedPin) {
      setIsKidsUnlocked(false);
      clearActiveUnlock();
      return { ok: false };
    }

    const payload = {
      profileId: targetProfile.id,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
    setActiveUnlock(payload);
    setIsKidsUnlocked(true);
    return { ok: true };
  };

  const lockKidsProfile = () => {
    clearActiveUnlock();
    setIsKidsUnlocked(false);
  };

  const setParentPin = pin => {
    const normalized = String(pin || '')
      .replace(/\D/g, '')
      .slice(0, 4);
    if (normalized.length === 4) {
      localStorage.setItem('nikz_parent_pin_v1', normalized);
      setParentPinState(normalized);
    }
    return normalized.length === 4;
  };

  const value = {
    profiles,
    activeProfile,
    activeProfileId,
    selectProfile,
    addProfile,
    updateProfile,
    removeProfile,
    unlockKidsProfile,
    lockKidsProfile,
    isKidsUnlocked,
    setParentPin,
    parentPin,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
