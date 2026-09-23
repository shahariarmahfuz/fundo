export interface PublicSection {
  id: string;
  section_key: string;
  title: string;
  subtitle?: string | null;
  content: string;
  metadata_json?: Record<string, any> | null;
  display_order: number;
}

export interface PublicProject {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  target_amount: number;
  raised_amount: number;
  location: string;
  image_url?: string | null;
  status: string;
  beneficiary_count: number;
  is_featured: boolean;
  created_at: string;
}

export interface PublicStory {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  category: string;
  image_url?: string | null;
  is_published: boolean;
  published_at: string;
}

export interface PublicNewsPost {
  id: string;
  slug: string;
  post_type: 'news' | 'blog' | 'report';
  title: string;
  excerpt: string;
  content: string;
  cover_image?: string | null;
  document_url?: string | null;
  is_published: boolean;
  published_at: string;
}

export interface PublicLeadership {
  id: string;
  name: string;
  role_title: string;
  bio: string;
  avatar_url?: string | null;
  category: string;
  display_order: number;
}

export interface PublicInquiryInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}
