import type { Gender } from '@/@types';
export const CITIES = [
  'Jakarta',
  'Bandung',
  'Surabaya',
  'Yogyakarta',
  'Semarang',
  'Medan',
  'Makassar',
  'Palembang',
  'Denpasar',
  'Malang',
  'Bogor',
  'Tangerang',
  'Bekasi',
  'Depok',
  'Solo',
];
export const INTERESTS = [
  { id: 'Coffee', icon: 'solar:cup-hot-bold' },
  { id: 'Travel', icon: 'mingcute:airplane-fill' },
  { id: 'Music', icon: 'solar:music-note-bold' },
  { id: 'Movies', icon: 'solar:clapperboard-play-bold' },
  { id: 'Fitness', icon: 'solar:dumbbell-large-bold' },
  { id: 'Foodie', icon: 'solar:chef-hat-bold' },
  { id: 'Photography', icon: 'solar:camera-bold' },
  { id: 'Books', icon: 'solar:book-bold' },
  { id: 'Gaming', icon: 'solar:gamepad-bold' },
];
export const TARGETS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Women' },
  { value: 'male', label: 'Men' },
  { value: 'all', label: 'Everyone' },
];
export const MAX_PHOTOS = 6;
