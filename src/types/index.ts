export type CategoryId =
  | 'career'
  | 'uae-employee'
  | 'ai-photo-prompts'
  | 'ai-video-prompts'
  | 'image-tools'
  | 'text-tools'
  | 'calculators'
  | 'productivity';

export interface ToolDefinition {
  id: string;
  name: string;
  nameUrdu: string;
  shortDescription: string;
  shortDescriptionUrdu: string;
  fullDescription: string;
  fullDescriptionUrdu: string;
  category: CategoryId;
  categoryName: string;
  categoryNameUrdu: string;
  iconName: string; // Lucide icon identifier
  keywords: string[];
  isPopular?: boolean;
  isFeatured?: boolean;
}

export type Language = 'en' | 'ur';

export type Theme = 'light' | 'dark';
