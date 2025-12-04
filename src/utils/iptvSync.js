// src/utils/iptvSync.js
// Auto-sync IPTV channels from external source

const EXTERNAL_IPTV_URL =
  'https://raw.githubusercontent.com/aCoDenz/w5s/refs/heads/main/livetv/TVChannels.json';

/**
 * Category mapping based on channel names
 */
const getCategoryFromName = name => {
  const lowerName = name.toLowerCase();

  // Local channels
  if (lowerName.includes('gma') || lowerName.includes('abs') || lowerName.includes('inc tv')) {
    return 'Local';
  }

  // News
  if (
    lowerName.includes('news') ||
    lowerName.includes('aljazeera') ||
    lowerName.includes('bloomberg') ||
    lowerName.includes('bbc news') ||
    lowerName.includes('sky news')
  ) {
    return 'News';
  }

  // Kids
  if (
    lowerName.includes('kids') ||
    lowerName.includes('disney') ||
    lowerName.includes('nickelodeon') ||
    lowerName.includes('nick jr') ||
    lowerName.includes('cartoon') ||
    lowerName.includes('baby') ||
    lowerName.includes('zoomoo') ||
    lowerName.includes('kidoodle')
  ) {
    return 'Kids';
  }

  // Anime
  if (lowerName.includes('anime') || lowerName.includes('hi-yah')) {
    return 'Anime';
  }

  // Sports
  if (
    lowerName.includes('nba') ||
    lowerName.includes('nhl') ||
    lowerName.includes('combat') ||
    lowerName.includes('redbull') ||
    lowerName.includes('sport')
  ) {
    return 'Sports';
  }

  // Music
  if (
    lowerName.includes('mtv') ||
    lowerName.includes('music') ||
    lowerName.includes('hallypop') ||
    lowerName.includes('frontrow')
  ) {
    return 'Music';
  }

  // Documentary
  if (
    lowerName.includes('discovery') ||
    lowerName.includes('nat geo') ||
    lowerName.includes('national geographic') ||
    lowerName.includes('animal planet') ||
    lowerName.includes('travel') ||
    lowerName.includes('wild earth') ||
    lowerName.includes('lotus')
  ) {
    return 'Documentary';
  }

  // Premium
  if (
    lowerName.includes('hbo') ||
    lowerName.includes('showtime') ||
    lowerName.includes('starz') ||
    lowerName.includes('cinemax')
  ) {
    return 'Premium';
  }

  // Movies
  if (
    lowerName.includes('movie') ||
    lowerName.includes('amc') ||
    lowerName.includes('scream') ||
    lowerName.includes('thriller') ||
    lowerName.includes('action') ||
    lowerName.includes('plex') ||
    lowerName.includes('samsung')
  ) {
    return 'Movies';
  }

  // Lifestyle
  if (lowerName.includes('hgtv') || lowerName.includes('food') || lowerName.includes('travel')) {
    return 'Lifestyle';
  }

  // Default to Entertainment
  return 'Entertainment';
};

/**
 * Fetch and parse external IPTV list
 */
export const fetchExternalIPTV = async () => {
  try {
    const response = await fetch(EXTERNAL_IPTV_URL);
    if (!response.ok) {
      console.error('Failed to fetch external IPTV list:', response.status);
      return null;
    }

    const data = await response.json();

    // Convert to our format
    const channels = [];
    let number = 1;

    for (const [name, info] of Object.entries(data)) {
      // Skip the metadata entry
      if (name === '#[ CHANNELS ]') continue;

      channels.push({
        name,
        url: info.link,
        category: getCategoryFromName(name),
        number: number++,
        source: 'external',
      });
    }

    return channels;
  } catch (error) {
    console.error('Error fetching external IPTV:', error);
    return null;
  }
};

/**
 * Merge external channels with local channels (removes duplicates by name)
 */
export const mergeIPTVChannels = (localChannels, externalChannels) => {
  if (!externalChannels) return localChannels;

  const merged = [...localChannels];
  const existingNames = new Set(localChannels.map(ch => ch.name.toUpperCase()));

  // Add only new channels from external source
  let addedCount = 0;
  externalChannels.forEach(channel => {
    if (!existingNames.has(channel.name.toUpperCase())) {
      merged.push({
        ...channel,
        number: merged.length + 1,
      });
      addedCount++;
    }
  });

  console.log(`✅ Merged IPTV: ${addedCount} new channels added from external source`);
  return merged;
};

/**
 * Check for channel updates (compares URLs)
 */
export const checkIPTVUpdates = (localChannels, externalChannels) => {
  if (!externalChannels) return { hasUpdates: false, updates: [] };

  const updates = [];
  const externalMap = new Map(externalChannels.map(ch => [ch.name.toUpperCase(), ch.url]));

  localChannels.forEach(localChannel => {
    const externalUrl = externalMap.get(localChannel.name.toUpperCase());
    if (externalUrl && externalUrl !== localChannel.url) {
      updates.push({
        name: localChannel.name,
        oldUrl: localChannel.url,
        newUrl: externalUrl,
      });
    }
  });

  return {
    hasUpdates: updates.length > 0,
    updates,
    count: updates.length,
  };
};
