// Test script to inspect Mangakakalot HTML content
async function inspectMangakakalotContent() {
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

    // Look for manga-related content
    const mangaKeywords = ['manga', 'chapter', 'read', 'story'];
    mangaKeywords.forEach(keyword => {
      const count = (html.match(new RegExp(keyword, 'gi')) || []).length;
      console.log(`${keyword}: ${count} occurrences`);
    });

    // Check for common HTML structures
    const divs = html.match(/<div[^>]*>/g);
    console.log('Total div elements:', divs ? divs.length : 0);

    // Look for links
    const links = html.match(/<a[^>]*href="[^"]*"[^>]*>/g);
    console.log('Total links:', links ? links.length : 0);

    // Show a sample of the HTML content
    const start = html.indexOf('<body');
    const end = html.indexOf('</body>') + 7;
    const bodyContent = html.substring(start, Math.min(start + 1000, end));
    console.log('\nBody content sample:');
    console.log(bodyContent);
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectMangakakalotContent();
