// Inspect Mangafox homepage manga links
async function inspectMangafoxHomeManga() {
  try {
    console.log('Fetching Mangafox homepage...');
    const response = await fetch('https://mangafox.fun/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();

    // Look for manga links that look like actual manga pages
    const mangaPageLinks = html.match(/href="\/manga\/[^"]+"/g);
    console.log('Manga page links found:', mangaPageLinks ? mangaPageLinks.length : 0);
    if (mangaPageLinks && mangaPageLinks.length > 0) {
      console.log('Sample manga page links:', mangaPageLinks.slice(0, 5));
    }

    // Look for the structure around manga listings
    const mangaSections = html.match(/<div[^>]*class="[^"]*manga[^"]*"[^>]*>[\s\S]*?<\/div>/g);
    console.log('Manga sections found:', mangaSections ? mangaSections.length : 0);
    if (mangaSections && mangaSections.length > 0) {
      console.log('First manga section (truncated):', mangaSections[0].substring(0, 300) + '...');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectMangafoxHomeManga();
