const url = process.argv[2];
if (!url) {
  console.error('Usage: node scripts/fetchPage.mjs <url>');
  process.exit(1);
}

const run = async () => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; IPTVDiscoveryBot/1.0)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  const text = await response.text();
  console.log('length', text.length);
  console.log(text.slice(0, 1000));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
