/**
 * Centralized Site Content & Company Profile Configuration
 * Contains verified LaunchByte data: socials, team, developer communities,
 * structured testimonial slots (no fabricated quotes), and FAQs.
 */

export const LAUNCHBYTE_SOCIALS = {
  linkedin: "https://www.linkedin.com/company/launchbytehq/posts/?viewAsMember=true",
  instagram: "https://www.instagram.com/launch_bytee/?hl=en",
  whatsapp: "https://chat.whatsapp.com/DfB8awNjkjj7UkB5h2eW1e",
  email: "launchbyte.in26@gmail.com",
};

export interface DeveloperCommunity {
  id: string;
  name: string;
  url: string;
  shortLabel?: string;
}

export interface TestimonialSlot {
  id: string;
  name: string | null;
  quote: string | null;
  role?: string | null;
  photo?: string | null;
  source?: string | null;
  isPublished: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "students" | "organizers" | "partners" | "general";
  ctaLabel?: string;
  ctaHref?: string;
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
  portfolio?: string;
  twitter?: string;
  highlights?: TeamHighlight[];
  skills?: string[];
  focus?: string[];
}

export const SITE_CONTENT = {
  // 1. Official LaunchByte Socials
  socials: LAUNCHBYTE_SOCIALS,

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

  // 3. Developer Communities (Real verified communities with official URLs)
  developerCommunities: [
    {
      id: "codehive",
      name: "CodeHive",
      url: "https://www.codehivee.tech/",
      shortLabel: "Developer Community",
    },
    {
      id: "codersera",
      name: "CodersEra",
      url: "https://www.codersera.in/",
      shortLabel: "Developer Community",
    },
    {
      id: "gdg-noida",
      name: "GDG Noida",
      url: "https://gdgnoida.com/",
      shortLabel: "Google Developer Group",
    },
    {
      id: "gdg-dtc",
      name: "Google Developer Groups on Campus — Delhi Technical Campus, Greater Noida",
      url: "https://gdg.community.dev/gdg-on-campus-delhi-technical-campus-greater-noida-india/",
      shortLabel: "GDG on Campus • Greater Noida",
    },
  ] as DeveloperCommunity[],

  // 4. Testimonials (Maximum 5 slots; quotes must NOT be fabricated — only published once verified)
  testimonials: [
    {
      id: "slot-1",
      name: "Vivek Dubey",
      quote: null,
      role: null,
      photo: null,
      source: null,
      isPublished: false,
    },
    {
      id: "slot-2",
      name: "Shivang Mishra",
      quote: null,
      role: null,
      photo: null,
      source: null,
      isPublished: false,
    },
    {
      id: "slot-3",
      name: "Prashant Pandey",
      quote: null,
      role: null,
      photo: null,
      source: null,
      isPublished: false,
    },
    {
      id: "slot-4",
      name: "Himanshu Bisht",
      quote: null,
      role: null,
      photo: null,
      source: null,
      isPublished: false,
    },
    {
      id: "slot-5",
      name: null,
      quote: null,
      role: null,
      photo: null,
      source: null,
      isPublished: false,
    },
  ] as TestimonialSlot[],

  // 5. Frequently Asked Questions (5 questions total)
  faqs: [
    {
      id: "faq-1",
      question: "Is LaunchByte free for students?",
      answer:
        "Yes, 100%. LaunchByte is completely free for student developers. There are no fees to apply or join squads.",
      category: "students",
    },
    {
      id: "faq-2",
      question: "How are hackathons and opportunities verified?",
      answer:
        "Every event and fellowship submitted passes through algorithmic screening and manual review to verify legitimate organizers and transparent timelines.",
      category: "general",
    },
    {
      id: "faq-3",
      question: "How does teammate matching work?",
      answer:
        "You can explore open squads or post your own team looking for complementary roles (e.g. backend, frontend, design). You can invite members with one click.",
      category: "students",
    },
    {
      id: "faq-4",
      question: "How can I host my own event on LaunchByte?",
      answer:
        "Organizers can submit their event through the Host an Event form. Every submission is reviewed by the LaunchByte team before it is published.",
      category: "organizers",
      ctaLabel: "Go to Host an Event",
      ctaHref: "/host",
    },
    {
      id: "faq-5",
      question: "How can I list an opportunity on LaunchByte?",
      answer:
        "Opportunity listings are managed by approved LaunchByte contributors. Core team members can request listing access, and approved contributors can submit opportunities for review and publishing.",
      category: "general",
      ctaLabel: "Request Listing Access",
      ctaHref: "/contributor/request-access",
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
        "Connecting student builders with verified hackathons, fellowships, and developer communities.",
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

  // 8. Core Team (Exactly 4 members — Saumya removed)
  coreTeam: [
    {
      name: "Yash Gautam",
      role: "Founder & CEO",
      title: "Full-Stack Developer | Product Builder | AI/ML Enthusiast",
      bio: "I build technology-driven products at the intersection of full-stack development, AI/ML, and product engineering. My focus is turning ideas into functional products, solving real-world problems through technology, and building platforms that create meaningful opportunities for students and developers.",
      photo: "/team/yash-gautam.jpg",
      linkedin: "https://www.linkedin.com/in/yash-gautam-1b9150383/",
      github: "https://github.com/luckygautam2009-alt",
      portfolio: "https://yash-gautam-portfolio-v4xf.vercel.app/",
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
      name: "Vidhyansh Rajput",
      role: "Head of Community & Event Management",
      bio: "Responsible for community building, event coordination, participant engagement, and event operations across LaunchByte.",
      photo: "/team/vidhyansh.jpg",
      linkedin: "https://www.linkedin.com/in/vidhyansh-rajput-856441370/",
      github: "https://github.com/vidhyanshrajput44-a11y",
      focus: [
        "Community Building",
        "Event Coordination",
        "Participant Engagement",
        "Event Operations",
      ],
    },
    {
      name: "Shobhit Srivastava",
      role: "Co-Founder",
      bio: "Co-founding partner driving operational alignment, product strategy, and organizational execution across LaunchByte initiatives.",
      photo: "/team/shobhit.jpg",
      linkedin: "https://www.linkedin.com/in/shobhit-srivastava-7842083b9/",
      focus: [
        "Product Strategy",
        "Operations",
        "Team Execution",
        "Ecosystem Growth",
      ],
    },
    {
      name: "Sreyansh Dixit",
      role: "Technical Head",
      bio: "Leading technical direction, engineering execution, platform development, and technical coordination.",
      photo: "/team/sreyansh-dixit.jpg",
      linkedin: "https://www.linkedin.com/in/sreyansh-dixit-4aba56372/",
      focus: [
        "Technical Direction",
        "Engineering Execution",
        "Platform Development",
        "Technical Coordination",
      ],
    },
  ] as CoreTeamMember[],
};
