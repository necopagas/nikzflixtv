// Inspect Mangafox manga structure
async function inspectMangafoxManga() {
  try {
    console.log('Fetching Mangafox manga page...');
    const response = await fetch('https://mangafox.fun/manga/i-became-the-hero-s-mom', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    console.log('Response status:', response.status);
    console.log('HTML length:', html.length);

    // Look for title
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    console.log('Title found:', titleMatch ? titleMatch[1] : 'No title');

    // Look for cover
    const coverMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*alt="[^"]*cover[^"]*"/i);
    console.log('Cover found:', coverMatch ? coverMatch[1] : 'No cover');

    // Look for chapters
    const chapterLinks = html.match(/href="[^"]*chapter[^"]*"/g);
    console.log('Chapter links found:', chapterLinks ? chapterLinks.length : 0);
    if (chapterLinks && chapterLinks.length > 0) {
      console.log('Sample chapter links:', chapterLinks.slice(0, 3));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectMangafoxManga();
