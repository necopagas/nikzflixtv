// Check the redirected Mangaread URL
async function checkMangareadRedirected() {
  try {
    console.log('Checking redirected Mangaread...');
    const response = await fetch('https://www.mangaread.org/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    console.log('Status:', response.status);

    if (response.status === 200) {
      const html = await response.text();
      console.log('HTML length:', html.length);

      const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      console.log('Title:', title ? title[1] : 'No title');

      const mangaLinks = html.match(/href="\/manga\/[^"]+"/g);
      console.log('Manga links found:', mangaLinks ? mangaLinks.length : 0);

      if (mangaLinks && mangaLinks.length > 0) {
        console.log('Sample links:', mangaLinks.slice(0, 3));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMangareadRedirected();
