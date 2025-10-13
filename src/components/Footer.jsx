import React from 'react';
import { VisitorCounter } from './VisitorCounter';

export const Footer = () => {
    return (
        <footer className="bg-transparent text-center py-6 mt-12 border-t border-[var(--border-color)]">
            <div className="flex justify-center items-center mb-2">
                <VisitorCounter />
            </div>
            <p className="text-[var(--text-secondary)]">
                © {new Date().getFullYear()} NikzFlix. All Rights Reserved.
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
                This site does not store any files on our server, we only link to the media which is hosted on 3rd party services.
            </p>
        </footer>
    );
};