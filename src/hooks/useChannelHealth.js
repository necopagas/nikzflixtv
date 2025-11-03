// src/hooks/useChannelHealth.js
import { useState, useEffect, useCallback } from 'react';
import { 
    checkChannelHealth, 
    checkMultipleChannels, 
    getHealthWithCache,
    clearHealthCache 
} from '../utils/channelHealthCheck';

/**
 * Hook to check health of IPTV channels
 * @param {Array} channels - Array of channel objects
 * @param {boolean} autoCheck - Automatically check on mount
 * @returns {object} - Health map, checking status, and check function
 */
export const useChannelHealth = (channels = [], autoCheck = false) => {
    const [healthMap, setHealthMap] = useState(new Map());
    const [isChecking, setIsChecking] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [lastCheck, setLastCheck] = useState(null);

    /**
     * Check health of a single channel
     */
    const checkSingleChannel = useCallback(async (channel) => {
        const health = await getHealthWithCache(channel.url);
        setHealthMap(prev => new Map(prev).set(channel.url, health));
        return health;
    }, []);

    /**
     * Check health of all channels
     */
    const checkAllChannels = useCallback(async () => {
        if (channels.length === 0) return;
        
        setIsChecking(true);
        setProgress({ current: 0, total: channels.length });
        
        try {
            const batchSize = 5;
            const newHealthMap = new Map();
            
            for (let i = 0; i < channels.length; i += batchSize) {
                const batch = channels.slice(i, i + batchSize);
                
                const results = await Promise.all(
                    batch.map(async (channel) => {
                        const health = await getHealthWithCache(channel.url);
                        return { url: channel.url, health };
                    })
                );
                
                results.forEach(({ url, health }) => {
                    newHealthMap.set(url, health);
                });
                
                setProgress({ 
                    current: Math.min(i + batchSize, channels.length), 
                    total: channels.length 
                });
                
                // Small delay between batches
                if (i + batchSize < channels.length) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
            
            setHealthMap(newHealthMap);
            setLastCheck(new Date());
        } catch (error) {
            console.error('Health check error:', error);
        } finally {
            setIsChecking(false);
        }
    }, [channels]);

    /**
     * Clear all cached health data
     */
    const clearCache = useCallback(() => {
        clearHealthCache();
        setHealthMap(new Map());
        setLastCheck(null);
    }, []);

    /**
     * Get health stats
     */
    const getStats = useCallback(() => {
        let online = 0;
        let offline = 0;
        let timeout = 0;
        let unchecked = channels.length - healthMap.size;

        healthMap.forEach((health) => {
            if (health.isAlive) online++;
            else if (health.status === 'timeout') timeout++;
            else offline++;
        });

        return {
            total: channels.length,
            online,
            offline,
            timeout,
            unchecked,
            checked: healthMap.size,
            percentage: channels.length > 0 
                ? Math.round((online / channels.length) * 100) 
                : 0
        };
    }, [channels, healthMap]);

    // Auto-check on mount if enabled
    useEffect(() => {
        if (autoCheck && channels.length > 0 && healthMap.size === 0) {
            checkAllChannels();
        }
    }, [autoCheck, channels.length]); // Don't include healthMap.size to avoid loops

    return {
        healthMap,
        isChecking,
        progress,
        lastCheck,
        checkSingleChannel,
        checkAllChannels,
        clearCache,
        getStats: getStats(),
        getHealth: (url) => healthMap.get(url) || null
    };
};
