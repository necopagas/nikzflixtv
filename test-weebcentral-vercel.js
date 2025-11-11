// Test script for Vercel-compatible WeebCentral scraping
// Run with: node test-weebcentral-vercel.js

import handler from './api/weebcentral.js';

// Mock request/response objects
const mockReq = {
  query: {
    action: 'popular',
  },
};

const mockRes = {
  status: code => ({
    json: data => {
      console.log(`Response ${code}:`, JSON.stringify(data, null, 2));
      return mockRes;
    },
  }),
};

// Test the handler
console.log('Testing Vercel-compatible WeebCentral handler...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL: process.env.VERCEL,
});

try {
  await handler(mockReq, mockRes);
} catch (error) {
  console.error('Test failed:', error.message);
}
