// Check Mangapill homepage structure
async function inspectMangapillHome() {
  try {
    console.log('Fetching Mangapill homepage...');
    const response = await fetch('https://mangapill.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    console.log('Response status:', response.status);
    console.log('HTML length:', html.length);

    // Look for browse/popular links
    const browseLinks = html.match(/href="[^"]*browse[^"]*"/g);
    console.log('Browse links found:', browseLinks ? browseLinks.length : 0);
    if (browseLinks) {
      console.log('Browse links:', browseLinks.slice(0, 3));
    }

    // Look for popular links
    const popularLinks = html.match(/href="[^"]*popular[^"]*"/g);
    console.log('Popular links found:', popularLinks ? popularLinks.length : 0);
    if (popularLinks) {
      console.log('Popular links:', popularLinks.slice(0, 3));
    }

    // Look for any manga listing links
    const listingLinks = html.match(/href="\/[^"]*"/g);
    const uniqueLinks = [...new Set(listingLinks)].filter(
      link => link.includes('manga') || link.includes('browse') || link.includes('popular')
    );
    console.log('Unique listing links:', uniqueLinks.slice(0, 10));
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectMangapillHome();
