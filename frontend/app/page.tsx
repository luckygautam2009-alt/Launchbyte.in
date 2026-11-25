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
import CompanyImpactStrip from "@/components/home/CompanyImpactStrip";
import MissionVisionSection from "@/components/home/MissionVisionSection";
import PartnersLogoRow from "@/components/home/PartnersLogoRow";
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
import PartnerContactSection from "@/components/home/PartnerContactSection";
import FinalCtaSection from "@/components/home/FinalCtaSection";
import CoreTeamSection from "@/components/home/CoreTeamSection";
import FaqAccordionSection from "@/components/home/FaqAccordionSection";

export default function HomePage() {
  return (
    <div className="space-y-0 bg-[#050510]">
      {/* 1. Cinematic Opening Hero Section (Preserved) */}
      <HeroSection />

      {/* 2. Orbital Brand Showcase Section with 3D Metallic Emblem (Preserved) */}
      <OrbitalBrandSection />

      <AstronautJourney>
        {/* 3. Discover / Single Ringed Planet Showcase */}
        <div id="stage-discover" className="relative scroll-mt-20">
          <CosmicExplorerSection />
        </div>

        {/* 4. What is LaunchByte? Section */}
        <AboutLaunchByteSection />

        {/* 5. What You Can Explore Section */}
        <div id="stage-explore" className="relative scroll-mt-20">
          <ExploreCategoriesSection />
        </div>

        {/* Marquee Strip */}
        <MarqueeStrip />

        {/* 6. Featured Opportunities Section */}
        <div id="stage-apply" className="relative scroll-mt-20">
          <FeaturedOpportunitiesSection />
        </div>

        {/* 7. Community & Builder Network Section */}
        <div id="stage-connect" className="relative scroll-mt-20">
          <CommunityNetworkSection />
        </div>

        {/* 8. How It Works */}
        <div id="stage-build" className="relative scroll-mt-20">
          <HowItWorksSection />
        </div>

        {/* 9. Company Impact Numbers Strip */}
        <CompanyImpactStrip />

        {/* 10. Mission and Vision Bento Block */}
        <MissionVisionSection />

        {/* 11. Partners / Sponsors */}
        <PartnersLogoRow />

        {/* 12. Testimonials Carousel */}
        <TestimonialsCarousel />

        {/* 13. Partner Contact / Partner With Us Inquiry Form */}
        <PartnerContactSection />

        {/* 14. Final Call To Action */}
        <div id="stage-launch" className="relative scroll-mt-20">
          <FinalCtaSection />
        </div>

        {/* 15. Meet the Core Team */}
        <CoreTeamSection />

        {/* 16. Frequently Asked Questions (Final content section directly above Footer) */}
        <FaqAccordionSection />
      </AstronautJourney>
    </div>
  );
}
