// Detect common Smart TV user agents and expose helper functions
export function detectSmartTV(
  userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
) {
  const ua = String(userAgent).toLowerCase();
  return {
    isTizen: /tizen/.test(ua),
    isWebOS: /webos|web0s/.test(ua),
    isAndroidTV: /android tv|aft|bravia|googletv|smarttv|shield/.test(ua),
    isLG: /lg-netcast|lgwebkit/.test(ua),
    isSamsungBrowser: /samsungbrowser/.test(ua),
    isSmartTV: /smarttv|smart-tv|appletv|hbbtv|tizen|webos|netcast|googletv|aft/.test(ua),
    raw: ua,
  };
}

export default function isSmartTV() {
  return detectSmartTV().isSmartTV;
}
