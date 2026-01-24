export interface Ad {
  id: string;                // Unique identifier
  type: 'banner' | 'native' | 'sidebar';
  title: string;             // Ad title for admin
  content: string;           // HTML or JSX content
  imageUrl?: string;         // Optional image
  linkUrl?: string;          // URL to go when clicked
  careers?: string[];        // Optional: target careers
  isActive: boolean;         // Only show if true
  startDate?: string;        // ISO date string
  endDate?: string;          // ISO date string
  impressions?: number;
  clicks?: number;
  createdBy: string;         // admin id
  createdAt: string;
  updatedAt: string;
}
