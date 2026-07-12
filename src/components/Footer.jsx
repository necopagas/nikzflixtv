import React from 'react';
import { VisitorCounter } from './VisitorCounter';
import { FaGithub, FaTwitter, FaEnvelope } from 'react-icons/fa';

export const Footer = () => {
  return (
    <footer className="relative z-20 mt-8 border-t border-(--border-color) bg-[#0b0b0b] px-4 py-8 text-center sm:mt-10 sm:px-8 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center">
        <div className="mb-2 flex items-center justify-center">
          <VisitorCounter />
        </div>
        {/* Live Traffic Feed Counter */}
        <div className="mb-4 flex items-center justify-center">
          <noscript id="LTF_live_website_visitor">
            <a href="http://livetrafficfeed.com">Website Online Counter</a>
          </noscript>
        </div>
        <div className="mb-2 flex items-center justify-center gap-4">
          <a
            href="https://github.com/necopagas"
            target="_blank"
            rel="noreferrer"
            className="text-(--text-secondary) hover:text-white"
          >
            <FaGithub />
          </a>
          <a href="#" className="text-(--text-secondary) hover:text-white">
            <FaTwitter />
          </a>
          <a href="mailto:info@nikzflix.local" className="text-(--text-secondary) hover:text-white">
            <FaEnvelope />
          </a>
        </div>
        <p className="text-(--text-secondary)">
          © {new Date().getFullYear()} NikzFlix. All Rights Reserved.
        </p>
        <p className="mt-2 text-xs text-(--text-secondary)">
          This site does not store any files on our server, we only link to the media which is
          hosted on 3rd party services.
        </p>
        <p className="mt-2 text-xs text-(--text-secondary)">
          Data & images provided by{' '}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            TMDB
          </a>
          . This site uses TMDB's API in accordance with their terms.
        </p>
      </div>
    </footer>
  );
};
