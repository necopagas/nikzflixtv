/* eslint-disable */
// src/maintenance.js (Run with node maintenance.js)
const fs = require('fs');
const https = require('https');

const channels = [ /* Copy IPTV_CHANNELS from config.js */ ];

channels.forEach((channel, index) => {
  https.get(channel.url, (res) => {
    if (res.statusCode !== 200) {
      console.log(`Dead: ${channel.name} - ${channel.url}`);
      // Remove or replace
    } else {
      console.log(`Working: ${channel.name}`);
    }
  }).on('error', () => {
    console.log(`Error: ${channel.name}`);
  });
});