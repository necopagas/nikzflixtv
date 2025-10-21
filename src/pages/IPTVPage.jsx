import React, { useState, useMemo } from 'react';
import { IPTV_CHANNELS } from '../config';
import { IPTVPlayer } from '../components/IPTVPlayer';

export const IPTVPage = () => {
    const [selectedChannel, setSelectedChannel] = useState(IPTV_CHANNELS[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const handleChannelSelect = (channel) => {
        setIsLoading(true);
        setSelectedChannel(channel);
    };

    const filteredChannels = useMemo(() => {
        if (!searchQuery) {
            return IPTV_CHANNELS;
        }
        return IPTV_CHANNELS.filter(channel =>
            channel.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    // --- GIDUGANG NGA HANDLER PARA SA KEYBOARD ---
    const handleKeyDown = (e, channel) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleChannelSelect(channel);
        }
    };

    return (
        <div className="iptv-page-container px-4 sm:px-8 md:px-16 pt-28 pb-20">
            <h1 className="text-3xl font-bold mb-8">Live TV Channels</h1>
            <div className="iptv-layout">
                <div className="iptv-player-section">
                    <div className="player-header">
                        <h2 className="now-playing-title">Now Playing</h2>
                        <p className="now-playing-channel">{selectedChannel.name}</p>
                    </div>
                    <IPTVPlayer
                        key={selectedChannel.url} // Add key to force re-mount on URL change
                        url={selectedChannel.url}
                        isLoading={isLoading}
                        onCanPlay={() => setIsLoading(false)}
                    />
                </div>
                <div className="iptv-channel-list-wrapper">
                     <div className="channel-search-container">
                        <i className="fas fa-search search-icon"></i>
                        <input
                            type="text"
                            placeholder="Search for a channel..."
                            className="channel-search-bar"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="iptv-channel-list">
                        {/* --- GI-USAB GIKAN SA <ul> PADULONG SA <div> --- */}
                        <div role="list">
                            {filteredChannels.length > 0 ? (
                                filteredChannels.map(channel => (
                                    /* --- GI-USAB GIKAN SA <li> PADULONG SA <button> PARA SA ACCESSIBILITY --- */
                                    <button
                                        key={channel.name}
                                        className={`channel-item ${selectedChannel.name === channel.name ? 'active' : ''}`}
                                        onClick={() => handleChannelSelect(channel)}
                                        onKeyDown={(e) => handleKeyDown(e, channel)} // Dili strikto nga kinahanglanon kay <button> na, pero good practice
                                        role="listitem"
                                    >
                                        {channel.name}
                                    </button>
                                ))
                            ) : (
                                <p className="no-results">No channels found.</p> // Gi-usab gikan sa <li>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};