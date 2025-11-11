// Inspect a specific manga page on Mangapill
async function inspectMangapillMangaPage() {
  try {
    console.log('Fetching a specific manga page...');
    const response = await fetch('https://mangapill.com/manga/2/one-piece', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    console.log('Response status:', response.status);
    console.log('HTML length:', html.length);

    // Look for title
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    console.log('Title found:', titleMatch ? titleMatch[1] : 'No title');

    // Look for description
    const descMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    console.log(
      'Description found:',
      descMatch ? descMatch[1].substring(0, 100) + '...' : 'No description'
    );

    // Look for cover image
    const coverMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*class="[^"]*cover[^"]*"/);
    console.log('Cover found:', coverMatch ? coverMatch[1] : 'No cover');

    // Look for chapters
    const chapterLinks = html.match(/href="\/chapters\/[^"]+"/g);
    console.log('Chapter links found:', chapterLinks ? chapterLinks.length : 0);
    if (chapterLinks && chapterLinks.length > 0) {
      console.log('Sample chapter links:', chapterLinks.slice(0, 3));
    }

    // Look for all images
    const images = html.match(/<img[^>]*src="[^"]*"/g);
    console.log('Total images:', images ? images.length : 0);
    if (images && images.length > 0) {
      console.log('Sample images:', images.slice(0, 3));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectMangapillMangaPage();
