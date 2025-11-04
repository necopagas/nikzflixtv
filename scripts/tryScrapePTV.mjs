import { discoverChannelStreams } from '../src/utils/channelDiscovery.js';

const args = process.argv.slice(2);
const scrapeOnly = args.includes('--scrape-only');
const channelArgs = args.filter((arg) => arg !== '--scrape-only');
const channelQuery = channelArgs.length ? channelArgs.join(' ') : 'PTV';

const originalFetch = globalThis.fetch;

const patchedFetch = async (input, init) => {
  const target = typeof input === 'string' ? input : (input?.url || input?.href || '');

  if (typeof target === 'string') {
    if (target.includes('iptv-org.github.io/api/channels.json')) {
      return new Response('[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (target.includes('iptv-org.github.io/api/streams.json')) {
      return new Response('[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (target.includes('raw.githubusercontent.com/SheyEm/PH_IPTV') ||
        target.includes('raw.githubusercontent.com/touchmetender/m3u') ||
        target.includes('raw.githubusercontent.com/iptv-org/iptv')) {
      return new Response('#EXTM3U\n', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }

  return originalFetch(input, init);
};

if (scrapeOnly) {
  globalThis.fetch = patchedFetch;
}

const run = async () => {
  try {
    const results = await discoverChannelStreams(channelQuery, {
      country: 'PH',
      localOnly: true,
      maxResults: 8,
      verify: false,
      enableScraping: true,
    });

    if (!results.length) {
      console.log(`No candidates found for ${channelQuery}.`);
      return;
    }

    console.log(`Found ${results.length} candidate groups for ${channelQuery}:`);
    results.forEach((candidate, idx) => {
      console.log(`\n[${idx + 1}] ${candidate.name} (${candidate.origin || 'unknown'}) - ${candidate.streams.length} streams`);
      candidate.streams.slice(0, 5).forEach((stream, sIdx) => {
        console.log(`  (${sIdx + 1}) ${stream.url}`);
        if (stream.source) console.log(`       source: ${stream.source}`);
        if (stream.quality) console.log(`       quality: ${stream.quality}`);
        console.log(`       type: ${stream.streamType}`);
      });
    });
  } catch (error) {
    console.error('Discovery failed:', error);
    process.exitCode = 1;
  }
};

run().finally(() => {
  if (scrapeOnly) {
    globalThis.fetch = originalFetch;
  }
});
