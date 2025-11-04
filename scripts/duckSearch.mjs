const query = process.argv.slice(2).join(' ');
if (!query) {
  console.error('Usage: node scripts/duckSearch.mjs <query>');
  process.exit(1);
}

const run = async () => {
  const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; IPTVDiscoveryBot/1.0)',
      Accept: 'text/html',
    },
  });
  const text = await response.text();
  const regex = /https?:\/\/[^\s"'<>]+\.(m3u8|mpd)[^\s"'<>]*/gi;
  const matches = Array.from(text.matchAll(regex)).map((m) => m[0]);
  console.log('Found', matches.length, 'matches');
  console.log(matches.slice(0, 10));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
