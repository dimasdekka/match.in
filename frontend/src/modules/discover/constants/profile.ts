import man from '@/assets/man.png';
import women from '@/assets/women.png';

export interface DiscoverProfile {
  id: number;
  name: string;
  age: number;
  city: string;
  distance: number;
  bio: string;
  image: string;
  verified: boolean;
  willMatch?: boolean;
  interests: Array<{ label: string; icon: string }>;
}

export const DISCOVER_PROFILES: DiscoverProfile[] = [
  {
    id: 1,
    name: 'Naya',
    age: 24,
    city: 'Jakarta',
    distance: 3,
    image: women,
    verified: true,
    willMatch: true,
    bio: 'Coffee dates, live music, and Sunday walks.',
    interests: [
      { label: 'Coffee', icon: 'solar:cup-hot-bold' },
      { label: 'Music', icon: 'solar:music-note-bold' },
      { label: 'Travel', icon: 'mingcute:airplane-fill' },
    ],
  },
  {
    id: 2,
    name: 'Arga',
    age: 27,
    city: 'Bandung',
    distance: 6,
    image: man,
    verified: true,
    bio: 'Weekend hikes, good food, and spontaneous road trips.',
    interests: [
      { label: 'Travel', icon: 'mingcute:airplane-fill' },
      { label: 'Fitness', icon: 'solar:dumbbell-large-bold' },
      { label: 'Foodie', icon: 'solar:chef-hat-bold' },
    ],
  },
  {
    id: 3,
    name: 'Salsa',
    age: 23,
    city: 'Jakarta',
    distance: 8,
    image: women,
    verified: false,
    bio: 'Bookstores, film photography, and trying every matcha in town.',
    interests: [
      { label: 'Books', icon: 'solar:book-bold' },
      { label: 'Photo', icon: 'solar:camera-bold' },
      { label: 'Movies', icon: 'solar:clapperboard-play-bold' },
    ],
  },
  {
    id: 4,
    name: 'Raka',
    age: 26,
    city: 'Depok',
    distance: 11,
    image: man,
    verified: true,
    willMatch: true,
    bio: 'Designer by day, home cook by night. Tell me your comfort food.',
    interests: [
      { label: 'Design', icon: 'solar:pen-new-round-bold' },
      { label: 'Foodie', icon: 'solar:chef-hat-bold' },
      { label: 'Music', icon: 'solar:music-note-bold' },
    ],
  },
];

export const DISCOVER_NAV = [
  { id: 'likes', icon: 'solar:widget-3-bold' },
  { id: 'discover', icon: 'solar:home-2-bold' },
  { id: 'chats', icon: 'solar:chat-round-dots-bold' },
] as const;
