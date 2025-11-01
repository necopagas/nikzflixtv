/*
  scripts/maintenance.js
  Node-only maintenance script moved outside `src` to avoid browser linting.
  Run via: node scripts/maintenance.js
*/
const fs = require('fs');
const https = require('https');

const channels = [ /* Copy IPTV_CHANNELS from config.js or provide list here */ ];

channels.forEach((channel) => {
  https.get(channel.url, (res) => {
    if (res.statusCode !== 200) {
      console.log(`Dead: ${channel.name} - ${channel.url}`);
    } else {
      console.log(`Working: ${channel.name}`);
    }
  }).on('error', () => {
    console.log(`Error: ${channel.name}`);
  });
});
