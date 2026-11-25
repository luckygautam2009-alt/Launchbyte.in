"use client";

import React from "react";
import HeroSection from "@/components/home/HeroSection";
import OrbitalBrandSection from "@/components/home/OrbitalBrandSection";
import AstronautJourney from "@/components/home/AstronautJourney";
import CosmicExplorerSection from "@/components/home/CosmicExplorerSection";
import AboutLaunchByteSection from "@/components/home/AboutLaunchByteSection";
import ExploreCategoriesSection from "@/components/home/ExploreCategoriesSection";
import MarqueeStrip from "@/components/home/MarqueeStrip";
import FeaturedOpportunitiesSection from "@/components/home/FeaturedOpportunitiesSection";
import CommunityNetworkSection from "@/components/home/CommunityNetworkSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import MissionVisionSection from "@/components/home/MissionVisionSection";
import PartnersLogoRow from "@/components/home/PartnersLogoRow";
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
import CoreTeamSection from "@/components/home/CoreTeamSection";
import PartnerContactSection from "@/components/home/PartnerContactSection";
import FinalCtaSection from "@/components/home/FinalCtaSection";
import FaqAccordionSection from "@/components/home/FaqAccordionSection";

export default function HomePage() {
  return (
    <div className="space-y-0 bg-transparent">
      {/* 1. Cinematic Opening Hero Section */}
      <HeroSection />

      {/* 2. Orbital Brand Showcase Section with 3D Metallic Emblem */}
      <OrbitalBrandSection />

      <AstronautJourney>
        {/* 3. Discover / Single Ringed Planet Experience */}
        <div id="stage-discover" className="relative scroll-mt-20">
          <CosmicExplorerSection />
        </div>

        {/* 4. Discover LaunchByte & Opportunities Domains */}
        <AboutLaunchByteSection />

        <div id="stage-explore" className="relative scroll-mt-20">
          <ExploreCategoriesSection />
        </div>

        <MarqueeStrip />

        {/* 5. Featured Hackathons, Community Network, How It Works, Mission */}
        <div id="stage-apply" className="relative scroll-mt-20">
          <FeaturedOpportunitiesSection />
        </div>

        <div id="stage-connect" className="relative scroll-mt-20">
          <CommunityNetworkSection />
        </div>

        <div id="stage-build" className="relative scroll-mt-20">
          <HowItWorksSection />
        </div>

        <MissionVisionSection />

        {/* 6. Connected Communities — Interactive Developer Ecosystem Hub */}
        <div id="connected-communities" className="relative scroll-mt-20">
          <PartnersLogoRow />
        </div>

        {/* 7. Loved by Hackathon Builders & Fellows (One Large Carousel when quotes exist) */}
        <TestimonialsCarousel />

        {/* 8. Meet the Core Team */}
        <div id="core-team" className="relative scroll-mt-20">
          <CoreTeamSection />
        </div>

        {/* 9. Partner with LaunchByte (Immediately after Meet the Core Team) */}
        <div id="partner-with-launchbyte" className="relative scroll-mt-20">
          <PartnerContactSection />
        </div>

        {/* 10. Ready to Build Your Next Breakthrough? (Closing CTA before FAQ) */}
        <div id="stage-launch" className="relative scroll-mt-20">
          <FinalCtaSection />
        </div>

        {/* 11. Frequently Asked Questions (Final content section directly before Footer) */}
        <div id="faq" className="relative scroll-mt-20">
          <FaqAccordionSection />
        </div>
      </AstronautJourney>
    </div>
  );
}
