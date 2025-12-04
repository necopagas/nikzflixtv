// src/hooks/useIPTVSync.js
import { useState, useEffect } from 'react';
import { fetchExternalIPTV, mergeIPTVChannels, checkIPTVUpdates } from '../utils/iptvSync';
import { IPTV_CHANNELS } from '../config';

/**
 * Hook to auto-sync IPTV channels
 * @param {boolean} enableAutoSync - Enable automatic syncing on mount
 * @returns {object} - Channels, sync status, and manual sync function
 */
export const useIPTVSync = (enableAutoSync = true) => {
    const [channels, setChannels] = useState(IPTV_CHANNELS);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
    const [updates, setUpdates] = useState([]);

    const syncChannels = async () => {
        setIsSyncing(true);
        setSyncStatus('syncing');

        try {
            console.log('🔄 Syncing IPTV channels from external source...');
            
            const externalChannels = await fetchExternalIPTV();
            
            if (externalChannels) {
                // Check for updates
                const updateInfo = checkIPTVUpdates(IPTV_CHANNELS, externalChannels);
                setUpdates(updateInfo.updates);
                
                if (updateInfo.hasUpdates) {
                    console.log(`⚠️ Found ${updateInfo.count} channel URL updates`);
                }
                
                // Merge channels
                const merged = mergeIPTVChannels(IPTV_CHANNELS, externalChannels);
                setChannels(merged);
                
                setLastSync(new Date());
                setSyncStatus('success');
                
                console.log(`✅ IPTV sync complete! Total channels: ${merged.length}`);
                
                return {
                    success: true,
                    totalChannels: merged.length,
                    newChannels: merged.length - IPTV_CHANNELS.length,
                    updates: updateInfo.updates
                };
            } else {
                // Use local channels as fallback
                setChannels(IPTV_CHANNELS);
                setSyncStatus('error');
                console.warn('⚠️ Using local IPTV channels (external fetch failed)');
                
                return {
                    success: false,
                    totalChannels: IPTV_CHANNELS.length,
                    newChannels: 0,
                    updates: []
                };
            }
        } catch (error) {
            console.error('❌ IPTV sync error:', error);
            setChannels(IPTV_CHANNELS);
            setSyncStatus('error');
            
            return {
                success: false,
                error: error.message,
                totalChannels: IPTV_CHANNELS.length,
                newChannels: 0,
                updates: []
            };
        } finally {
            setIsSyncing(false);
        }
    };

    // Auto-sync on mount
    useEffect(() => {
        if (enableAutoSync) {
            // Check if we synced recently (within last hour)
            const lastSyncTime = localStorage.getItem('iptv_last_sync');
            const oneHour = 60 * 60 * 1000;
            
            if (!lastSyncTime || Date.now() - parseInt(lastSyncTime) > oneHour) {
                syncChannels().then(() => {
                    localStorage.setItem('iptv_last_sync', Date.now().toString());
                });
            } else {
                console.log('⏭️ IPTV sync skipped (synced recently)');
                setChannels(IPTV_CHANNELS);
            }
        } else {
            setChannels(IPTV_CHANNELS);
        }
    }, [enableAutoSync]);

    return {
        channels,
        isSyncing,
        lastSync,
        syncStatus,
        updates,
        syncChannels, // Manual sync function
        hasUpdates: updates.length > 0
    };
};
