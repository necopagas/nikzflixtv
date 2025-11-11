// Test script to check current Mangakakalot domain
async function checkMangakakalotDomain() {
  const domains = [
    'https://mangakakalot.com',
    'https://mangakakalots.com',
    'https://mangakakalot.io',
    'https://mangakakalot.net',
    'https://mangakakalot.org',
    'https://mangakakalot.tv',
  ];

  for (const domain of domains) {
    try {
      console.log(`\nChecking ${domain}...`);
      const response = await fetch(domain, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        redirect: 'manual', // Don't follow redirects automatically
      });

      console.log(`Status: ${response.status}`);
      console.log(`Redirect: ${response.headers.get('location') || 'none'}`);

      if (response.status === 200) {
        const html = await response.text();
        const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        console.log(`Title: ${title ? title[1] : 'No title'}`);

        // Check if it contains manga-related content
        const hasManga = html.includes('manga') || html.includes('chapter');
        console.log(`Has manga content: ${hasManga}`);
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
}

checkMangakakalotDomain();
