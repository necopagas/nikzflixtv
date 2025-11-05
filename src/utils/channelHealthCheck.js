// src/utils/channelHealthCheck.js
// Channel health checker - detects dead/working streams

/**
 * Check if a channel is alive by attempting to fetch headers
 * @param {string} url - Channel URL
 * @param {number} timeout - Timeout in milliseconds (default 5000ms)
 * @returns {Promise<object>} - { isAlive, latency, error }
 */
export const checkChannelHealth = async (url, timeout = 5000) => {
    const startTime = performance.now();
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        await fetch(url, {
            method: 'HEAD', // Only get headers, not the full stream
            signal: controller.signal,
            mode: 'no-cors', // Bypass CORS for health check
        });
        
        clearTimeout(timeoutId);
        const latency = Math.round(performance.now() - startTime);
        
        // In no-cors mode, we can't check status, but if it loads, it's alive
        return {
            isAlive: true,
            latency,
            error: null,
            status: 'online'
        };
    } catch (error) {
        const latency = Math.round(performance.now() - startTime);
        
        // Timeout or network error
        if (error.name === 'AbortError') {
            return {
                isAlive: false,
                latency,
                error: 'Timeout',
                status: 'timeout'
            };
        }
        
        return {
            isAlive: false,
            latency,
            error: error.message,
            status: 'offline'
        };
    }
};

/**
 * Check multiple channels in parallel
 * @param {Array} channels - Array of channel objects
 * @param {number} batchSize - How many to check simultaneously (default 5)
 * @returns {Promise<Map>} - Map of channel URL -> health status
 */
export const checkMultipleChannels = async (channels, batchSize = 5) => {
    const healthMap = new Map();
    
    // Process in batches to avoid overwhelming the network
    for (let i = 0; i < channels.length; i += batchSize) {
        const batch = channels.slice(i, i + batchSize);
        
        const results = await Promise.all(
            batch.map(async (channel) => {
                const health = await checkChannelHealth(channel.url, 3000);
                return { url: channel.url, health };
            })
        );
        
        results.forEach(({ url, health }) => {
            healthMap.set(url, health);
        });
        
        // Small delay between batches
        if (i + batchSize < channels.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    return healthMap;
};

/**
 * Get cached health status from localStorage
 * @param {string} url - Channel URL
 * @returns {object|null} - Cached health status or null
 */
export const getCachedHealth = (url) => {
    try {
        const cached = localStorage.getItem(`channel_health_${btoa(url)}`);
        if (!cached) return null;
        
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        
        // Cache expires after 5 minutes
        if (age > 5 * 60 * 1000) {
            localStorage.removeItem(`channel_health_${btoa(url)}`);
            return null;
        }
        
        return data.health;
    } catch {
        return null;
    }
};

/**
 * Cache health status in localStorage
 * @param {string} url - Channel URL
 * @param {object} health - Health status object
 */
export const cacheHealth = (url, health) => {
    try {
        const data = {
            health,
            timestamp: Date.now()
        };
        localStorage.setItem(`channel_health_${btoa(url)}`, JSON.stringify(data));
    } catch (error) {
        console.warn('Failed to cache health status:', error);
    }
};

/**
 * Get health status with cache
 * @param {string} url - Channel URL
 * @returns {Promise<object>} - Health status
 */
export const getHealthWithCache = async (url) => {
    // Check cache first
    const cached = getCachedHealth(url);
    if (cached) {
        return { ...cached, fromCache: true };
    }
    
    // Perform live check
    const health = await checkChannelHealth(url);
    cacheHealth(url, health);
    
    return { ...health, fromCache: false };
};

/**
 * Clear all cached health data
 */
export const clearHealthCache = () => {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('channel_health_')) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.warn('Failed to clear health cache:', error);
    }
};
