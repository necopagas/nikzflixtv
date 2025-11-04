const fetchSearch = async () => {
  const response = await fetch('https://github.com/search?q=PTV%20m3u8&type=code', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; IPTVDiscoveryBot/1.0)',
      Accept: 'text/html',
    },
  });
  const text = await response.text();
  const matches = Array.from(text.matchAll(/href="([^"']+\.m3u8[^"']*)"/gi)).map((m) => m[1]);
  console.log('matches', matches.length);
  console.log(matches.slice(0, 5));
};

fetchSearch().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
