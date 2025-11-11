// Test script to inspect Mangafox HTML structure
async function inspectMangafox() {
  try {
    console.log('Fetching Mangafox HTML...');
    const response = await fetch('https://mangafox.fun/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    console.log('Response status:', response.status);
    console.log('HTML length:', html.length);

    // Look for manga-related content
    const mangaKeywords = ['manga', 'chapter', 'read', 'popular'];
    mangaKeywords.forEach(keyword => {
      const count = (html.match(new RegExp(keyword, 'gi')) || []).length;
      console.log(`${keyword}: ${count} occurrences`);
    });

    // Look for common patterns
    const patterns = [
      /class="[^"]*manga[^"]*"/g,
      /class="[^"]*chapter[^"]*"/g,
      /class="[^"]*card[^"]*"/g,
      /class="[^"]*item[^"]*"/g,
      /href="\/manga\//g,
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

inspectMangafox();
