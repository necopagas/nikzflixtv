// Check Mangapill /mangas/new page
async function inspectMangapillNew() {
  try {
    console.log('Fetching Mangapill /mangas/new...');
    const response = await fetch('https://mangapill.com/mangas/new', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    console.log('Response status:', response.status);
    console.log('HTML length:', html.length);

    // Test the regex on this page
    const mangaRegex =
      /<a[^>]*href="\/manga\/([^/]+)\/([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g;

    const matches = html.match(mangaRegex);
    console.log('Regex matches:', matches ? matches.length : 0);

    if (matches && matches.length > 0) {
      // Test parsing the first match
      const match = mangaRegex.exec(html);
      if (match) {
        console.log('Sample parsed result:', {
          id: `${match[1]}/${match[2]}`,
          title: match[4].trim(),
          coverImage: match[3],
        });
      }
    } else {
      console.log('No matches with current regex. Let me check the HTML structure...');

      // Look for manga links
      const mangaLinks = html.match(/href="\/manga\/[^"]+"/g);
      console.log('Manga links found:', mangaLinks ? mangaLinks.length : 0);
      if (mangaLinks && mangaLinks.length > 0) {
        console.log('Sample links:', mangaLinks.slice(0, 3));
      }

      // Look for image tags
      const images = html.match(/<img[^>]*src="[^"]*"[^>]*alt="[^"]*"/g);
      console.log('Images with alt found:', images ? images.length : 0);
      if (images && images.length > 0) {
        console.log('Sample image:', images[0]);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectMangapillNew();
