import React from 'react';
import { VisitorCounter } from './VisitorCounter';
import { FaGithub, FaTwitter, FaEnvelope } from 'react-icons/fa';

export const Footer = () => {
    return (
        <footer className="bg-transparent text-center py-6 mt-12 border-t border-[var(--border-color)]">
            <div className="flex justify-center items-center mb-2">
                <VisitorCounter />
            </div>
            {/* Live Traffic Feed Counter */}
            <div className="flex justify-center items-center mb-4">
                <noscript id="LTF_live_website_visitor">
                    <a href="http://livetrafficfeed.com">Website Online Counter</a>
                </noscript>
            </div>
            <div className="flex items-center justify-center gap-4 mb-2">
                <a href="https://github.com/necopagas" target="_blank" rel="noreferrer" className="text-[var(--text-secondary)] hover:text-white">
                    <FaGithub />
                </a>
                <a href="#" className="text-[var(--text-secondary)] hover:text-white">
                    <FaTwitter />
                </a>
                <a href="mailto:info@nikzflix.local" className="text-[var(--text-secondary)] hover:text-white">
                    <FaEnvelope />
                </a>
            </div>
            <p className="text-[var(--text-secondary)]">
                © {new Date().getFullYear()} NikzFlix. All Rights Reserved.
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
                This site does not store any files on our server, we only link to the media which is hosted on 3rd party services.
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
                Data & images provided by <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="underline">TMDB</a>. This site uses TMDB's API in accordance with their terms.
            </p>
        </footer>
    );
};