import { ResumeData } from '../../../types/resume';

export const INITIAL_EMPTY_RESUME: ResumeData = {
  personalInfo: {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    summary: '',
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    photo: '',
    photoShape: 'circle',
    photoPosition: 'right',
    showPhotoInAts: false,
  },
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  projects: [],
  sectionVisibility: {
    experience: true,
    education: true,
    skills: true,
    languages: true,
    certifications: true,
    projects: true,
  },
  designSettings: {
    template: 'modern',
    accentColor: '#4f46e5', // Indigo
    fontFamily: 'sans',
    fontSize: 'normal',
  },
};

export const EXAMPLE_RESUME: ResumeData = {
  personalInfo: {
    fullName: 'Alex Vance',
    jobTitle: 'Senior Full-Stack Software Engineer',
    email: 'alex.vance@example.com',
    phone: '+971 50 123 4567',
    city: 'Dubai',
    country: 'United Arab Emirates',
    summary:
      'High-performing software engineer with 7+ years of experience architecting scalable distributed systems and responsive modern web applications. Proven track record leading agile engineering squads, slashing API latency by 45%, and delivering mission-critical cloud solutions.',
    linkedinUrl: 'linkedin.com/in/alexvance-demo',
    portfolioUrl: 'alexvance.dev',
    githubUrl: 'github.com/alexvance',
  },
  experience: [
    {
      id: 'exp-1',
      jobTitle: 'Lead Frontend Architect',
      company: 'Apex Cloud Solutions',
      location: 'Dubai Internet City',
      startDate: '2022-03',
      endDate: '',
      current: true,
      highlights: [
        'Architected high-throughput micro-frontend framework serving 2.4M monthly active users across GCC region.',
        'Spearheaded design system overhaul resulting in 30% reduction in feature delivery cycle time.',
        'Mentored team of 8 engineers and conducted rigorous code reviews focusing on accessibility and performance.',
      ],
    },
    {
      id: 'exp-2',
      jobTitle: 'Senior Software Engineer',
      company: 'FinTech Innovations MENA',
      location: 'Abu Dhabi, UAE',
      startDate: '2019-06',
      endDate: '2022-02',
      current: false,
      highlights: [
        'Engineered real-time payment settlement pipelines processing over $15M in daily transactions with 99.99% uptime.',
        'Optimized PostgreSQL query plans and Redis cache invalidation strategies, improving P99 latency by 52%.',
        'Built automated CI/CD deployment pipelines on Kubernetes using Docker and GitHub Actions.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'B.Sc. in Computer Science',
      institution: 'University of Wollongong in Dubai',
      location: 'Dubai, UAE',
      startDate: '2015-09',
      endDate: '2019-05',
      current: false,
      scoreOrGrade: 'First Class Honours (3.9 GPA)',
      description: 'Focused on Distributed Algorithms, Cloud Architecture, and Software Security.',
    },
  ],
  skills: [
    { id: 'sk-1', name: 'TypeScript / React / Next.js', level: 'Expert' },
    { id: 'sk-2', name: 'Node.js / Express / NestJS', level: 'Expert' },
    { id: 'sk-3', name: 'PostgreSQL & Redis Caching', level: 'Advanced' },
    { id: 'sk-4', name: 'Docker / Kubernetes / AWS', level: 'Advanced' },
    { id: 'sk-5', name: 'GraphQL & RESTful APIs', level: 'Advanced' },
    { id: 'sk-6', name: 'Tailwind CSS & Design Systems', level: 'Expert' },
  ],
  languages: [
    { id: 'lang-1', language: 'English', proficiency: 'Native' },
    { id: 'lang-2', language: 'Arabic', proficiency: 'Conversational' },
    { id: 'lang-3', language: 'Urdu', proficiency: 'Fluent' },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect – Professional',
      issuer: 'Amazon Web Services',
      date: '2023',
    },
    {
      id: 'cert-2',
      name: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Linux Foundation',
      date: '2022',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Real-Time Edge Analytics Engine',
      link: 'github.com/alexvance/edge-analytics',
      description: 'Distributed WebSocket event ingestor processing 50k events/sec with Sub-10ms dashboard broadcast latency.',
      technologies: 'Rust, WebSockets, ClickHouse, React',
    },
  ],
  sectionVisibility: {
    experience: true,
    education: true,
    skills: true,
    languages: true,
    certifications: true,
    projects: true,
  },
  designSettings: {
    template: 'modern',
    accentColor: '#2563eb', // Royal Blue
    fontFamily: 'sans',
    fontSize: 'normal',
  },
};
