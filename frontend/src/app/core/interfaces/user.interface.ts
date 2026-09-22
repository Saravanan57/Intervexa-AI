export interface Education {
  institution: string;
  degree: string;
  startYear?: number;
  endYear?: number;
}

export interface Project {
  name: string;
  description?: string;
  link?: string;
}

export interface Certificate {
  name: string;
  issuingOrg?: string;
  issueDate?: string;
  link?: string;
}

export interface Achievement {
  badgeName: string;
  badgeIcon: string;
  description: string;
  awardedAt?: string;
}

export interface Role {
  id?: string;
  name: 'admin' | 'candidate';
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'candidate';
  profileImage?: string;
  phone?: string;
  college?: string;
  skills: string[];
  experience: number;
  resume?: string | null;
  status: 'active' | 'inactive' | 'pending';
  isVerified: boolean;
  createdDate?: string;

  // New Fields
  education?: Education[];
  projects?: Project[];
  certificates?: Certificate[];
  linkedIn?: string;
  gitHub?: string;
  portfolioWebsite?: string;
  preferredJobRole?: string;
  preferredInterviewLanguage?: string;
  achievements?: Achievement[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}
