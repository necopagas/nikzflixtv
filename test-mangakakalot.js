// Test script to check Mangakakalot scraping
async function testMangakakalot() {
  try {
    console.log('Testing Mangakakalot popular...');
    const response = await fetch(
      'https://mangakakalot.com/manga_list?type=topview&category=all&state=all&page=1',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );

    const html = await response.text();
    console.log('Response status:', response.status);
    console.log('HTML length:', html.length);

    // Check if we got the expected content
    if (html.includes('story_item')) {
      console.log('✓ Found story_item elements');
    } else {
      console.log('✗ No story_item elements found');
    }

    // Try the regex from the code
    const regex =
      /<div class="story_item">[\s\S]*?<a href="\/manga\/([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<\/div>/g;
    const matches = html.match(regex);
    console.log('Regex matches:', matches ? matches.length : 0);

    if (matches && matches.length > 0) {
      console.log('First match:', matches[0].substring(0, 200) + '...');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testMangakakalot();
