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
      role: "Founder & Chief Executive Officer — LaunchByte",
      tagline: "Building products, communities, and opportunities for the next generation of builders.",
      bio: "Product architect, full-stack developer, and founder dedicated to building real-world products and student-focused technology initiatives. Experienced in full-stack web engineering, dispute intelligence systems, and marketplace platforms, with a strong focus on AI/ML, intelligent automation, and community ecosystem leadership.",
      photo: "/team/yash-gautam.jpg",
      highlights: [
        {
          id: "01",
          title: "LAUNCHBYTE",
          role: "Founder & CEO",
          description: "Building a student-driven technology and opportunity ecosystem.",
        },
        {
          id: "02",
          title: "INQUEST",
          role: "Product Builder",
          description: "Dispute intelligence and customer support investigation platform.",
        },
        {
          id: "03",
          title: "SPAREROUTE",
          role: "Product Builder",
          description: "Spare-parts marketplace ecosystem.",
        },
        {
          id: "04",
          title: "FULL-STACK DEVELOPMENT",
          role: "Core Systems",
          description: "Building web applications, scalable product experiences, and complete frontend/backend systems.",
        },
      ],
      skills: [
        "Full-Stack Web Systems",
        "AI/ML & Intelligent Systems",
        "Product Engineering",
        "Hackathon & Ecosystem Leadership",
      ],
    },
    {
      name: "Shobhit",
      role: "Co-Founder",
      tagline: "Driving strategic initiatives, team coordination, and ecosystem growth.",
      bio: "Co-founding partner spearheading strategic direction, team alignment, and operational execution across LaunchByte initiatives. Focused on turning product vision into organized, scalable community systems.",
      photo: "/team/shobhit.jpg",
      highlights: [
        {
          id: "01",
          title: "OPERATIONAL EXECUTION",
          role: "Co-Founder",
          description: "Aligning team initiatives and student community roadmaps.",
        },
        {
          id: "02",
          title: "STRATEGIC GROWTH",
          role: "Leadership",
          description: "Expanding partnerships and collaborative ecosystem opportunities.",
        },
      ],
      skills: [
        "Product Strategy",
        "Operations",
        "Team Execution",
        "Ecosystem Growth",
      ],
    },
    {
      name: "Vidhyansh",
      role: "Head of Community & Event Management",
      tagline: "Cultivating high-energy developer communities and flagship tech gatherings.",
      bio: "Leading student community engagement, ambassador initiatives, and event operations. Passionate about empowering collegiate developers, coordinating hackathons, and fostering inclusive tech spaces.",
      photo: "/team/vidhyansh.jpg",
      highlights: [
        {
          id: "01",
          title: "EVENT ORCHESTRATION",
          role: "Lead",
          description: "Managing hackathons, sprints, and technical workshops.",
        },
        {
          id: "02",
          title: "COMMUNITY ENGAGEMENT",
          role: "Leadership",
          description: "Scaling collegiate builder squads and developer networks.",
        },
      ],
      skills: [
        "Community Building",
        "Hackathon Management",
        "Developer Outreach",
        "Team Coordination",
      ],
    },
    {
      name: "Sreyansh Dixit",
      role: "Technical Head",
      tagline: "Overseeing technical infrastructure, software quality, and engineering standards.",
      bio: "Directing technical architecture, developer standards, and platform reliability across LaunchByte's codebase. Dedicated to building secure, performant software systems and guiding engineering initiatives.",
      photo: "/team/sreyansh-dixit.jpg",
      highlights: [
        {
          id: "01",
          title: "SYSTEM ARCHITECTURE",
          role: "Technical Head",
          description: "Overseeing application architecture, data pipelines, and API reliability.",
        },
        {
          id: "02",
          title: "ENGINEERING STANDARDS",
          role: "Core Systems",
          description: "Enforcing clean code, developer workflows, and secure deployments.",
        },
      ],
      skills: [
        "System Architecture",
        "Cloud Infrastructure",
        "API Design",
        "Security & Reliability",
      ],
    },
  ] as CoreTeamMember[],
};
