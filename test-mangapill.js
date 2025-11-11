// Test script to check Mangapill API
async function testMangapillAPI() {
  try {
    console.log('Testing Mangapill popular endpoint...');

    // Simulate the API call
    const response = await fetch('https://mangapill.com/browse?sort=popular', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    console.log('Response status:', response.status);
    console.log('HTML length:', html.length);

    // Test the regex
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
      console.log('No matches found. Let me check for other patterns...');

      // Check for alternative patterns
      const altRegex = /href="\/manga\/[^"]+"/g;
      const altMatches = html.match(altRegex);
      console.log('Alternative pattern matches:', altMatches ? altMatches.length : 0);
      if (altMatches && altMatches.length > 0) {
        console.log('Sample alt matches:', altMatches.slice(0, 3));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testMangapillAPI();
