import { MoodValue } from '../types/database';

export interface MoodOption {
  value: MoodValue;
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 1, emoji: '😞', label: 'Awful', color: '#ef4444', bgColor: '#fef2f2' },
  { value: 2, emoji: '😔', label: 'Bad', color: '#f97316', bgColor: '#fff7ed' },
  { value: 3, emoji: '😐', label: 'Okay', color: '#eab308', bgColor: '#fefce8' },
  { value: 4, emoji: '😊', label: 'Good', color: '#22c55e', bgColor: '#f0fdf4' },
  { value: 5, emoji: '😄', label: 'Great', color: '#3b82f6', bgColor: '#eff6ff' },
];

export function getMoodOption(value: MoodValue): MoodOption {
  return MOOD_OPTIONS[value - 1];
}
