// Test the Mangapill parsing functions
async function testMangapillParsing() {
  try {
    console.log('Fetching Mangapill data...');
    const response = await fetch('https://mangapill.com/mangas/new', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    console.log('HTML length:', html.length);

    // Test the parsing function
    const results = parsePopularResultsMangapill(html);
    console.log('Parsed results:', results.length);
    if (results.length > 0) {
      console.log('First result:', results[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Copy the parsing function
function parsePopularResultsMangapill(html) {
  const results = [];
  // Look for manga cards on browse page
  const mangaRegex =
    /<a[^>]*href="\/manga\/([^/]+)\/([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g;

  let match;
  while ((match = mangaRegex.exec(html)) !== null) {
    results.push({
      id: `${match[1]}/${match[2]}`,
      title: match[4].trim(),
      coverImage: match[3],
    });
  }

  return results.slice(0, 20);
}

testMangapillParsing();
