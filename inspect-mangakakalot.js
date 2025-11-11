// Test script to inspect Mangakakalot HTML structure
async function inspectMangakakalot() {
  try {
    console.log('Fetching Mangakakalot HTML...');
    const response = await fetch(
      'https://mangakakalot.com/manga_list?type=topview&category=all&state=all&page=1',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );

    const html = await response.text();
    console.log('Response status:', response.status);
    console.log('HTML length:', html.length);

    // Look for common patterns
    const patterns = [
      /class="[^"]*story[^"]*"/g,
      /class="[^"]*manga[^"]*"/g,
      /class="[^"]*item[^"]*"/g,
      /class="[^"]*list[^"]*"/g,
      /<div[^>]*>[\s\S]*?<a[^>]*href="\/manga\//g,
    ];

    patterns.forEach((pattern, i) => {
      const matches = html.match(pattern);
      console.log(`Pattern ${i + 1} matches:`, matches ? matches.length : 0);
      if (matches && matches.length > 0) {
        console.log(`  Sample: ${matches[0].substring(0, 100)}...`);
      }
    });

    // Look for manga links
    const mangaLinks = html.match(/href="\/manga\/[^"]+"/g);
    console.log('Manga links found:', mangaLinks ? mangaLinks.length : 0);
    if (mangaLinks && mangaLinks.length > 0) {
      console.log('Sample links:', mangaLinks.slice(0, 3));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectMangakakalot();
