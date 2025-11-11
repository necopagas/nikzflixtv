// Test script to check alternative manga sites
async function checkAlternativeSites() {
  const sites = [
    { name: 'Mangakakalots', url: 'https://mangakakalots.com' },
    { name: 'Mangasee123', url: 'https://mangasee123.com' },
    { name: 'Mangapill', url: 'https://mangapill.com' },
    { name: 'Mangaread', url: 'https://mangaread.org' },
    { name: 'Mangahere', url: 'https://mangahere.cc' },
    { name: 'Mangafox', url: 'https://mangafox.fun' },
  ];

  for (const site of sites) {
    try {
      console.log(`\nChecking ${site.name} (${site.url})...`);
      const response = await fetch(site.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        redirect: 'manual',
      });

      console.log(`Status: ${response.status}`);
      console.log(`Redirect: ${response.headers.get('location') || 'none'}`);

      if (response.status === 200) {
        const html = await response.text();
        const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        console.log(`Title: ${title ? title[1].trim() : 'No title'}`);

        // Check if it contains manga-related content
        const hasManga = /manga|chapter|read/i.test(html);
        console.log(`Has manga content: ${hasManga}`);

        // Check for common manga site patterns
        const hasMangaList = /manga_list|popular|latest/i.test(html);
        console.log(`Has manga list: ${hasMangaList}`);
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
}

checkAlternativeSites();
