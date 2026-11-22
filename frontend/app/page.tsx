"use client";

import React from "react";
import HeroSection from "@/components/home/HeroSection";
import LogoRevealSection from "@/components/home/LogoRevealSection";
import RocketLaunchSection from "@/components/home/RocketLaunchSection";
import DiscoverSection from "@/components/home/DiscoverSection";
import FinalDestinationSection from "@/components/home/FinalDestinationSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070716] text-slate-100 overflow-x-hidden selection:bg-purple-500 selection:text-white">
      {/* 1. HERO */}
      <HeroSection />

      {/* 2. LAUNCHBYTE LOGO REVEAL */}
      <LogoRevealSection />

      {/* 3. ROCKET LAUNCH */}
      <RocketLaunchSection />

      {/* 4. DISCOVER LAUNCHBYTE */}
      <DiscoverSection />

      {/* 5. FINAL DESTINATION */}
      <FinalDestinationSection />
    </div>
  );
}
