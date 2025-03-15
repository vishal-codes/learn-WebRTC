import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import dynamic from "next/dynamic";

const Playground = dynamic(() => import("../components/Playground"), {
  ssr: false,
});

export default function Component() {
  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans">
      <SiteHeader />
      <main className="relative z-10 -mt-[104px]">
        <HeroSection />
        <div className="mx-2 md:mx-10 " id="playground-section">
          <Playground />
        </div>
      </main>
    </div>
  );
}
