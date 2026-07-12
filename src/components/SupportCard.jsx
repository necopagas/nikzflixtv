import React, { useEffect, useState } from 'react';

const getStoredQrCode = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('gcash_qr')?.trim() || '';
};

export const SupportCard = ({
  title = 'Support the Developer',
  description = 'Thank you for using NikzFlix. Your support helps keep the experience polished, fast, and full of great new content.',
  buttonLabel = 'Support NikzFlix',
  className = '',
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(getStoredQrCode);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    const syncQrCode = () => setQrCodeUrl(getStoredQrCode());
    syncQrCode();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', syncQrCode);
      return () => window.removeEventListener('storage', syncQrCode);
    }
  }, []);

  const handleUnlock = e => {
    e.preventDefault();
    if (password === 'babe1010') {
      setIsUnlocked(true);
      setUploadMessage('');
    } else {
      setUploadMessage('Incorrect password.');
    }
  };

  const handleFileUpload = event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      if (typeof window !== 'undefined' && typeof base64 === 'string') {
        window.localStorage.setItem('gcash_qr', base64);
        setQrCodeUrl(base64);
        setUploadMessage('QR uploaded successfully.');
      }
    };
    reader.onerror = () => {
      setUploadMessage('Unable to read the selected image.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <section
      className={`mx-auto my-8 w-full max-w-5xl rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_36%),linear-gradient(135deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.02))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl ${className}`.trim()}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex w-fit items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
            Support NikzFlix
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:min-w-[220px]">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="GCash QR code"
                className="h-44 w-full rounded-xl object-contain bg-white/90 p-3"
              />
            ) : (
              <div className="flex h-44 w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 px-4 text-center text-sm font-medium text-white/70">
                No QR code uploaded yet
              </div>
            )}
          </div>

          {!isUnlocked ? (
            <form
              onSubmit={handleUnlock}
              className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3"
            >
              <label
                className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
                htmlFor="admin-password"
              >
                Admin Access
              </label>
              <input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              />
              <button
                type="submit"
                className="w-full rounded-full border border-white/15 bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-100 transition-all duration-200 hover:bg-amber-400/30"
              >
                Unlock Admin Dashboard
              </button>
            </form>
          ) : (
            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
              <label
                className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
                htmlFor="qr-upload"
              >
                Upload QR Code
              </label>
              <input
                id="qr-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white file:mr-3 file:rounded-full file:border-0 file:bg-white/20 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
              {uploadMessage ? <p className="text-sm text-amber-200">{uploadMessage}</p> : null}
            </div>
          )}

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open('https://www.buymeacoffee.com', '_blank', 'noopener,noreferrer');
              }
            }}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </section>
  );
};
