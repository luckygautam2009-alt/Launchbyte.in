"use client";

import React from "react";
import HeroSection from "@/components/home/HeroSection";
import OrbitalBrandSection from "@/components/home/OrbitalBrandSection";
import AstronautJourney from "@/components/home/AstronautJourney";
import SectionBridge from "@/components/home/SectionBridge";
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
import FaqAccordionSection from "@/components/home/FaqAccordionSection";
import PartnerContactSection from "@/components/home/PartnerContactSection";
import CoreTeamSection from "@/components/home/CoreTeamSection";
import FinalCtaSection from "@/components/home/FinalCtaSection";

export default function HomePage() {
  return (
    <div className="space-y-0 overflow-hidden bg-[#050510]">
      {/* 1. Cinematic Opening Hero Section (Preserved) */}
      <HeroSection />

      {/* 2. Orbital Brand Showcase Section with 3D Metallic Emblem (Preserved) */}
      <OrbitalBrandSection />

      {/* 
        Scroll-Driven Astronaut Journey Storytelling Layer:
        Starts only after section 2 ends. Wraps sections 3 through 9/Final CTA.
      */}
      <AstronautJourney>
        {/* Section Bridge: Transition Between Logo Showcase & The Cosmic Frontier */}
        <SectionBridge
          label="SECTOR 02 → THE FRONTIER"
          sublabel="ORBITAL VECTOR // 02.EXP"
          glowColor="violet"
        />

        {/* 3. Reference Astronaut On Alien Planet Looking into Cosmos (Clean & Cinematic) */}
        <div id="stage-discover" className="relative scroll-mt-24">
          <div className="md:hidden flex items-center justify-center gap-1.5 pt-6 pb-2 text-[10px] font-mono uppercase tracking-widest text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>STAGE 01 // DISCOVER</span>
          </div>
          <CosmicExplorerSection />
        </div>

        {/* 4. What is LaunchByte? Section */}
        <AboutLaunchByteSection />

        {/* 5. What You Can Explore Section (7 Distinct Domain Cards) */}
        <div id="stage-explore" className="relative scroll-mt-24">
          <div className="md:hidden flex items-center justify-center gap-1.5 pt-6 pb-2 text-[10px] font-mono uppercase tracking-widest text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>STAGE 02 // EXPLORE</span>
          </div>
          <ExploreCategoriesSection />
        </div>

        {/* Marquee Strip Placed Between Section 5 and 6 (Never Near 1 to 3) */}
        <MarqueeStrip />

        {/* 6. Featured Opportunities Section (Dynamic Real Data & Category Tabs) */}
        <div id="stage-apply" className="relative scroll-mt-24">
          <div className="md:hidden flex items-center justify-center gap-1.5 pt-6 pb-2 text-[10px] font-mono uppercase tracking-widest text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>STAGE 03 // APPLY</span>
          </div>
          <FeaturedOpportunitiesSection />
        </div>

        {/* 7. Community & Builder Network Section (Teammate Finder & Active Squads) */}
        <div id="stage-connect" className="relative scroll-mt-24">
          <div className="md:hidden flex items-center justify-center gap-1.5 pt-6 pb-2 text-[10px] font-mono uppercase tracking-widest text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>STAGE 04 // CONNECT</span>
          </div>
          <CommunityNetworkSection />
        </div>

        {/* 8. How It Works (3-Step Journey: Discover → Participate → Grow) */}
        <div id="stage-build" className="relative scroll-mt-24">
          <div className="md:hidden flex items-center justify-center gap-1.5 pt-6 pb-2 text-[10px] font-mono uppercase tracking-widest text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>STAGE 05 // BUILD</span>
          </div>
          <HowItWorksSection />
        </div>

        {/* Section Bridge: Transition to Ecosystem Trajectory & Company Profile */}
        <SectionBridge
          label="SECTOR 03 → THE ECOSYSTEM"
          sublabel="VELOCITY PROTOCOL // 03.EXP"
          glowColor="cyan"
        />

        {/* 9. Company Impact Numbers Strip (Animated Count-Up) */}
        <CompanyImpactStrip />

        {/* 10. Mission and Vision Bento Block */}
        <MissionVisionSection />

        {/* 11. Partners / Sponsors Grayscale to Color Logo Row */}
        <PartnersLogoRow />

        {/* 12. Testimonials Carousel */}
        <TestimonialsCarousel />

        {/* 13. FAQ Interactive Accordion */}
        <FaqAccordionSection />

        {/* 14. Partner Contact / Partner With Us Inquiry Form */}
        <PartnerContactSection />

        {/* 15. Core Team Showcase */}
        <CoreTeamSection />

        {/* 16. Final Call To Action (Cinematic Cosmic CTA & Rocket Liftoff Stage) */}
        <div id="stage-launch" className="relative scroll-mt-24">
          <div className="md:hidden flex items-center justify-center gap-1.5 pt-6 pb-2 text-[10px] font-mono uppercase tracking-widest text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>STAGE 06 // LAUNCH</span>
          </div>
          <FinalCtaSection />
        </div>
      </AstronautJourney>
    </div>
  );
}
