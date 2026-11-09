export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  scoreOrGrade?: string;
  description?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native' | 'Bilingual';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialUrl?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  link?: string;
  description: string;
  technologies?: string;
}

export interface ResumeData {
  personalInfo: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    summary: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    githubUrl?: string;
    photo?: string; // Base64 data URI of the profile photo
    photoShape?: 'circle' | 'square';
    photoPosition?: 'right' | 'left';
    showPhotoInAts?: boolean; // Optional override for ATS template
  };
  experience: WorkExperience[];
  education: Education[];
  skills: SkillItem[];
  languages: LanguageItem[];
  certifications: Certification[];
  projects: ProjectItem[];
  sectionVisibility: {
    experience: boolean;
    education: boolean;
    skills: boolean;
    languages: boolean;
    certifications: boolean;
    projects: boolean;
  };
  designSettings: {
    template: 'modern' | 'classic' | 'minimal' | 'ats';
    accentColor: string;
    fontFamily: 'sans' | 'serif' | 'mono';
    fontSize: 'compact' | 'normal' | 'relaxed';
  };
}
