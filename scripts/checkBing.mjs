const fetchPage = async () => {
  const response = await fetch('https://www.bing.com/search?q=PTV+m3u8', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; IPTVDiscoveryBot/1.0)',
      Accept: 'text/html',
    },
  });
  const text = await response.text();
  const regex = /https?:\/\/[^\s"'<>]+\.(m3u8|mpd)[^\s"'<>]*/gi;
  const matches = Array.from(text.matchAll(regex)).map((m) => m[0]);
  console.log('matches', matches.length);
  console.log(matches.slice(0, 5));
};

fetchPage().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
