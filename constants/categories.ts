import { EventCategory } from '../types/database';

export interface CategoryOption {
  value: EventCategory;
  label: string;
  icon: string; // Ionicons name
  color: string;
}

export const EVENT_CATEGORIES: CategoryOption[] = [
  { value: 'travel', label: 'Travel', icon: 'airplane', color: '#3b82f6' },
  { value: 'milestone', label: 'Milestone', icon: 'trophy', color: '#f59e0b' },
  { value: 'health', label: 'Health', icon: 'heart', color: '#ef4444' },
  { value: 'career', label: 'Career', icon: 'briefcase', color: '#8b5cf6' },
  { value: 'relationship', label: 'Relationship', icon: 'people', color: '#ec4899' },
  { value: 'education', label: 'Education', icon: 'school', color: '#06b6d4' },
  { value: 'creative', label: 'Creative', icon: 'color-palette', color: '#f97316' },
  { value: 'financial', label: 'Financial', icon: 'cash', color: '#22c55e' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6b7280' },
];

export function getCategoryOption(value: EventCategory): CategoryOption {
  return EVENT_CATEGORIES.find((c) => c.value === value) ?? EVENT_CATEGORIES[8];
}
