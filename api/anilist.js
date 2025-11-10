// Serverless function to proxy AniList GraphQL API for manga data
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, query: searchQuery, id, page = 1, perPage = 20 } = req.query;

    let graphqlQuery;
    let variables;

    // Build GraphQL query based on action
    switch (action) {
      case 'search':
        if (!searchQuery) {
          return res.status(400).json({ error: 'query parameter required for search' });
        }
        graphqlQuery = `
          query ($search: String, $page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
              media(search: $search, type: MANGA, sort: POPULARITY_DESC) {
                id
                title {
                  romaji
                  english
                }
                coverImage {
                  large
                }
                description
                status
                chapters
                volumes
                averageScore
                genres
                startDate {
                  year
                }
              }
            }
          }
        `;
        variables = { search: searchQuery, page: parseInt(page), perPage: parseInt(perPage) };
        break;

      case 'popular':
        graphqlQuery = `
          query ($page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
              media(type: MANGA, sort: TRENDING_DESC) {
                id
                title {
                  romaji
                  english
                }
                coverImage {
                  large
                }
                description
                status
                chapters
                volumes
                averageScore
                genres
                startDate {
                  year
                }
              }
            }
          }
        `;
        variables = { page: parseInt(page), perPage: parseInt(perPage) };
        break;

      case 'info':
        if (!id) {
          return res.status(400).json({ error: 'id parameter required for info' });
        }
        graphqlQuery = `
          query ($id: Int) {
            Media(id: $id, type: MANGA) {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
                extraLarge
              }
              description
              status
              chapters
              volumes
              averageScore
              genres
              startDate {
                year
              }
              staff {
                edges {
                  node {
                    name {
                      full
                    }
                  }
                  role
                }
              }
            }
          }
        `;
        variables = { id: parseInt(id) };
        break;

      default:
        return res.status(400).json({ error: 'Invalid action. Use: search, popular, or info' });
    }

    console.log('Fetching from AniList:', action);

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: variables,
      }),
    });

    if (!response.ok) {
      console.error('AniList API error:', response.status, response.statusText);
      return res.status(response.status).json({
        error: 'AniList API request failed',
        status: response.status,
      });
    }

    const data = await response.json();

    // Cache for 10 minutes
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Failed to fetch from AniList API',
      message: error.message,
    });
  }
}
