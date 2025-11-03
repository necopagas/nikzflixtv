// src/components/InlineAd.jsx
import React from 'react';

/**
 * Multi-purpose Inline Ad Component
 * Supports: Adsterra, PropellerAds, Google AdSense
 */
export const InlineAd = ({ type = 'adsterra', position = 'center' }) => {
    // Adsterra Inline Banner Code
    const adsterraInlineCode = `
        <script type="text/javascript">
            atOptions = {
                'key' : 'YOUR_ADSTERRA_KEY_HERE',
                'format' : 'iframe',
                'height' : 250,
                'width' : 300,
                'params' : {}
            };
            document.write('<scr' + 'ipt type="text/javascript" src="//www.topcreativeformat.com/' + atOptions.key + '/invoke.js"></scr' + 'ipt>');
        </script>
    `;

    const positionClass = {
        'left': 'mr-auto',
        'center': 'mx-auto',
        'right': 'ml-auto'
    };

    return (
        <div className={`inline-ad-wrapper my-8 ${positionClass[position]} max-w-[300px]`}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                <div className="text-[10px] text-gray-500 text-center mb-2">Advertisement</div>
                
                {type === 'adsterra' && (
                    <div className="min-h-[250px] flex items-center justify-center bg-gray-800/30 rounded">
                        {/* Adsterra code will go here */}
                        <div className="text-center p-4">
                            <div className="text-xs text-gray-400 mb-2">📺 Ad Space</div>
                            <div className="text-[10px] text-gray-600">
                                Replace with Adsterra inline code
                            </div>
                        </div>
                    </div>
                )}

                {type === 'placeholder' && (
                    <div className="h-[250px] flex items-center justify-center bg-gradient-to-br from-red-900/20 to-purple-900/20 rounded border border-red-500/20">
                        <div className="text-center p-4">
                            <div className="text-4xl mb-2">💰</div>
                            <div className="text-sm text-gray-300 font-semibold mb-1">Ad Space Available</div>
                            <div className="text-xs text-gray-500">300 x 250</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Usage Examples:
 * 
 * <InlineAd type="adsterra" position="center" />
 * <InlineAd type="placeholder" position="left" />
 */
