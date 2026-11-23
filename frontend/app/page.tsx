"use client";

import React from "react";
import HeroSection from "@/components/home/HeroSection";
import OrbitalBrandSection from "@/components/home/OrbitalBrandSection";
import CosmicExplorerSection from "@/components/home/CosmicExplorerSection";
import AboutLaunchByteSection from "@/components/home/AboutLaunchByteSection";
import ExploreCategoriesSection from "@/components/home/ExploreCategoriesSection";
import FeaturedOpportunitiesSection from "@/components/home/FeaturedOpportunitiesSection";
import CommunityNetworkSection from "@/components/home/CommunityNetworkSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FinalCtaSection from "@/components/home/FinalCtaSection";

export default function HomePage() {
  return (
    <div className="space-y-0 overflow-hidden bg-[#050510]">
      {/* 1. Cinematic Opening Hero Section (Preserved) */}
      <HeroSection />

      {/* 2. Orbital Brand Showcase Section with 3D Metallic Emblem (Preserved) */}
      <OrbitalBrandSection />

      {/* 3. Reference Astronaut On Alien Planet Looking into Cosmos (Clean & Cinematic) */}
      <CosmicExplorerSection />

      {/* 4. What is LaunchByte? Section */}
      <AboutLaunchByteSection />

      {/* 5. What You Can Explore Section (7 Distinct Domain Cards) */}
      <ExploreCategoriesSection />

      {/* 6. Featured Opportunities Section (Dynamic Real Data & Category Tabs) */}
      <FeaturedOpportunitiesSection />

      {/* 7. Community & Builder Network Section (Teammate Finder & Active Squads) */}
      <CommunityNetworkSection />

      {/* 8. How It Works (3-Step Journey: Discover → Participate → Grow) */}
      <HowItWorksSection />

      {/* 9. Final Call To Action (Cinematic Cosmic CTA) */}
      <FinalCtaSection />
    </div>
  );
}
