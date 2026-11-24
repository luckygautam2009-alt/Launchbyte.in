/**
 * Centralized Site Content & Company Profile Configuration
 *
 * NOTE: All placeholder content is marked with TODO comments so you can
 * easily customize names, metrics, testimonials, and partner logos in one place.
 */

export interface ImpactMetric {
  id: string;
  label: string;
  count: number;
  suffix?: string;
  prefix?: string;
  description: string;
  isPlaceholder?: boolean;
}

export interface PartnerLogo {
  id: string;
  name: string;
  category: string;
  symbol: string; // text symbol or icon abbreviation
  placeholderUrl?: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  name: string;
  role: string;
  organization: string;
  avatarText: string;
  verifiedBadge?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "students" | "organizers" | "partners" | "general";
}

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  tag: string;
}

export interface CompanyValue {
  title: string;
  description: string;
  iconName: string;
}

export const SITE_CONTENT = {
  // 1. Impact Metrics (TODO: Replace placeholder values when live counts are unavailable)
  impactMetrics: [
    {
      id: "opportunities",
      label: "Verified Opportunities",
      count: 480, // TODO: Update with actual live count
      suffix: "+",
      description: "Hackathons, fellowships & research grants",
      isPlaceholder: true,
    },
    {
      id: "builders",
      label: "Student Builders",
      count: 12500, // TODO: Update with actual registered builders count
      suffix: "+",
      description: "Active developers across 60+ universities",
      isPlaceholder: true,
    },
    {
      id: "events",
      label: "Events & Sprints Hosted",
      count: 140, // TODO: Update with actual events hosted count
      suffix: "+",
      description: "Completed with verified judging & payouts",
      isPlaceholder: true,
    },
    {
      id: "organizations",
      label: "Partner Organizations",
      count: 85, // TODO: Update with actual organization count
      suffix: "+",
      description: "Venture labs, devtool sponsors & universities",
      isPlaceholder: true,
    },
  ] as ImpactMetric[],

  // 2. Mission & Vision
  missionVision: {
    eyebrow: "Purpose & Trajectory",
    heading: "Bridging the Chasm Between Learning to Code and Shipping Reality.",
    mission: {
      title: "Our Mission",
      statement:
        "To dismantle the bureaucratic friction of student tech by curating verified, zero-scam hackathons, fostering multi-disciplinary squads, and giving every ambitious student engineer verifiable proof of execution.",
      points: [
        "Curate opportunities with zero sponsored spam or paywalls.",
        "Guarantee transparent evaluation rubrics and verified prize escrows.",
        "Empower student squads to build production-grade software.",
      ],
    },
    vision: {
      title: "Our Vision",
      statement:
        "An open builder economy where talent is recognized by shipped software and peer reputation, rather than institutional pedigree or resume buzzwords.",
      points: [
        "Global interconnected network of campus developer ecosystems.",
        "Cryptographically signed builder portfolios recognized by top tech teams.",
        "Continuous support pipeline from first weekend sprint to venture backing.",
      ],
    },
  },

  // 3. Partners / Sponsors Logo Row (TODO: Update with approved partner names/logos)
  partners: [
    { id: "p1", name: "Nebula Protocol", category: "Cloud & AI", symbol: "NP" },
    { id: "p2", name: "Solstice Labs", category: "Distributed Systems", symbol: "SL" },
    { id: "p3", name: "Vanguard Devtools", category: "Developer Tools", symbol: "VD" },
    { id: "p4", name: "Aetheria Venture", category: "Venture Capital", symbol: "AV" },
    { id: "p5", name: "Hyperion Systems", category: "Infrastructure", symbol: "HS" },
    { id: "p6", name: "Quantum Campus", category: "University Network", symbol: "QC" },
    { id: "p7", name: "ZeroMatrix Fund", category: "Grants & Fellowships", symbol: "ZM" },
    { id: "p8", name: "Synthetix AI", category: "Autonomous Agents", symbol: "SA" },
  ] as PartnerLogo[],

  // 4. Testimonials (TODO: Replace with verified quotes from student winners and organizers)
  testimonials: [
    {
      id: "t1",
      quote:
        "LaunchByte helped me find my co-founder and frontend lead in 48 hours for the Autonomous Agents hackathon. We shipped our MVP, took first prize, and secured our initial grant.",
      name: "Marcus Brody",
      role: "Founder, AgentFlow",
      organization: "Autonomous Agents Hackathon Winner",
      avatarText: "MB",
      verifiedBadge: "Hackathon Winner",
    },
    {
      id: "t2",
      quote:
        "Unlike standard student job boards that are 90% spam, every listing on LaunchByte has verified organizers and clear deadlines. I landed my compiler engineering fellowship through here.",
      name: "Priya Sundaram",
      role: "Systems Research Fellow",
      organization: "OpenSource Fellowship 2026",
      avatarText: "PS",
      verifiedBadge: "Verified Fellow",
    },
    {
      id: "t3",
      quote:
        "Hosting our university's regional hackathon on LaunchByte saved us weeks of admin overhead. The QR check-in and automated team matching were genuinely flawless.",
      name: "Leo Rivera",
      role: "Lead Organizer",
      organization: "CalTech Builder Summit",
      avatarText: "LR",
      verifiedBadge: "Host Partner",
    },
  ] as TestimonialItem[],

  // 5. Frequently Asked Questions
  faqs: [
    {
      id: "faq-1",
      question: "Is LaunchByte free for students?",
      answer:
        "Yes, 100%. LaunchByte is and will always remain completely free for student developers. There are no hidden fees, paywalls to apply, or subscription tiers for participants.",
      category: "students",
    },
    {
      id: "faq-2",
      question: "How are hackathons and opportunities verified?",
      answer:
        "Every event and fellowship submitted passes through algorithmic screening and manual review to verify legitimate sponsors, transparent judging rubrics, realistic schedules, and guaranteed escrowed prize payouts.",
      category: "general",
    },
    {
      id: "faq-3",
      question: "How does teammate matching work?",
      answer:
        "You can explore open squads or post your own team looking for complementary roles (e.g. backend engineer, UI/UX designer, smart contract auditor). You can review applicant profiles and invite members with one click.",
      category: "students",
    },
    {
      id: "faq-4",
      question: "Can universities or devtool companies partner with LaunchByte?",
      answer:
        "Yes. We collaborate with student developer clubs, engineering departments, and devtool companies to sponsor tracks, distribute grants, and host high-visibility builder sprints.",
      category: "partners",
    },
    {
      id: "faq-5",
      question: "What is the QR Pass and how does event check-in work?",
      answer:
        "When you register for an in-person or hybrid hackathon, LaunchByte generates an offline-ready cryptographic QR pass saved to your dashboard. Organizers scan it at check-in for instant verification.",
      category: "organizers",
    },
  ] as FaqItem[],

  // 6. Our Story Timeline for /about (TODO: Adjust milestones to reflect company trajectory)
  storyTimeline: [
    {
      year: "2024",
      title: "The Genesis",
      description:
        "Frustrated by cluttered student portals and spam-ridden hackathons, a small collective of student engineers built a minimal MVP to organize campus sprints.",
      tag: "Origins",
    },
    {
      year: "2025",
      title: "The Trust Protocol",
      description:
        "Expanded into an automated verification platform, launching digital QR passes, escrow-verified prize pools, and multi-campus squad matching.",
      tag: "Expansion",
    },
    {
      year: "2026",
      title: "The Cosmic Frontier",
      description:
        "Now connecting over 10,000 student builders across 60+ universities with tier-one fellowships, venture grants, and global hackathon ecosystems.",
      tag: "Scale",
    },
  ] as TimelineEvent[],

  // 7. Core Values for /about
  coreValues: [
    {
      title: "Ship Over Talk",
      description:
        "We measure credibility in deployable code, real user feedback, and tangible engineering output rather than resume polish.",
      iconName: "Zap",
    },
    {
      title: "Radical Transparency",
      description:
        "Zero hidden paywalls, verified organizer criteria, transparent judging rubrics, and guaranteed reward distributions.",
      iconName: "ShieldCheck",
    },
    {
      title: "Never Hack Alone",
      description:
        "Tech breakthroughs happen at the intersection of complementary talents. We make finding high-synergy teammates effortless.",
      iconName: "Users",
    },
    {
      title: "Student-First Velocity",
      description:
        "Engineered with zero bloat, instant keyboard workflows, and lightning-fast load times built to respect builders' time.",
      iconName: "Sparkles",
    },
  ] as CompanyValue[],
};
