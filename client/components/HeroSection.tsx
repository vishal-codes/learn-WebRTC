"use client";
import React from "react";
import BackgroundBeamsWithCollision from "@/components/ui/BackgroundBeamsWithCollision";

export default function HeroSection() {
  const scrollToPlayground = () => {
    const nextSection = document.getElementById("playground-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <BackgroundBeamsWithCollision>
      <div className="flex flex-col justify-center gap-4">
        <h2 className="text-4xl relative w-[80%] mx-auto z-20 md:text-4xl lg:text-7xl font-bold text-center text-white font-sans tracking-tight">
          Learn everything about{" "}
          <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
            <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-blue-600 via-emerald-500 to-red-500 py-0">
              <span className="">WebRTC.</span>
            </div>
          </div>
        </h2>
        <p className="text-center">No sign in required</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 w-[60%] mx-auto py-2">
          <button
            onClick={scrollToPlayground}
            className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-[#3375E0] focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3375E0_0%,#6BBA4F_25%,#E44D2E_50%,#F8C73D_75%,#3375E0_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-900 px-16 py-5 text-sm font-medium text-white backdrop-blur-3xl hover:bg-slate-800 transition-colors">
              Playground
            </span>
          </button>
          <button
            className="inline-flex h-12 animate-shimmer items-center justify-center rounded-full border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-16 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
          >
             <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://chinuwrites.hashnode.dev/series/learn-webrtc"
              className="no-underline"
            >
            Read Blog
               </a>
          </button>
        </div>
      </div>
    </BackgroundBeamsWithCollision>
  );
}
