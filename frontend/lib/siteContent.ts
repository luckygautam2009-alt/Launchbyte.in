/**
 * Centralized Site Content & Company Profile Configuration
 *
 * NOTE: Sample content is tagged with // SAMPLE - replace so you can easily
 * replace with your official launch assets.
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
  symbol: string;
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

export interface TeamHighlight {
  id: string;
  title: string;
  role?: string;
  description: string;
}

export interface CoreTeamMember {
  name: string;
  role: string;
  title?: string;
  tagline?: string;
  bio: string;
  photo?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  highlights?: TeamHighlight[];
  skills?: string[];
  focus?: string[];
}

export const SITE_CONTENT = {
  // 1. Impact Metrics (Live counts are dynamically loaded; fallback samples below)
  impactMetrics: [
    {
      id: "opportunities",
      label: "Verified Opportunities",
      count: 48, // SAMPLE - replace
      suffix: "+",
      description: "Hackathons, fellowships & research grants",
      isPlaceholder: true,
    },
    {
      id: "builders",
      label: "Student Builders",
      count: 1200, // SAMPLE - replace
      suffix: "+",
      description: "Active developers across campuses",
      isPlaceholder: true,
    },
    {
      id: "events",
      label: "Events & Sprints",
      count: 24, // SAMPLE - replace
      suffix: "+",
      description: "Organized with verified judging & reviews",
      isPlaceholder: true,
    },
    {
      id: "organizations",
      label: "Partner Organizations",
      count: 16, // SAMPLE - replace
      suffix: "+",
      description: "Developer clubs & collegiate chapters",
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
        "Guarantee transparent evaluation rubrics and verified schedules.",
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

  // 3. Partners / Sponsors (Reduced to 3 sample items per spec)
  partners: [
    { id: "p1", name: "Sample Cloud Partner", category: "Cloud & AI", symbol: "CP" }, // SAMPLE - replace
    { id: "p2", name: "Sample DevTools", category: "Developer Tools", symbol: "DT" }, // SAMPLE - replace
    { id: "p3", name: "Sample Campus Labs", category: "University Network", symbol: "CL" }, // SAMPLE - replace
  ] as PartnerLogo[],

  // 4. Testimonials (Reduced to 2 sample items per spec)
  testimonials: [
    {
      id: "t1",
      quote:
        "LaunchByte helped me find my co-founder and frontend lead in 48 hours for our hackathon sprint. We shipped our MVP and secured our initial grant.", // SAMPLE - replace
      name: "Marcus Brody", // SAMPLE - replace
      role: "Student Founder", // SAMPLE - replace
      organization: "Sample Hackathon Winner", // SAMPLE - replace
      avatarText: "MB",
      verifiedBadge: "Hackathon Winner",
    },
    {
      id: "t2",
      quote:
        "Unlike cluttered student job boards, every opportunity here has verified organizers and clear deadlines. Landed my summer engineering fellowship.", // SAMPLE - replace
      name: "Priya Sundaram", // SAMPLE - replace
      role: "Systems Fellow", // SAMPLE - replace
      organization: "Sample Fellowship Fellow", // SAMPLE - replace
      avatarText: "PS",
      verifiedBadge: "Verified Fellow",
    },
  ] as TestimonialItem[],

  // 5. Frequently Asked Questions (Reduced to 3 sample items per spec)
  faqs: [
    {
      id: "faq-1",
      question: "Is LaunchByte free for students?",
      answer:
        "Yes, 100%. LaunchByte is completely free for student developers. There are no fees to apply or join squads.", // SAMPLE - replace
      category: "students",
    },
    {
      id: "faq-2",
      question: "How are hackathons and opportunities verified?",
      answer:
        "Every event and fellowship submitted passes through algorithmic screening and manual review to verify legitimate organizers and transparent timelines.", // SAMPLE - replace
      category: "general",
    },
    {
      id: "faq-3",
      question: "How does teammate matching work?",
      answer:
        "You can explore open squads or post your own team looking for complementary roles (e.g. backend, frontend, design). You can invite members with one click.", // SAMPLE - replace
      category: "students",
    },
  ] as FaqItem[],

  // 6. Our Story Timeline for /about
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
        "Expanded into an automated verification platform, launching digital QR passes, verified listings, and multi-campus squad matching.",
      tag: "Expansion",
    },
    {
      year: "2026",
      title: "The Cosmic Frontier",
      description:
        "Now connecting thousands of student builders with fellowships, venture grants, and global hackathon ecosystems.",
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

  // 8. Core Team (Leadership & Founding Team)
  coreTeam: [
    {
      name: "Yash Gautam",
      role: "Founder & Chief Executive Officer",
      title: "Full-Stack Developer | Product Builder | AI/ML Enthusiast",
      bio: "I build technology-driven products at the intersection of full-stack development, AI/ML, and product engineering. My focus is turning ideas into functional products, solving real-world problems through technology, and building platforms that create meaningful opportunities for students and developers.",
      photo: "/team/yash-gautam.jpg",
      highlights: [
        {
          id: "01",
          title: "INQUEST",
          role: "Product Builder",
          description:
            "Cross-platform dispute intelligence and complaint investigation platform.",
        },
        {
          id: "02",
          title: "SpareRoute",
          role: "Product Builder",
          description: "Automotive spare-parts marketplace platform.",
        },
      ],
      focus: [
        "Full-Stack Development",
        "Product Engineering",
        "AI/ML",
        "System Design",
        "Community Building",
      ],
    },
    {
      name: "Shobhit",
      role: "Co-Founder, LaunchByte",
      bio: "Co-founding partner driving operational alignment, product strategy, and organizational execution across LaunchByte initiatives.",
      photo: "/team/shobhit.jpg",
      focus: [
        "Product Strategy",
        "Operations",
        "Team Execution",
        "Ecosystem Growth",
      ],
    },
    {
      name: "Vidhyansh",
      role: "Head of Community & Event Management",
      bio: "Responsible for community building, event coordination, participant engagement, and event operations across LaunchByte.",
      photo: "/team/vidhyansh.jpg",
      focus: [
        "Community Building",
        "Event Coordination",
        "Participant Engagement",
        "Event Operations",
      ],
    },
    {
      name: "Sreyansh Dixit",
      role: "Technical Head",
      bio: "Leading technical direction, engineering execution, platform development, and technical coordination.",
      photo: "/team/sreyansh-dixit.jpg",
      focus: [
        "Technical Direction",
        "Engineering Execution",
        "Platform Development",
        "Technical Coordination",
      ],
    },
  ] as CoreTeamMember[],
};
