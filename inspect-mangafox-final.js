// Inspect Mangafox structure
async function inspectMangafoxStructure() {
  try {
    console.log('Fetching Mangafox...');
    const response = await fetch('https://mangafox.fun/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    console.log('HTML length:', html.length);

    // Look for manga links
    const mangaLinks = html.match(/href="[^"]*manga[^"]*"/g);
    console.log('Manga links found:', mangaLinks ? mangaLinks.length : 0);
    if (mangaLinks && mangaLinks.length > 0) {
      console.log('Sample links:', mangaLinks.slice(0, 5));
    }

    // Look for images
    const images = html.match(/<img[^>]*src="[^"]*"/g);
    console.log('Images found:', images ? images.length : 0);
    if (images && images.length > 0) {
      console.log('Sample images:', images.slice(0, 3));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectMangafoxStructure();
