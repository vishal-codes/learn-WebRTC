import React from "react";
import WebRTCLogo from "./ui/WebRTCLogo";
import GitHubLogo from "./ui/GitHubLogo";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-none rounded-full w-full py-4 px-4">
      <nav className="backdrop-blur container mx-auto  flex items-center justify-between h-16 rounded-full border shadow-xl border-gray-800 bg-gray-900/50">
        <div className="flex items-center ml-5">
          <WebRTCLogo className="h-8 w-8" />
        </div>
        <div className="hidden md:flex space-x-4">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://vishal-codes.github.io/"
            className="text-slate-400 hover:text-white transition-colors"
          >
            About Me
          </a>
        </div>
        <div className="flex items-center space-x-4">
          <button>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/vishal-codes/learn-WebRTC"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <GitHubLogo className="h-8 w-8" />
            </a>
          </button>
        </div>
      </nav>
    </header>
  );
}
