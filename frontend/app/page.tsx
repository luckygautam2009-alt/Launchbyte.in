"use client";

import React from "react";
import dynamic from "next/dynamic";
import LaunchByteIntro from "@/components/intro/LaunchByteIntro";
import HeroSection from "@/components/home/HeroSection";
import AstronautJourney from "@/components/home/AstronautJourney";

const OrbitalBrandSection = dynamic(() => import("@/components/home/OrbitalBrandSection"), {
  ssr: false,
  loading: () => <div className="min-h-[300px]" />,
});

const CosmicExplorerSection = dynamic(() => import("@/components/home/CosmicExplorerSection"), {
  loading: () => <div className="min-h-[300px]" />,
});

const AboutLaunchByteSection = dynamic(() => import("@/components/home/AboutLaunchByteSection"), {
  loading: () => <div className="min-h-[200px]" />,
});

const ExploreCategoriesSection = dynamic(() => import("@/components/home/ExploreCategoriesSection"), {
  loading: () => <div className="min-h-[200px]" />,
});

const MarqueeStrip = dynamic(() => import("@/components/home/MarqueeStrip"), {
  loading: () => <div className="min-h-[80px]" />,
});

const FeaturedOpportunitiesSection = dynamic(
  () => import("@/components/home/FeaturedOpportunitiesSection"),
  {
    loading: () => <div className="min-h-[300px]" />,
  }
);

const CommunityNetworkSection = dynamic(() => import("@/components/home/CommunityNetworkSection"), {
  loading: () => <div className="min-h-[200px]" />,
});

const HowItWorksSection = dynamic(() => import("@/components/home/HowItWorksSection"), {
  loading: () => <div className="min-h-[200px]" />,
});

const MissionVisionSection = dynamic(() => import("@/components/home/MissionVisionSection"), {
  loading: () => <div className="min-h-[200px]" />,
});

const PartnersLogoRow = dynamic(() => import("@/components/home/PartnersLogoRow"), {
  loading: () => <div className="min-h-[150px]" />,
});

const TestimonialsCarousel = dynamic(() => import("@/components/home/TestimonialsCarousel"), {
  loading: () => <div className="min-h-[200px]" />,
});

const CoreTeamSection = dynamic(() => import("@/components/home/CoreTeamSection"), {
  loading: () => <div className="min-h-[300px]" />,
});

const PartnerContactSection = dynamic(() => import("@/components/home/PartnerContactSection"), {
  loading: () => <div className="min-h-[200px]" />,
});

const FinalCtaSection = dynamic(() => import("@/components/home/FinalCtaSection"), {
  loading: () => <div className="min-h-[200px]" />,
});

const FaqAccordionSection = dynamic(() => import("@/components/home/FaqAccordionSection"), {
  loading: () => <div className="min-h-[200px]" />,
});

export default function HomePage() {
  return (
    <div className="space-y-0 bg-transparent">
      <LaunchByteIntro />

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
