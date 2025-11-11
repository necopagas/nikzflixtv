# Vercel Deployment Setup for WeebCentral Scraping

## Environment Variables

To enable WeebCentral scraping in Vercel (serverless environment), you need to set up API keys for scraping services that can bypass Cloudflare protection.

### Required Environment Variables

Add these to your Vercel project settings under "Environment Variables":

#### ScrapingAnt (Recommended)

```
SCRAPINGANT_API_KEY=your_scrapingant_api_key_here
```

#### Bright Data (Alternative)

```
BRIGHT_DATA_API_KEY=your_bright_data_api_key_here
```

### Getting API Keys

#### ScrapingAnt

1. Sign up at [ScrapingAnt](https://scrapingant.com/)
2. Get your API key from the dashboard
3. Add it to Vercel environment variables

#### Bright Data

1. Sign up at [Bright Data](https://brightdata.com/)
2. Create a scraping browser zone
3. Get your API key
4. Add it to Vercel environment variables

### How It Works

The API handler (`api/weebcentral.js`) automatically detects the Vercel environment and:

1. **Development**: Uses local proxy server (if running)
2. **Production**: Uses scraping services to bypass Cloudflare
3. **Fallback**: If all methods fail, returns helpful error with alternative sources

### Testing

After deployment, test the WeebCentral functionality:

```bash
# Test popular manga
curl "https://your-app.vercel.app/api/weebcentral?action=popular"

# Test search
curl "https://your-app.vercel.app/api/weebcentral?action=search&query=naruto"
```

### Cost Considerations

- **ScrapingAnt**: Pay per request (~$2-5 per 1000 requests)
- **Bright Data**: Pay per GB of data scraped
- **Free Tier**: Limited requests available for testing

### Troubleshooting

If scraping fails:

1. Check API key configuration in Vercel
2. Verify API keys are valid and have credits
3. Check Vercel function logs for detailed errors
4. Consider switching to alternative scraping service

### Alternative Sources

If WeebCentral scraping remains problematic, users can switch to:

- Mangakakalot
- Manganelo
- MangaPanda

These sources work reliably without Cloudflare protection.
