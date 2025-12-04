// src/components/ChannelRequestModal.jsx
import React, { useState, useMemo } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../firebase';
import { parseClearkeyInput, detectStreamType } from '../utils/iptvDrm';

export default function ChannelRequestModal({ open, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [url, setUrl] = useState('');
  const [clearkey, setClearkey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const streamType = useMemo(() => detectStreamType(url), [url]);
  const isValid = name.trim() && url.trim();

  const buildChannelObject = () => {
    const ch = {
      name: name.trim(),
      url: url.trim(),
      logo: logo.trim() || undefined,
      category: 'Requested',
      number: null,
    };
    const clearkeyPairs = parseClearkeyInput(clearkey);
    if (streamType === 'dash' && clearkeyPairs.length > 0) {
      ch.dash = { drm: { clearkey: { keys: clearkeyPairs } } };
    }
    return ch;
  };

  const ensureAuth = async () => {
    try {
      if (!auth?.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (e) {
      // If anonymous auth is disabled in console, this throws operation-not-allowed
      console.warn('Anonymous auth unavailable or failed:', e?.code || e);
    }
  };

  const queueLocally = channel => {
    try {
      const key = 'pending_channel_requests';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.push({ ...channel, queuedAt: Date.now() });
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (err) {
      console.warn('Failed to queue request locally', err);
    }
  };

  const onSubmit = async e => {
    e?.preventDefault?.();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await ensureAuth();
      const channel = buildChannelObject();
      try {
        await addDoc(collection(db, 'channel_requests'), {
          ...channel,
          createdAt: serverTimestamp(),
          uid: auth?.currentUser?.uid || null,
        });
      } catch (inner) {
        // Retry once after attempting auth; if still denied, queue locally
        if (
          inner?.code === 'permission-denied' ||
          /Missing or insufficient permissions/i.test(inner?.message || '')
        ) {
          console.warn('Permission denied writing to Firestore, queuing locally');
          queueLocally(channel);
        } else {
          throw inner;
        }
      }
      onSuccess?.(channel);
      onClose?.();
      setName('');
      setLogo('');
      setUrl('');
      setClearkey('');
    } catch (err) {
      console.error('Failed to submit channel request', err);
      const msg = err?.message || 'Submission failed';
      setError(/permission/i.test(msg) ? 'Missing or insufficient permissions.' : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[92vw] max-w-3xl rounded-2xl bg-(--bg-secondary) text-white shadow-2xl border border-(--border-color)">
        <div className="p-5 border-b border-(--border-color) bg-linear-to-r from-(--brand-color)/30 to-red-700/20 rounded-t-2xl">
          <h3 className="text-xl font-bold">
            Add Your Requested Channels <span className="align-middle">😊</span>
          </h3>
          <p className="text-xs opacity-70">(will be stored in admin panel)</p>
        </div>

        <form onSubmit={onSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide">
              Channel name <span className="text-red-400">(required)</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter channel name..."
              className="p-3 rounded-lg bg-(--bg-tertiary) outline-none focus:ring-2 focus:ring-(--brand-color)"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide">
              Channel Logo <span className="text-red-400">(required)</span>
            </label>
            <input
              value={logo}
              onChange={e => setLogo(e.target.value)}
              placeholder="Enter logo URL..."
              className="p-3 rounded-lg bg-(--bg-tertiary) outline-none focus:ring-2 focus:ring-(--brand-color)"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-1">
            <label className="text-xs uppercase tracking-wide">
              Channel Link <span className="text-red-400">(required)</span>
            </label>
            <textarea
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Enter streaming URL (m3u8 / mpd / mp4)"
              className="p-3 rounded-lg min-h-[56px] bg-(--bg-tertiary) outline-none focus:ring-2 focus:ring-(--brand-color)"
            />
            <span className="text-xs opacity-70">
              Detected: <strong className="uppercase">{streamType}</strong>
            </span>
          </div>
          <div className="flex flex-col gap-2 md:col-span-1">
            <label className="text-xs uppercase tracking-wide">
              KEY:KEY <span className="opacity-70">(Optional, for clearkey mpd drm)</span>
            </label>
            <textarea
              value={clearkey}
              onChange={e => setClearkey(e.target.value)}
              placeholder="Enter clearkey pairs like KID:KEY (you can paste multiple separated by spaces or new lines)"
              className="p-3 rounded-lg min-h-[56px] bg-(--bg-tertiary) outline-none focus:ring-2 focus:ring-(--brand-color)"
            />
            {clearkey && streamType !== 'dash' && (
              <span className="text-[10px] text-yellow-400">
                Clearkey is only used for DASH (.mpd). Your link looks like {streamType}.
              </span>
            )}
          </div>

          {error && <div className="md:col-span-2 text-red-400 text-sm">{error}</div>}

          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={`px-4 py-2 rounded-lg font-semibold ${isValid ? 'bg-(--brand-color) hover:bg-red-600' : 'bg-gray-700 cursor-not-allowed'}`}
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
