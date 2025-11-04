// src/utils/iptvDrm.js
// Reusable helpers for IPTV DRM and request handling

export const normalizeHeaders = (headers) => {
  if (!headers) return {};
  return Object.entries(headers).reduce((acc, [key, value]) => {
    if (key && typeof value !== 'undefined' && value !== null) {
      acc[key] = String(value);
    }
    return acc;
  }, {});
};

export const base64ToUint8Array = (input) => {
  try {
    const sanitized = String(input || '').replace(/\s/g, '');
    const decoder = (typeof window !== 'undefined' && typeof window.atob === 'function')
      ? window.atob
      : (typeof atob === 'function'
        ? atob
        : (value) => {
            if (typeof Buffer !== 'undefined') {
              return Buffer.from(value, 'base64').toString('binary');
            }
            throw new Error('No base64 decoder available');
          });
    const decoded = decoder(sanitized);
    const buffer = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i += 1) {
      buffer[i] = decoded.charCodeAt(i);
    }
    return buffer;
  } catch (error) {
    console.warn('[IPTV] Failed to decode base64 string', error);
    return null;
  }
};

export const base64ToHex = (input) => {
  const bytes = base64ToUint8Array(input);
  if (!bytes) return null;
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

// dash.js RequestModifier factory to add headers/credentials
export const buildDashRequestModifier = (headerMap, withCredentials = false) => {
  const headers = normalizeHeaders(headerMap);
  return function dashRequestModifier() {
    return {
      modifyRequestHeader: (xhr) => {
        if (withCredentials) {
          xhr.withCredentials = true;
        }
        Object.entries(headers).forEach(([key, value]) => {
          try {
            xhr.setRequestHeader(key, value);
          } catch (err) {
            console.warn('[IPTV] Unable to set DASH header', key, err);
          }
        });
        return xhr;
      },
      modifyRequestURL: (url) => url,
    };
  };
};

// Apply DRM systems to dash.js instance
export const applyDashProtectionData = (player, drmConfig = {}) => {
  if (!player || !drmConfig) return;

  const protectionData = {};

  if (drmConfig.widevine?.licenseUrl) {
    protectionData['com.widevine.alpha'] = {
      serverURL: drmConfig.widevine.licenseUrl,
      httpRequestHeaders: normalizeHeaders(drmConfig.widevine.headers),
    };
    if (drmConfig.widevine.serverCertificate) {
      const cert = base64ToUint8Array(drmConfig.widevine.serverCertificate);
      if (cert) {
        protectionData['com.widevine.alpha'].serverCertificate = cert;
      }
    }
  }

  if (drmConfig.playready?.licenseUrl) {
    protectionData['com.microsoft.playready'] = {
      serverURL: drmConfig.playready.licenseUrl,
      httpRequestHeaders: normalizeHeaders(drmConfig.playready.headers),
    };
  }

  if (drmConfig.clearkey?.keys?.length) {
    protectionData['org.w3.clearkey'] = {
      clearkeys: drmConfig.clearkey.keys.reduce((acc, item) => {
        if (item.kid && item.k) acc[item.kid] = item.k;
        return acc;
      }, {}),
    };
  }

  if (Object.keys(protectionData).length > 0) {
    player.setProtectionData(protectionData);
  }
};

export const buildShakaDrmConfiguration = (drmConfig = {}) => {
  if (!drmConfig || typeof drmConfig !== 'object') return null;

  const servers = {};
  const advanced = {};
  const licenseHeaders = {};
  let clearKeys = null;

  if (drmConfig.widevine?.licenseUrl) {
    servers['com.widevine.alpha'] = drmConfig.widevine.licenseUrl;
    const headers = normalizeHeaders(drmConfig.widevine.headers);
    if (Object.keys(headers).length > 0) {
      licenseHeaders['com.widevine.alpha'] = headers;
    }
    if (drmConfig.widevine.serverCertificate) {
      const cert = base64ToUint8Array(drmConfig.widevine.serverCertificate);
      if (cert) {
        advanced['com.widevine.alpha'] = {
          serverCertificate: cert,
        };
      }
    }
  }

  if (drmConfig.playready?.licenseUrl) {
    servers['com.microsoft.playready'] = drmConfig.playready.licenseUrl;
    const headers = normalizeHeaders(drmConfig.playready.headers);
    if (Object.keys(headers).length > 0) {
      licenseHeaders['com.microsoft.playready'] = headers;
    }
  }

  if (drmConfig.clearkey?.keys?.length) {
    clearKeys = drmConfig.clearkey.keys.reduce((acc, item) => {
      if (!item?.kid || !item?.k) return acc;
      // Attempt to detect base64 keys and convert to hex for Shaka compliance
      const kidHex = /[^a-f0-9]/i.test(item.kid) ? base64ToHex(item.kid) : item.kid.toLowerCase();
      const keyHex = /[^a-f0-9]/i.test(item.k) ? base64ToHex(item.k) : item.k.toLowerCase();
      if (kidHex && keyHex) {
        acc[kidHex] = keyHex;
      }
      return acc;
    }, {});
  }

  if (Object.keys(servers).length === 0 && !clearKeys) {
    return null;
  }

  return {
    servers,
    advanced,
    licenseHeaders,
    clearKeys,
  };
};

// Parse a user input string like "KID:KEY" (can be multiple pairs separated by spaces/newlines/commas)
export const parseClearkeyInput = (raw) => {
  if (!raw) return [];
  return String(raw)
    .split(/[\n,\s]+/)
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [kid, key] = pair.split(':').map((v) => v?.trim());
      return kid && key ? { kid, k: key } : null;
    })
    .filter(Boolean);
};

// Lightweight type detect for URL choosing hls/dash/progressive
export const detectStreamType = (url) => {
  if (!url) return 'unknown';
  const normalized = url.toLowerCase();
  if (normalized.includes('.m3u8')) return 'hls';
  if (normalized.includes('.mpd') || normalized.includes('format=mpd') || normalized.includes('manifest.mpd')) return 'dash';
  if (/\.(mp4|webm|ogg)$/i.test(normalized)) return 'progressive';
  return 'unknown';
};
